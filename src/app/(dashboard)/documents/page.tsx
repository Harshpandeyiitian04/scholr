import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentsView from "./DocumentsView";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: docs } = await supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return <DocumentsView docs={docs} />;
}
