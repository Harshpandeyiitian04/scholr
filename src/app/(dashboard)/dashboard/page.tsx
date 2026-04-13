import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: docs, count: docCount }, { count: quizCount }, { count: chatCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("documents").select("*", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("quizzes").select("*", { count: "exact" }).eq("user_id", user.id),
    supabase.from("chats").select("*", { count: "exact" }).eq("user_id", user.id).eq("role", "user"),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardView
      firstName={firstName}
      greeting={greeting}
      docCount={docCount ?? 0}
      quizCount={quizCount ?? 0}
      chatCount={chatCount ?? 0}
      profile={profile}
      docs={docs}
    />
  );
}
