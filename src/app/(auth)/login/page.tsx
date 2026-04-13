"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (searchParams.get("message") === "check_email")
      toast.info(`Confirmation sent to ${searchParams.get("email") ?? "your email"}`);
    if (searchParams.get("error") === "auth_failed")
      toast.error("Authentication failed. Try again.");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ve: Record<string, string> = {};
    if (!form.email) ve.email = "Required";
    if (!form.password) ve.password = "Required";
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setErrors({}); setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) {
        toast.error(error.message.includes("Invalid login") ? "Wrong email or password." : error.message.includes("not confirmed") ? "Please confirm your email first." : error.message);
        return;
      }
      router.push(searchParams.get("redirectTo") ?? "/dashboard");
      router.refresh();
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  }

  const F = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      if (errors[key]) setErrors(p => ({ ...p, [key]: "" }));
    },
  });

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="text-center mb-8">
        <h1 className="font-bold mb-2" style={{ fontSize: 26, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Log in to continue studying</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
          <input type="email" placeholder="you@iitmandi.ac.in" {...F('email')} className="input-base"
            style={{ borderColor: errors.email ? 'rgba(239,68,68,0.5)' : undefined }} />
          {errors.email && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-2)' }} className="hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <input type={show ? "text" : "password"} placeholder="Your password" {...F('password')}
              className="input-base" style={{ paddingRight: 40, borderColor: errors.password ? 'rgba(239,68,68,0.5)' : undefined }} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full" style={{ padding: '12px', marginTop: 8 }}>
          {loading ? <><Loader2 size={15} className="animate-spin" />Logging in...</> : <>Log in <ArrowRight size={15} /></>}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 24 }}>
        No account?{' '}
        <Link href="/signup" style={{ color: 'var(--accent-2)', fontWeight: 500 }} className="hover:underline">Sign up free</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" style={{ color: 'var(--text-3)' }} size={20} /></div>}><LoginForm /></Suspense>;
}