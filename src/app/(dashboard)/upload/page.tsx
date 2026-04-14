"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";

const ACCEPTED: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WEBP",
};
const MAX = 20 * 1024 * 1024;
type Status = "idle" | "uploading" | "processing" | "done" | "error";

interface FileState { file: File; status: Status; progress: number; docId?: string; error?: string; }

/** Renders the file upload page with a drag-and-drop zone, file list, and progress tracking for each upload. */
export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileState[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Validates each file against accepted types and size limit, then appends valid files to the queue. */
  function addFiles(list: FileList | null) {
    if (!list) return;
    const valid: FileState[] = [];
    for (const f of Array.from(list)) {
      if (!Object.keys(ACCEPTED).includes(f.type)) { toast.error(`${f.name}: unsupported type`); continue; }
      if (f.size > MAX) { toast.error(`${f.name}: exceeds 20MB`); continue; }
      if (files.some(x => x.file.name === f.name && x.file.size === f.size)) { toast.error(`${f.name}: already added`); continue; }
      valid.push({ file: f, status: "idle", progress: 0 });
    }
    if (valid.length) setFiles(p => [...p, ...valid]);
  }

  /** Handles the drop event by preventing default browser behaviour and forwarding the dropped files to addFiles. */
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files);
  }, [files]);

  /** Uploads a single file to Supabase Storage, inserts a document record, and triggers AI processing, updating status at each step. */
  async function processFile(i: number) {
    const fs = files[i];
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Session expired"); router.push("/login"); return; }

    setFiles(p => p.map((f, idx) => idx === i ? { ...f, status: "uploading", progress: 20 } : f));

    try {
      const path = `${user.id}/${Date.now()}_${fs.file.name.replace(/\s+/g, "_")}`;
      const { data: up, error: ue } = await supabase.storage.from("documents").upload(path, fs.file, { upsert: false });
      if (ue) throw new Error(ue.message);

      setFiles(p => p.map((f, idx) => idx === i ? { ...f, progress: 50 } : f));

      const { data: doc, error: de } = await supabase.from("documents").insert({
        user_id: user.id, title: fs.file.name.replace(/\.[^/.]+$/, ""),
        file_name: fs.file.name, file_path: up.path,
        file_size: fs.file.size, file_type: fs.file.type, status: "processing",
      }).select().single();
      if (de) throw new Error(de.message);

      setFiles(p => p.map((f, idx) => idx === i ? { ...f, progress: 65, status: "processing", docId: doc.id } : f));

      const res = await fetch(`/api/documents/${doc.id}/process`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) {
          toast.warning("Rate limit hit. Wait 1 minute and try again.");
          setFiles(p => p.map((f, idx) => idx === i ? { ...f, status: "idle", progress: 0 } : f));
          return;
        }
        throw new Error(err.error ?? "Processing failed");
      }

      setFiles(p => p.map((f, idx) => idx === i ? { ...f, progress: 100, status: "done" } : f));
      toast.success(`${fs.file.name} is ready!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setFiles(p => p.map((f, idx) => idx === i ? { ...f, status: "error", error: msg } : f));
      toast.error(msg);
    }
  }

  /** Sequentially processes all files currently in the idle state. */
  async function uploadAll() {
    const idle = files.map((f, i) => ({ f, i })).filter(({ f }) => f.status === "idle").map(({ i }) => i);
    for (const idx of idle) await processFile(idx);
  }

  const idleCount = files.filter(f => f.status === "idle").length;
  const allDone = files.length > 0 && files.every(f => f.status === "done" || f.status === "error");
  const anyBusy = files.some(f => f.status === "uploading" || f.status === "processing");

  const statusConfig: Record<Status, { label: string; color: string }> = {
    idle: { label: '', color: '' },
    uploading: { label: 'Uploading...', color: '#818cf8' },
    processing: { label: 'AI reading...', color: '#fbbf24' },
    done: { label: 'Ready ✓', color: '#4ade80' },
    error: { label: 'Failed', color: '#f87171' },
  };

  return (
    <div className="p-7 max-w-2xl animate-fade-up">
      <div className="mb-7">
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 6 }}>Upload documents</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>PDF, DOCX, PPTX, or images · Max 20MB · Scanned files supported</p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 20, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
          background: drag ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.01)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!drag) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
        onMouseLeave={e => { if (!drag) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
      >
        <div style={{ width: 56, height: 56, borderRadius: 16, background: drag ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <CloudUpload size={24} style={{ color: drag ? '#818cf8' : 'var(--text-3)' }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: drag ? '#a5b4fc' : 'var(--text-2)', marginBottom: 6 }}>
          {drag ? 'Drop it!' : 'Drag & drop files here'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>or click to browse</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {["PDF", "DOCX", "PPTX", "JPG", "PNG"].map(t => (
            <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>{t}</span>
          ))}
        </div>
        <input ref={inputRef} type="file" multiple accept={Object.keys(ACCEPTED).join(",")} className="hidden"
          onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((f, i) => {
            const sc = statusConfig[f.status];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} style={{ color: 'var(--text-3)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.file.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{formatBytes(f.file.size)}</span>
                    {f.status !== 'idle' && <span style={{ fontSize: 12, color: sc.color }}>{f.status === 'error' ? f.error : sc.label}</span>}
                  </div>
                  {(f.status === 'uploading' || f.status === 'processing') && (
                    <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius: 99, width: `${f.progress}%`, transition: 'width 0.5s' }} />
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {f.status === 'idle' && <button onClick={() => setFiles(p => p.filter((_, idx) => idx !== i))} style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><X size={15} /></button>}
                  {(f.status === 'uploading' || f.status === 'processing') && <Loader2 size={15} className="animate-spin" style={{ color: '#818cf8' }} />}
                  {f.status === 'done' && <CheckCircle2 size={16} style={{ color: '#4ade80' }} />}
                  {f.status === 'error' && <AlertCircle size={16} style={{ color: '#f87171' }} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {idleCount > 0 && !anyBusy && (
            <button onClick={uploadAll} className="btn-primary" style={{ padding: '10px 20px' }}>
              <Upload size={14} /> Upload {idleCount} file{idleCount > 1 ? 's' : ''}
            </button>
          )}
          {anyBusy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
              <Loader2 size={14} className="animate-spin" /> Processing...
            </div>
          )}
          {allDone && (
            <button onClick={() => router.push("/documents")} className="btn-primary" style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
              <CheckCircle2 size={14} /> View documents
            </button>
          )}
          {!anyBusy && (
            <button onClick={() => setFiles([])} className="btn-ghost" style={{ padding: '10px 16px' }}>Clear all</button>
          )}
        </div>
      )}
    </div>
  );
}