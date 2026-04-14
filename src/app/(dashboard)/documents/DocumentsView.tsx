"use client";
import Link from "next/link";
import { FileText, Upload, Zap } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { Document } from "@/types/database";

const statusCfg: Record<string, { bg: string; color: string; dot: string }> = {
  ready:      { bg: 'rgba(34,197,94,0.1)',  color: '#4ade80', dot: '#4ade80' },
  processing: { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', dot: '#fbbf24' },
  failed:     { bg: 'rgba(239,68,68,0.1)',  color: '#f87171', dot: '#f87171' },
};

const typeColor: Record<string, string> = { PDF: '#f87171', DOCX: '#60a5fa', PPTX: '#fb923c', JPG: '#a78bfa', PNG: '#a78bfa' };

/** Derives a short file-type label (PDF, DOCX, PPTX, etc.) from a MIME type string. */
const getType = (mime: string) => {
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('word')) return 'DOCX';
  if (mime.includes('presentation')) return 'PPTX';
  if (mime.includes('image')) return mime.split('/')[1].toUpperCase();
  return 'FILE';
};

/** Renders the full documents list — file-type badges, metadata, status indicators, and quick-quiz links — or an empty state when no documents exist yet. */
export default function DocumentsView({ docs }: { docs: Document[] | null }) {
  return (
    <div className="p-7 max-w-4xl animate-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 4 }}>Documents</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>{docs?.length ?? 0} uploaded</p>
        </div>
        <Link href="/upload" className="btn-primary" style={{ padding: '10px 18px' }}>
          <Upload size={14} /> Upload
        </Link>
      </div>

      {docs && docs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((doc: Document) => {
            const s = statusCfg[doc.status] ?? statusCfg.failed;
            const type = getType(doc.file_type);
            const tc = typeColor[type] ?? 'var(--text-3)';
            return (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border-md)'; el.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'translateY(0)'; }}
              >
                {/* File type badge */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${tc}15`, border: `1px solid ${tc}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} style={{ color: tc }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: tc, marginTop: 2 }}>{type}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: doc.summary ? 8 : 0 }}>
                    {doc.file_name} · {formatBytes(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {doc.summary && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {doc.summary}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                  {doc.status === 'ready' && (
                    <Link href="/quizzes/new" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#818cf8', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <Zap size={10} /> Quiz
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileText size={26} style={{ color: 'var(--text-3)' }} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>No documents yet</p>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>Upload your first document to get started</p>
          <Link href="/upload" className="btn-primary" style={{ padding: '11px 26px' }}>
            <Upload size={15} /> Upload now
          </Link>
        </div>
      )}
    </div>
  );
}
