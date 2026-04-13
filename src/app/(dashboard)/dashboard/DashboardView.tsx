"use client";
import Link from "next/link";
import { FileText, Upload, ArrowRight, Brain, Zap, MessageSquare, TrendingUp } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { Document } from "@/types/database";

type Profile = {
  full_name?: string | null;
  queries_used?: number | null;
  queries_limit?: number | null;
};

type Props = {
  firstName: string;
  greeting: string;
  docCount: number;
  quizCount: number;
  chatCount: number;
  profile: Profile | null;
  docs: Document[] | null;
};

const statusStyle = (s: string) =>
  ({
    ready:      { bg: 'rgba(34,197,94,0.1)',  color: '#4ade80',  text: 'Ready' },
    processing: { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24',  text: 'Processing' },
    failed:     { bg: 'rgba(239,68,68,0.1)',  color: '#f87171',  text: 'Failed' },
  }[s] ?? { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-3)', text: s });

export default function DashboardView({ firstName, greeting, docCount, quizCount, chatCount, profile, docs }: Props) {
  return (
    <div className="p-7 max-w-5xl animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 4 }}>{greeting} 👋</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>
          {firstName}
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 4 }}>
          {docCount ? `${docCount} document${docCount > 1 ? 's' : ''} ready to study` : 'Upload your first document to get started'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Documents', value: docCount ?? 0, icon: FileText, color: '#818cf8' },
          { label: 'Quizzes',   value: quizCount ?? 0, icon: Zap,      color: '#fbbf24' },
          { label: 'Chats',     value: chatCount ?? 0, icon: MessageSquare, color: '#34d399' },
          { label: 'AI queries', value: profile?.queries_used ?? 0, icon: Brain, color: '#f472b6', sub: `of ${profile?.queries_limit ?? 20}` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} style={{ color }} />
              </div>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</p>
            {sub && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          { href: '/upload',      icon: Upload,      title: 'Upload document',  desc: 'PDF, DOCX, PPTX, images', gradient: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(124,58,237,0.1))', border: 'rgba(99,102,241,0.25)', iconColor: '#818cf8' },
          { href: '/quizzes/new', icon: Zap,          title: 'Generate quiz',    desc: 'From any document', gradient: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(234,88,12,0.05))', border: 'rgba(245,158,11,0.2)', iconColor: '#fbbf24' },
          { href: '/chat',        icon: MessageSquare,title: 'Chat with notes',  desc: 'Ask anything', gradient: 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(16,185,129,0.05))', border: 'rgba(34,197,94,0.2)', iconColor: '#34d399' },
        ].map(({ href, icon: Icon, title, desc, gradient, border, iconColor }) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: gradient, border: `1px solid ${border}`, borderRadius: 14, textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={17} style={{ color: iconColor }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</p>
            </div>
            <ArrowRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      {/* Recent docs */}
      {docs && docs.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Recent documents</h2>
            <Link href="/documents" style={{ fontSize: 13, color: 'var(--accent-2)', textDecoration: 'none' }} className="hover:underline">View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map((doc: Document) => {
              const s = statusStyle(doc.status);
              return (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-md)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} style={{ color: 'var(--text-3)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{formatBytes(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 600, flexShrink: 0 }}>{s.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!docs || docs.length === 0) && (
        <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Brain size={24} style={{ color: '#818cf8' }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>No documents yet</p>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>Upload your first file to start studying smarter</p>
          <Link href="/upload" className="btn-primary" style={{ padding: '10px 24px' }}>
            <Upload size={15} /> Upload now
          </Link>
        </div>
      )}
    </div>
  );
}
