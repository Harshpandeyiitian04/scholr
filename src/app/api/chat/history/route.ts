import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Returns the last 50 chat messages (in chronological order) for the document specified by the `documentId` query parameter. */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    if (!documentId) return NextResponse.json({ messages: [] });

    const { data: messages } = await supabase
      .from("chats")
      .select("role, content, created_at")
      .eq("user_id", user.id)
      .eq("document_id", documentId)
      .order("created_at", { ascending: true })
      .limit(50);

    return NextResponse.json({ messages: messages ?? [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
