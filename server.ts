import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInitialDatabaseState } from './src/services/billingEngine';
import {
  initSqliteDatabase,
  loadFullStateFromSqlite,
  saveFullStateToSqlite,
  getSqliteDbStats,
  getDbPath,
} from './src/server/sqliteDb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Initialize SQLite database and tables
  try {
    await initSqliteDatabase();
    console.log(`SQLite database initialized at: ${getDbPath()}`);
  } catch (err) {
    console.error('Failed to initialize SQLite database:', err);
  }

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'Retail Billing',
      database: 'SQLite',
      dbPath: getDbPath(),
      version: '1.0.0',
    });
  });

  app.get('/api/sqlite/info', async (_req, res) => {
    try {
      const stats = await getSqliteDbStats();
      res.json({ ...stats, dbPath: getDbPath() });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to get SQLite stats' });
    }
  });

  app.get('/api/sqlite/download', (_req, res) => {
    try {
      const dbFile = getDbPath();
      res.download(dbFile, 'retail_billing.sqlite');
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to download SQLite file' });
    }
  });

  app.get('/api/state', async (_req, res) => {
    try {
      const state = await loadFullStateFromSqlite();
      res.json(state);
    } catch (err: any) {
      console.error('Error reading from SQLite:', err);
      // Fallback
      res.json(createInitialDatabaseState());
    }
  });

  app.post('/api/state', async (req, res) => {
    try {
      if (req.body && Array.isArray(req.body.products) && Array.isArray(req.body.parties)) {
        await saveFullStateToSqlite(req.body);
        res.json({ ok: true, database: 'SQLite' });
      } else {
        res.status(400).json({ error: 'Invalid state payload' });
      }
    } catch (err: any) {
      console.error('Error saving to SQLite:', err);
      res.status(500).json({ error: err?.message || 'Failed to persist to SQLite' });
    }
  });

  app.post('/api/reset', async (_req, res) => {
    try {
      const fresh = createInitialDatabaseState();
      await saveFullStateToSqlite(fresh);
      res.json({ ok: true, state: fresh });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to reset SQLite data' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Retail Billing server listening on http://0.0.0.0:${PORT} with SQLite backend`);
  });
}

startServer();
