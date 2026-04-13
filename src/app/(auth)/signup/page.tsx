"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", college: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) { setErrors(ve); return; }
    setErrors({}); setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.fullName, college: form.college }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { toast.error(error.message.includes("already registered") ? "Account exists. Try logging in." : error.message); return; }
      toast.success("Check your email to confirm your account!");
      router.push(`/login?message=check_email&email=${encodeURIComponent(form.email)}`);
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
        <h1 className="font-bold mb-2" style={{ fontSize: 26, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Create account</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Free forever for students</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {[
          { key: 'fullName', label: 'Full name', placeholder: 'Harsh Pandey', type: 'text' },
          { key: 'email', label: 'Email', placeholder: 'you@iitmandi.ac.in', type: 'email' },
          { key: 'college', label: 'College', placeholder: 'IIT Mandi (optional)', type: 'text', optional: true },
        ].map(({ key, label, placeholder, type, optional }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
              {label} {optional && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>}
            </label>
            <input type={type} placeholder={placeholder} {...F(key as keyof typeof form)}
              className="input-base"
              style={{ borderColor: errors[key] ? 'rgba(239,68,68,0.5)' : undefined }}
            />
            {errors[key] && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors[key]}</p>}
          </div>
        ))}

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Password</label>
          <div className="relative">
            <input type={show ? "text" : "password"} placeholder="Min 8 characters" {...F('password')}
              className="input-base" style={{ paddingRight: 40, borderColor: errors.password ? 'rgba(239,68,68,0.5)' : undefined }}
            />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full" style={{ padding: '12px', marginTop: 8 }}>
          {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account...</> : <>Create account <ArrowRight size={15} /></>}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 24 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent-2)', fontWeight: 500 }} className="hover:underline">Log in</Link>
      </p>
    </div>
  );
}