import React, { useRef, useState } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { PrintProfile } from '../types';

interface PrintPreviewModalProps {
  isOpen: boolean;
  title: string;
  defaultProfile: PrintProfile;
  renderHtml: (profile: PrintProfile) => string;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  title,
  defaultProfile,
  renderHtml,
  onClose,
}) => {
  const [profile, setProfile] = useState<PrintProfile>(defaultProfile);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const htmlContent = renderHtml(profile);

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${profile.toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[88vh] w-full max-w-4xl flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-xs text-[var(--app-muted-text)]">
              Print preview — choose layout profile or print directly
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 text-xs text-[var(--app-muted-text)]">
              Profile:
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value as PrintProfile)}
                className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-text)]"
              >
                <option value="A4">A4 Standard</option>
                <option value="A5">A5 Half-page</option>
                <option value="Thermal80">80mm Thermal POS</option>
                <option value="Thermal58">58mm Thermal POS</option>
              </select>
            </label>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-medium hover: opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              Export HTML
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Printer className="h-3.5 w-3.5" />
              Print (Ctrl+P)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-[var(--app-muted-text)] hover:bg-[var(--app-muted-panel)] hover:text-[var(--app-text)]"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-[#e5e7eb] p-4">
          <iframe
            ref={iframeRef}
            title={title}
            srcDoc={htmlContent}
            className="h-full w-full rounded border border-gray-300 bg-white shadow-inner"
          />
        </div>
      </div>
    </div>
  );
};
