"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  MessageSquare,
  ChevronDown,
  Loader2,
  Bot,
  User,
  FileText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/database";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  "Summarize the key concepts in this document",
  "What are the most important formulas here?",
  "Explain the main topic in simple terms",
  "What questions might be asked in an exam on this?",
  "List all the topics covered in this document",
];

export default function ChatPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load ready documents
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("documents")
      .select("*")
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDocs(data ?? []);
        if (data?.[0]) setSelectedDoc(data[0]);
      });
  }, []);

  // Load chat history when document changes
  useEffect(() => {
    if (!selectedDoc) return;
    setLoadingHistory(true);
    setMessages([]);
    fetch(`/api/chat/history?documentId=${selectedDoc.id}`)
      .then((r) => r.json())
      .then(({ messages: hist }) => {
        if (hist?.length > 0) {
          setMessages(
            hist.map((m: { role: "user" | "assistant"; content: string }) => ({
              role: m.role,
              content: m.content,
            }))
          );
        }
      })
      .finally(() => setLoadingHistory(false));
  }, [selectedDoc]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!selectedDoc || !text.trim() || sending) return;

      const userMessage = text.trim();
      setInput("");
      setSending(true);

      // Add user message immediately
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      // Add empty assistant message that will be streamed into
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", streaming: true },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const history = messages
          .filter((m) => !m.streaming)
          .slice(-6)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: selectedDoc.id,
            message: userMessage,
            history,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Chat request failed");
        }

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const { token } = JSON.parse(data);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.streaming) {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + token,
                  };
                }
                return updated;
              });
            } catch {}
          }
        }

        // Mark streaming done
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Something went wrong";
        toast.error(msg);
        // Remove the empty streaming message on error
        setMessages((prev) => prev.filter((m) => !m.streaming));
      } finally {
        setSending(false);
        abortRef.current = null;
        inputRef.current?.focus();
      }
    },
    [selectedDoc, sending, messages]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    toast.success("Chat cleared");
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
        <MessageSquare size={16} className="text-indigo-400" />
        <span className="text-sm font-medium text-white">Chat with notes</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Document picker */}
          <div className="relative">
            <button
              onClick={() => setShowDocPicker((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-lg text-xs text-zinc-300 transition-all max-w-[200px]"
            >
              <FileText size={12} className="text-zinc-500 shrink-0" />
              <span className="truncate">
                {selectedDoc?.title ?? "Select document"}
              </span>
              <ChevronDown size={12} className="text-zinc-500 shrink-0" />
            </button>

            {showDocPicker && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-[#141414] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {docs.length === 0 ? (
                  <p className="text-xs text-zinc-500 p-3">
                    No ready documents. Upload one first.
                  </p>
                ) : (
                  docs.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDoc(d);
                        setShowDocPicker(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center gap-2",
                        selectedDoc?.id === d.id
                          ? "bg-indigo-600/15 text-indigo-300"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <FileText size={11} className="shrink-0 text-zinc-600" />
                      <span className="truncate">{d.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        onClick={() => setShowDocPicker(false)}
      >
        {/* Empty state */}
        {!loadingHistory && messages.length === 0 && selectedDoc && (
          <div className="flex flex-col items-center justify-center h-full pb-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center mb-4">
              <MessageSquare size={20} className="text-indigo-400" />
            </div>
            <p className="text-zinc-300 font-medium text-sm mb-1">
              Chat with &ldquo;{selectedDoc.title}&rdquo;
            </p>
            <p className="text-zinc-600 text-xs mb-6 text-center max-w-xs">
              Ask anything about this document. Get instant answers based on
              your notes.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No document selected */}
        {!selectedDoc && !loadingHistory && (
          <div className="flex flex-col items-center justify-center h-full pb-10">
            <FileText size={32} className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">Select a document to start chatting</p>
          </div>
        )}

        {/* Loading history */}
        {loadingHistory && (
          <div className="flex items-center gap-2 text-zinc-600 text-sm py-4">
            <Loader2 size={14} className="animate-spin" />
            Loading history...
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.role === "user"
                  ? "bg-indigo-600/20"
                  : "bg-white/5"
              )}
            >
              {msg.role === "user" ? (
                <User size={13} className="text-indigo-400" />
              ) : (
                <Bot size={13} className="text-zinc-400" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%]",
                msg.role === "user"
                  ? "bg-indigo-600/20 text-white rounded-tr-sm"
                  : "bg-white/[0.04] border border-white/5 text-zinc-200 rounded-tl-sm"
              )}
            >
              {msg.content || (msg.streaming && (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                </span>
              ))}
              {msg.streaming && msg.content && (
                <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-white/5 shrink-0">
        {!selectedDoc && (
          <p className="text-center text-xs text-zinc-600 mb-2">
            Select a document above to start chatting
          </p>
        )}
        <div className="flex gap-2 items-end bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-indigo-500/40 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDoc
                ? `Ask anything about "${selectedDoc.title}"...`
                : "Select a document first"
            }
            disabled={!selectedDoc || sending}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none disabled:opacity-40 max-h-[120px]"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!selectedDoc || !input.trim() || sending}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
          >
            {sending ? (
              <Loader2 size={13} className="animate-spin text-white" />
            ) : (
              <Send size={13} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[11px] text-zinc-700 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}