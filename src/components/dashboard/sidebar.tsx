"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Brain, LayoutDashboard, FileText, Zap, MessageSquare, BarChart2, LogOut, Upload, User } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

const navItems = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { href: "/documents",  icon: FileText,         label: "Documents" },
  { href: "/upload",     icon: Upload,            label: "Upload" },
  { href: "/quizzes",    icon: Zap,               label: "Quizzes" },
  { href: "/chat",       icon: MessageSquare,     label: "Chat" },
  { href: "/analytics",  icon: BarChart2,         label: "Analytics" },
];

export default function Sidebar({ user }: { user: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await createClient().auth.signOut();
    toast.success("Logged out");
    router.push("/"); router.refresh();
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <aside style={{ width: 220, height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(15,15,26,0.95)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.35)', flexShrink: 0 }}>
            <Brain size={15} className="text-white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Scholr</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
              fontSize: 14, fontWeight: active ? 600 : 400, textDecoration: 'none', transition: 'all 0.15s',
              background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: active ? '#a5b4fc' : 'var(--text-3)',
              borderLeft: active ? '2px solid rgba(99,102,241,0.6)' : '2px solid transparent',
            }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-2)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-3)'; } }}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 2 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(124,58,237,0.3))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#a5b4fc' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name ?? user?.email?.split("@")[0] ?? "User"}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, fontSize: 13, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </aside>
  );
}