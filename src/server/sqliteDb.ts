import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import {
  Account,
  AppDatabaseState,
  CashTransaction,
  Category,
  CompanySettings,
  CustomerReceipt,
  HeldSale,
  JournalEntry,
  NumberSequence,
  Party,
  Product,
  Purchase,
  Sale,
  StockMovement,
  SupplierPayment,
  Unit,
} from '../types';
import { createInitialDatabaseState } from '../services/billingEngine';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'retail_billing.sqlite');

let dbClient: Client | null = null;

export function getDbPath(): string {
  return DB_FILE;
}

export function getSqliteClient(): Client {
  if (!dbClient) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbClient = createClient({
      url: `file:${DB_FILE}`,
    });
  }
  return dbClient;
}

export async function initSqliteDatabase(): Promise<void> {
  const db = getSqliteClient();

  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        allows_fractional_quantity INTEGER NOT NULL,
        is_active INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        is_active INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        barcode TEXT NOT NULL,
        category_id INTEGER,
        unit_id INTEGER NOT NULL,
        purchase_price_minor INTEGER NOT NULL,
        selling_price_minor INTEGER NOT NULL,
        current_stock REAL NOT NULL,
        reorder_level REAL NOT NULL,
        notes TEXT NOT NULL,
        is_active INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY,
        party_type TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        opening_balance_minor INTEGER NOT NULL,
        is_active INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY,
        invoice_number TEXT NOT NULL,
        customer_id INTEGER,
        customer_name TEXT NOT NULL,
        sale_date TEXT NOT NULL,
        status TEXT NOT NULL,
        total_amount_minor INTEGER NOT NULL,
        paid_amount_minor INTEGER NOT NULL,
        due_amount_minor INTEGER NOT NULL,
        previous_receivable_minor INTEGER NOT NULL,
        updated_receivable_minor INTEGER NOT NULL,
        notes TEXT NOT NULL,
        cancel_reason TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS sale_lines (
        id INTEGER PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        unit_code TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price_minor INTEGER NOT NULL,
        unit_cost_minor INTEGER NOT NULL,
        line_total_minor INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS held_sales (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        customer_id INTEGER,
        sale_date TEXT NOT NULL,
        paid_amount_text TEXT NOT NULL,
        notes TEXT NOT NULL,
        lines_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY,
        purchase_number TEXT NOT NULL,
        supplier_id INTEGER NOT NULL,
        supplier_name TEXT NOT NULL,
        supplier_invoice_number TEXT NOT NULL,
        purchase_date TEXT NOT NULL,
        status TEXT NOT NULL,
        total_amount_minor INTEGER NOT NULL,
        paid_amount_minor INTEGER NOT NULL,
        due_amount_minor INTEGER NOT NULL,
        previous_payable_minor INTEGER NOT NULL,
        updated_payable_minor INTEGER NOT NULL,
        notes TEXT NOT NULL,
        cancel_reason TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS purchase_lines (
        id INTEGER PRIMARY KEY,
        purchase_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        unit_code TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_purchase_price_minor INTEGER NOT NULL,
        line_total_minor INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS customer_receipts (
        id INTEGER PRIMARY KEY,
        receipt_number TEXT NOT NULL,
        customer_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        receipt_date TEXT NOT NULL,
        status TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        previous_balance_minor INTEGER NOT NULL,
        updated_balance_minor INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        reference TEXT NOT NULL,
        notes TEXT NOT NULL,
        cancel_reason TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS supplier_payments (
        id INTEGER PRIMARY KEY,
        payment_number TEXT NOT NULL,
        supplier_id INTEGER NOT NULL,
        supplier_name TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        status TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        previous_balance_minor INTEGER NOT NULL,
        updated_balance_minor INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        reference TEXT NOT NULL,
        notes TEXT NOT NULL,
        cancel_reason TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY,
        product_id INTEGER NOT NULL,
        movement_date TEXT NOT NULL,
        movement_type TEXT NOT NULL,
        reference_type TEXT NOT NULL,
        reference_id INTEGER,
        reference_number TEXT NOT NULL,
        quantity REAL NOT NULL,
        direction TEXT NOT NULL,
        unit_cost_minor INTEGER NOT NULL,
        description TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS cash_transactions (
        id INTEGER PRIMARY KEY,
        transaction_number TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        reference_type TEXT NOT NULL,
        reference_id INTEGER,
        reference_number TEXT NOT NULL,
        cash_in_minor INTEGER NOT NULL,
        cash_out_minor INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        reference TEXT NOT NULL,
        description TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        account_type TEXT NOT NULL,
        normal_balance TEXT NOT NULL,
        is_system INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY,
        entry_number TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        reference_type TEXT NOT NULL,
        reference_id INTEGER,
        reference_number TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS journal_lines (
        id INTEGER PRIMARY KEY,
        entry_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        account_code TEXT NOT NULL,
        account_name TEXT NOT NULL,
        debit_minor INTEGER NOT NULL,
        credit_minor INTEGER NOT NULL,
        description TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS number_sequences (
        key TEXT PRIMARY KEY,
        prefix TEXT NOT NULL,
        next_value INTEGER NOT NULL,
        padding_width INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS company_settings (
        id INTEGER PRIMARY KEY,
        settings_json TEXT NOT NULL
      );`,
    ],
    'write'
  );

  // Check if database is already populated
  const productCount = await db.execute('SELECT COUNT(*) as count FROM products');
  const count = Number(productCount.rows[0]?.count ?? 0);

  if (count === 0) {
    console.log('Seeding SQLite database with initial retail billing data...');
    const initialData = createInitialDatabaseState();
    await saveFullStateToSqlite(initialData);
  }
}

export async function loadFullStateFromSqlite(): Promise<AppDatabaseState> {
  const db = getSqliteClient();

  const [
    unitsRes,
    catRes,
    prodRes,
    partiesRes,
    salesRes,
    saleLinesRes,
    heldSalesRes,
    purchasesRes,
    purchaseLinesRes,
    receiptsRes,
    paymentsRes,
    stockMovRes,
    cashRes,
    accountsRes,
    journalsRes,
    journalLinesRes,
    seqRes,
    settingsRes,
  ] = await Promise.all([
    db.execute('SELECT * FROM units ORDER BY id ASC'),
    db.execute('SELECT * FROM categories ORDER BY id ASC'),
    db.execute('SELECT * FROM products ORDER BY id ASC'),
    db.execute('SELECT * FROM parties ORDER BY id ASC'),
    db.execute('SELECT * FROM sales ORDER BY id DESC'),
    db.execute('SELECT * FROM sale_lines ORDER BY id ASC'),
    db.execute('SELECT * FROM held_sales ORDER BY created_at DESC'),
    db.execute('SELECT * FROM purchases ORDER BY id DESC'),
    db.execute('SELECT * FROM purchase_lines ORDER BY id ASC'),
    db.execute('SELECT * FROM customer_receipts ORDER BY id DESC'),
    db.execute('SELECT * FROM supplier_payments ORDER BY id DESC'),
    db.execute('SELECT * FROM stock_movements ORDER BY id ASC'),
    db.execute('SELECT * FROM cash_transactions ORDER BY id ASC'),
    db.execute('SELECT * FROM accounts ORDER BY id ASC'),
    db.execute('SELECT * FROM journal_entries ORDER BY id DESC'),
    db.execute('SELECT * FROM journal_lines ORDER BY id ASC'),
    db.execute('SELECT * FROM number_sequences'),
    db.execute('SELECT settings_json FROM company_settings WHERE id = 1'),
  ]);

  const units: Unit[] = unitsRes.rows.map((r) => ({
    id: Number(r.id),
    code: String(r.code),
    name: String(r.name),
    allowsFractionalQuantity: Boolean(r.allows_fractional_quantity),
    isActive: Boolean(r.is_active),
  }));

  const categories: Category[] = catRes.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    description: String(r.description),
    isActive: Boolean(r.is_active),
  }));

  const products: Product[] = prodRes.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    sku: String(r.sku),
    barcode: String(r.barcode),
    categoryId: r.category_id !== null ? Number(r.category_id) : null,
    unitId: Number(r.unit_id),
    purchasePriceMinor: Number(r.purchase_price_minor),
    sellingPriceMinor: Number(r.selling_price_minor),
    currentStock: Number(r.current_stock),
    reorderLevel: Number(r.reorder_level),
    notes: String(r.notes),
    isActive: Boolean(r.is_active),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));

  const parties: Party[] = partiesRes.rows.map((r) => ({
    id: Number(r.id),
    partyType: String(r.party_type) as any,
    name: String(r.name),
    phone: String(r.phone),
    address: String(r.address),
    openingBalanceMinor: Number(r.opening_balance_minor),
    isActive: Boolean(r.is_active),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));

  // Map sale lines by saleId
  const saleLinesMap = new Map<number, any[]>();
  for (const r of saleLinesRes.rows) {
    const sId = Number(r.sale_id);
    if (!saleLinesMap.has(sId)) saleLinesMap.set(sId, []);
    saleLinesMap.get(sId)!.push({
      id: Number(r.id),
      saleId: sId,
      productId: Number(r.product_id),
      productName: String(r.product_name),
      unitCode: String(r.unit_code),
      quantity: Number(r.quantity),
      unitPriceMinor: Number(r.unit_price_minor),
      unitCostMinor: Number(r.unit_cost_minor),
      lineTotalMinor: Number(r.line_total_minor),
    });
  }

  const sales: Sale[] = salesRes.rows.map((r) => {
    const sId = Number(r.id);
    return {
      id: sId,
      invoiceNumber: String(r.invoice_number),
      customerId: r.customer_id !== null ? Number(r.customer_id) : null,
      customerName: String(r.customer_name),
      saleDate: String(r.sale_date),
      status: String(r.status) as any,
      totalAmountMinor: Number(r.total_amount_minor),
      paidAmountMinor: Number(r.paid_amount_minor),
      dueAmountMinor: Number(r.due_amount_minor),
      previousReceivableMinor: Number(r.previous_receivable_minor),
      updatedReceivableMinor: Number(r.updated_receivable_minor),
      notes: String(r.notes),
      cancelReason: r.cancel_reason ? String(r.cancel_reason) : undefined,
      lines: saleLinesMap.get(sId) || [],
      createdAt: String(r.created_at),
    };
  });

  const heldSales: HeldSale[] = heldSalesRes.rows.map((r) => ({
    id: String(r.id),
    displayName: String(r.display_name),
    customerId: r.customer_id !== null ? Number(r.customer_id) : null,
    saleDate: String(r.sale_date),
    paidAmountText: String(r.paid_amount_text),
    notes: String(r.notes),
    lines: JSON.parse(String(r.lines_json || '[]')),
    createdAt: String(r.created_at),
  }));

  // Map purchase lines
  const purchaseLinesMap = new Map<number, any[]>();
  for (const r of purchaseLinesRes.rows) {
    const pId = Number(r.purchase_id);
    if (!purchaseLinesMap.has(pId)) purchaseLinesMap.set(pId, []);
    purchaseLinesMap.get(pId)!.push({
      id: Number(r.id),
      purchaseId: pId,
      productId: Number(r.product_id),
      productName: String(r.product_name),
      unitCode: String(r.unit_code),
      quantity: Number(r.quantity),
      unitPurchasePriceMinor: Number(r.unit_purchase_price_minor),
      lineTotalMinor: Number(r.line_total_minor),
    });
  }

  const purchases: Purchase[] = purchasesRes.rows.map((r) => {
    const pId = Number(r.id);
    return {
      id: pId,
      purchaseNumber: String(r.purchase_number),
      supplierId: Number(r.supplier_id),
      supplierName: String(r.supplier_name),
      supplierInvoiceNumber: String(r.supplier_invoice_number),
      purchaseDate: String(r.purchase_date),
      status: String(r.status) as any,
      totalAmountMinor: Number(r.total_amount_minor),
      paidAmountMinor: Number(r.paid_amount_minor),
      dueAmountMinor: Number(r.due_amount_minor),
      previousPayableMinor: Number(r.previous_payable_minor),
      updatedPayableMinor: Number(r.updated_payable_minor),
      notes: String(r.notes),
      cancelReason: r.cancel_reason ? String(r.cancel_reason) : undefined,
      lines: purchaseLinesMap.get(pId) || [],
      createdAt: String(r.created_at),
    };
  });

  const customerReceipts: CustomerReceipt[] = receiptsRes.rows.map((r) => ({
    id: Number(r.id),
    receiptNumber: String(r.receipt_number),
    customerId: Number(r.customer_id),
    customerName: String(r.customer_name),
    receiptDate: String(r.receipt_date),
    status: String(r.status) as any,
    amountMinor: Number(r.amount_minor),
    previousBalanceMinor: Number(r.previous_balance_minor),
    updatedBalanceMinor: Number(r.updated_balance_minor),
    paymentMethod: String(r.payment_method),
    reference: String(r.reference),
    notes: String(r.notes),
    cancelReason: r.cancel_reason ? String(r.cancel_reason) : undefined,
    createdAt: String(r.created_at),
  }));

  const supplierPayments: SupplierPayment[] = paymentsRes.rows.map((r) => ({
    id: Number(r.id),
    paymentNumber: String(r.payment_number),
    supplierId: Number(r.supplier_id),
    supplierName: String(r.supplier_name),
    paymentDate: String(r.payment_date),
    status: String(r.status) as any,
    amountMinor: Number(r.amount_minor),
    previousBalanceMinor: Number(r.previous_balance_minor),
    updatedBalanceMinor: Number(r.updated_balance_minor),
    paymentMethod: String(r.payment_method),
    reference: String(r.reference),
    notes: String(r.notes),
    cancelReason: r.cancel_reason ? String(r.cancel_reason) : undefined,
    createdAt: String(r.created_at),
  }));

  const stockMovements: StockMovement[] = stockMovRes.rows.map((r) => ({
    id: Number(r.id),
    productId: Number(r.product_id),
    movementDate: String(r.movement_date),
    movementType: String(r.movement_type) as any,
    referenceType: String(r.reference_type),
    referenceId: r.reference_id !== null ? Number(r.reference_id) : null,
    referenceNumber: String(r.reference_number),
    quantity: Number(r.quantity),
    direction: String(r.direction) as any,
    unitCostMinor: Number(r.unit_cost_minor),
    description: String(r.description),
    notes: String(r.notes),
    createdAt: String(r.created_at),
  }));

  const cashTransactions: CashTransaction[] = cashRes.rows.map((r) => ({
    id: Number(r.id),
    transactionNumber: String(r.transaction_number),
    transactionDate: String(r.transaction_date),
    transactionType: String(r.transaction_type) as any,
    referenceType: String(r.reference_type),
    referenceId: r.reference_id !== null ? Number(r.reference_id) : null,
    referenceNumber: String(r.reference_number),
    cashInMinor: Number(r.cash_in_minor),
    cashOutMinor: Number(r.cash_out_minor),
    paymentMethod: String(r.payment_method),
    reference: String(r.reference),
    description: String(r.description),
    notes: String(r.notes),
    createdAt: String(r.created_at),
  }));

  const accounts: Account[] = accountsRes.rows.map((r) => ({
    id: Number(r.id),
    code: String(r.code),
    name: String(r.name),
    accountType: String(r.account_type) as any,
    normalBalance: String(r.normal_balance) as any,
    isSystem: Boolean(r.is_system),
  }));

  const journalLinesMap = new Map<number, any[]>();
  for (const r of journalLinesRes.rows) {
    const eId = Number(r.entry_id);
    if (!journalLinesMap.has(eId)) journalLinesMap.set(eId, []);
    journalLinesMap.get(eId)!.push({
      id: Number(r.id),
      accountId: Number(r.account_id),
      accountCode: String(r.account_code),
      accountName: String(r.account_name),
      debitMinor: Number(r.debit_minor),
      creditMinor: Number(r.credit_minor),
      description: String(r.description),
    });
  }

  const journalEntries: JournalEntry[] = journalsRes.rows.map((r) => {
    const eId = Number(r.id);
    return {
      id: eId,
      entryNumber: String(r.entry_number),
      entryDate: String(r.entry_date),
      referenceType: String(r.reference_type),
      referenceId: r.reference_id !== null ? Number(r.reference_id) : null,
      referenceNumber: String(r.reference_number),
      description: String(r.description),
      status: String(r.status) as any,
      lines: journalLinesMap.get(eId) || [],
      createdAt: String(r.created_at),
    };
  });

  const sequences: Record<string, NumberSequence> = {};
  for (const r of seqRes.rows) {
    sequences[String(r.key)] = {
      key: String(r.key),
      prefix: String(r.prefix),
      nextValue: Number(r.next_value),
      paddingWidth: Number(r.padding_width),
    };
  }

  let settings: CompanySettings;
  const initialSettings = createInitialDatabaseState().settings;
  if (settingsRes.rows.length > 0 && settingsRes.rows[0].settings_json) {
    const parsed = JSON.parse(String(settingsRes.rows[0].settings_json));
    settings = {
      ...initialSettings,
      ...parsed,
      adminUsername: parsed.adminUsername || initialSettings.adminUsername || 'admin',
      adminPassword: parsed.adminPassword || initialSettings.adminPassword || 'Bill1ng!0',
      storeTagline: parsed.storeTagline || initialSettings.storeTagline || 'Quality Products at Wholesale & Retail Rates',
      taxNumber: parsed.taxNumber || initialSettings.taxNumber || 'BIN-002849102-01',
    };
  } else {
    settings = initialSettings;
  }

  return {
    units,
    categories,
    products,
    parties,
    sales,
    heldSales,
    purchases,
    customerReceipts,
    supplierPayments,
    stockMovements,
    cashTransactions,
    accounts,
    journalEntries,
    sequences,
    settings,
  };
}

export async function saveFullStateToSqlite(state: AppDatabaseState): Promise<void> {
  const db = getSqliteClient();
  const tx = await db.transaction('write');

  try {
    // Clear existing
    await tx.execute('DELETE FROM units');
    await tx.execute('DELETE FROM categories');
    await tx.execute('DELETE FROM products');
    await tx.execute('DELETE FROM parties');
    await tx.execute('DELETE FROM sales');
    await tx.execute('DELETE FROM sale_lines');
    await tx.execute('DELETE FROM held_sales');
    await tx.execute('DELETE FROM purchases');
    await tx.execute('DELETE FROM purchase_lines');
    await tx.execute('DELETE FROM customer_receipts');
    await tx.execute('DELETE FROM supplier_payments');
    await tx.execute('DELETE FROM stock_movements');
    await tx.execute('DELETE FROM cash_transactions');
    await tx.execute('DELETE FROM accounts');
    await tx.execute('DELETE FROM journal_entries');
    await tx.execute('DELETE FROM journal_lines');
    await tx.execute('DELETE FROM number_sequences');
    await tx.execute('DELETE FROM company_settings');

    for (const u of state.units) {
      await tx.execute({
        sql: 'INSERT INTO units (id, code, name, allows_fractional_quantity, is_active) VALUES (?, ?, ?, ?, ?)',
        args: [u.id, u.code, u.name, u.allowsFractionalQuantity ? 1 : 0, u.isActive ? 1 : 0],
      });
    }

    for (const c of state.categories) {
      await tx.execute({
        sql: 'INSERT INTO categories (id, name, description, is_active) VALUES (?, ?, ?, ?)',
        args: [c.id, c.name, c.description, c.isActive ? 1 : 0],
      });
    }

    for (const p of state.products) {
      await tx.execute({
        sql: `INSERT INTO products (
          id, name, sku, barcode, category_id, unit_id, purchase_price_minor, selling_price_minor, current_stock, reorder_level, notes, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.id,
          p.name,
          p.sku,
          p.barcode,
          p.categoryId,
          p.unitId,
          p.purchasePriceMinor,
          p.sellingPriceMinor,
          p.currentStock,
          p.reorderLevel,
          p.notes,
          p.isActive ? 1 : 0,
          p.createdAt,
          p.updatedAt,
        ],
      });
    }

    for (const party of state.parties) {
      await tx.execute({
        sql: `INSERT INTO parties (
          id, party_type, name, phone, address, opening_balance_minor, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          party.id,
          party.partyType,
          party.name,
          party.phone,
          party.address,
          party.openingBalanceMinor,
          party.isActive ? 1 : 0,
          party.createdAt,
          party.updatedAt,
        ],
      });
    }

    for (const s of state.sales) {
      await tx.execute({
        sql: `INSERT INTO sales (
          id, invoice_number, customer_id, customer_name, sale_date, status, total_amount_minor, paid_amount_minor, due_amount_minor, previous_receivable_minor, updated_receivable_minor, notes, cancel_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          s.id,
          s.invoiceNumber,
          s.customerId,
          s.customerName,
          s.saleDate,
          s.status,
          s.totalAmountMinor,
          s.paidAmountMinor,
          s.dueAmountMinor,
          s.previousReceivableMinor,
          s.updatedReceivableMinor,
          s.notes,
          s.cancelReason || null,
          s.createdAt,
        ],
      });

      for (const l of s.lines) {
        await tx.execute({
          sql: `INSERT INTO sale_lines (
            id, sale_id, product_id, product_name, unit_code, quantity, unit_price_minor, unit_cost_minor, line_total_minor
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            l.id,
            s.id,
            l.productId,
            l.productName,
            l.unitCode,
            l.quantity,
            l.unitPriceMinor,
            l.unitCostMinor,
            l.lineTotalMinor,
          ],
        });
      }
    }

    for (const h of state.heldSales) {
      await tx.execute({
        sql: `INSERT INTO held_sales (
          id, display_name, customer_id, sale_date, paid_amount_text, notes, lines_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          h.id,
          h.displayName,
          h.customerId,
          h.saleDate,
          h.paidAmountText,
          h.notes,
          JSON.stringify(h.lines),
          h.createdAt,
        ],
      });
    }

    for (const p of state.purchases) {
      await tx.execute({
        sql: `INSERT INTO purchases (
          id, purchase_number, supplier_id, supplier_name, supplier_invoice_number, purchase_date, status, total_amount_minor, paid_amount_minor, due_amount_minor, previous_payable_minor, updated_payable_minor, notes, cancel_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.id,
          p.purchaseNumber,
          p.supplierId,
          p.supplierName,
          p.supplierInvoiceNumber,
          p.purchaseDate,
          p.status,
          p.totalAmountMinor,
          p.paidAmountMinor,
          p.dueAmountMinor,
          p.previousPayableMinor,
          p.updatedPayableMinor,
          p.notes,
          p.cancelReason || null,
          p.createdAt,
        ],
      });

      for (const l of p.lines) {
        await tx.execute({
          sql: `INSERT INTO purchase_lines (
            id, purchase_id, product_id, product_name, unit_code, quantity, unit_purchase_price_minor, line_total_minor
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            l.id,
            p.id,
            l.productId,
            l.productName,
            l.unitCode,
            l.quantity,
            l.unitPurchasePriceMinor,
            l.lineTotalMinor,
          ],
        });
      }
    }

    for (const cr of state.customerReceipts) {
      await tx.execute({
        sql: `INSERT INTO customer_receipts (
          id, receipt_number, customer_id, customer_name, receipt_date, status, amount_minor, previous_balance_minor, updated_balance_minor, payment_method, reference, notes, cancel_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          cr.id,
          cr.receiptNumber,
          cr.customerId,
          cr.customerName,
          cr.receiptDate,
          cr.status,
          cr.amountMinor,
          cr.previousBalanceMinor,
          cr.updatedBalanceMinor,
          cr.paymentMethod,
          cr.reference,
          cr.notes,
          cr.cancelReason || null,
          cr.createdAt,
        ],
      });
    }

    for (const sp of state.supplierPayments) {
      await tx.execute({
        sql: `INSERT INTO supplier_payments (
          id, payment_number, supplier_id, supplier_name, payment_date, status, amount_minor, previous_balance_minor, updated_balance_minor, payment_method, reference, notes, cancel_reason, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          sp.id,
          sp.paymentNumber,
          sp.supplierId,
          sp.supplierName,
          sp.paymentDate,
          sp.status,
          sp.amountMinor,
          sp.previousBalanceMinor,
          sp.updatedBalanceMinor,
          sp.paymentMethod,
          sp.reference,
          sp.notes,
          sp.cancelReason || null,
          sp.createdAt,
        ],
      });
    }

    for (const m of state.stockMovements) {
      await tx.execute({
        sql: `INSERT INTO stock_movements (
          id, product_id, movement_date, movement_type, reference_type, reference_id, reference_number, quantity, direction, unit_cost_minor, description, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          m.id,
          m.productId,
          m.movementDate,
          m.movementType,
          m.referenceType,
          m.referenceId,
          m.referenceNumber,
          m.quantity,
          m.direction,
          m.unitCostMinor,
          m.description,
          m.notes,
          m.createdAt,
        ],
      });
    }

    for (const c of state.cashTransactions) {
      await tx.execute({
        sql: `INSERT INTO cash_transactions (
          id, transaction_number, transaction_date, transaction_type, reference_type, reference_id, reference_number, cash_in_minor, cash_out_minor, payment_method, reference, description, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          c.id,
          c.transactionNumber,
          c.transactionDate,
          c.transactionType,
          c.referenceType,
          c.referenceId,
          c.referenceNumber,
          c.cashInMinor,
          c.cashOutMinor,
          c.paymentMethod,
          c.reference,
          c.description,
          c.notes,
          c.createdAt,
        ],
      });
    }

    for (const a of state.accounts) {
      await tx.execute({
        sql: 'INSERT INTO accounts (id, code, name, account_type, normal_balance, is_system) VALUES (?, ?, ?, ?, ?, ?)',
        args: [a.id, a.code, a.name, a.accountType, a.normalBalance, a.isSystem ? 1 : 0],
      });
    }

    for (const j of state.journalEntries) {
      await tx.execute({
        sql: `INSERT INTO journal_entries (
          id, entry_number, entry_date, reference_type, reference_id, reference_number, description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          j.id,
          j.entryNumber,
          j.entryDate,
          j.referenceType,
          j.referenceId,
          j.referenceNumber,
          j.description,
          j.status,
          j.createdAt,
        ],
      });

      for (const jl of j.lines) {
        await tx.execute({
          sql: `INSERT INTO journal_lines (
            id, entry_id, account_id, account_code, account_name, debit_minor, credit_minor, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            jl.id,
            j.id,
            jl.accountId,
            jl.accountCode,
            jl.accountName,
            jl.debitMinor,
            jl.creditMinor,
            jl.description,
          ],
        });
      }
    }

    for (const key of Object.keys(state.sequences)) {
      const seq = state.sequences[key];
      await tx.execute({
        sql: 'INSERT INTO number_sequences (key, prefix, next_value, padding_width) VALUES (?, ?, ?, ?)',
        args: [seq.key, seq.prefix, seq.nextValue, seq.paddingWidth],
      });
    }

    await tx.execute({
      sql: 'INSERT INTO company_settings (id, settings_json) VALUES (1, ?)',
      args: [JSON.stringify(state.settings)],
    });

    await tx.execute({
      sql: 'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
      args: ['last_saved_at', new Date().toISOString()],
    });

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

export async function getSqliteDbStats() {
  const db = getSqliteClient();
  const tables = [
    'products',
    'categories',
    'units',
    'parties',
    'sales',
    'sale_lines',
    'purchases',
    'purchase_lines',
    'customer_receipts',
    'supplier_payments',
    'stock_movements',
    'cash_transactions',
    'accounts',
    'journal_entries',
    'journal_lines',
  ];

  const tableCounts: Record<string, number> = {};
  for (const table of tables) {
    try {
      const res = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
      tableCounts[table] = Number(res.rows[0]?.count ?? 0);
    } catch {
      tableCounts[table] = 0;
    }
  }

  let fileSize = 0;
  if (fs.existsSync(DB_FILE)) {
    fileSize = fs.statSync(DB_FILE).size;
  }

  return {
    database: 'SQLite',
    dbFile: DB_FILE,
    fileSizeBytes: fileSize,
    fileSizeFormatted: `${(fileSize / 1024).toFixed(1)} KB`,
    tableCounts,
  };
}
