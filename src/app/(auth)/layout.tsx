import Link from "next/link";
import { Brain } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 65%)', filter: 'blur(40px)' }} />
      </div>
      <div className="relative p-5">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', borderRadius: 10, boxShadow: '0 0 20px rgba(99,102,241,0.35)' }} className="w-8 h-8 flex items-center justify-center transition-all group-hover:scale-105">
            <Brain size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Scholr</span>
        </Link>
      </div>
      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}