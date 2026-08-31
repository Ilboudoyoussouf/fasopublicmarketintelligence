"use client";

import { useState, useTransition } from "react";
import { askAssistantAction } from "@/app/(app)/ia/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, Send, AlertTriangle } from "lucide-react";
import Link from "next/link";

const SUGGESTIONS = [
  "Quels marchés me correspondent cette semaine ?",
  "Quels documents me manquent ?",
  "Quels sont mes principaux concurrents ?",
  "Pourquoi mes offres sont-elles souvent rejetées ?",
];

type Message = {
  role: "user" | "assistant";
  content: string;
  confidence?: string;
  dataUsed?: string[];
  reasoning?: string;
  sources?: { entityType: string; entityId: string; excerpt: string }[];
  warnings?: string[];
};

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function send(question: string) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    startTransition(async () => {
      const result = await askAssistantAction(question, conversationId);
      setConversationId(result.conversationId);
      setMessages((m) => [...m, {
        role: "assistant", content: result.answer, confidence: result.confidence,
        dataUsed: result.dataUsed, reasoning: result.reasoning, sources: result.sources, warnings: result.warnings,
      }]);
    });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand" />
        <h1 className="text-lg font-semibold text-ink">Assistant IA</h1>
      </div>

      {messages.length === 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted hover:border-brand hover:text-brand">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[80%] rounded-lg bg-brand px-3 py-2 text-sm text-white" : "max-w-[90%] space-y-2 rounded-lg border border-line bg-paper p-3"}>
            <p className="whitespace-pre-line text-sm">{m.content}</p>
            {m.role === "assistant" && (
              <div className="space-y-1.5 border-t border-line pt-2 text-xs text-ink-muted">
                {m.dataUsed && m.dataUsed.length > 0 && <p><strong className="text-ink">Données utilisées :</strong> {m.dataUsed.join(" · ")}</p>}
                {m.confidence && <Badge tone={m.confidence === "élevée" ? "success" : m.confidence === "moyenne" ? "warning" : "neutral"}>Confiance {m.confidence}</Badge>}
                {m.sources && m.sources.length > 0 && (
                  <p>
                    <strong className="text-ink">Sources : </strong>
                    {m.sources.map((s, j) => (
                      <span key={j}>
                        {j > 0 && ", "}
                        {s.entityType === "market" ? <Link href={`/marches/${s.entityId}`} className="text-brand hover:underline">{s.excerpt}</Link> : s.excerpt}
                      </span>
                    ))}
                  </p>
                )}
                {m.warnings && m.warnings.map((w, j) => (
                  <p key={j} className="flex items-start gap-1 text-ink-faint"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {w}</p>
                ))}
              </div>
            )}
          </div>
        ))}
        {pending && <p className="text-xs text-ink-faint">L&apos;assistant recherche dans les données…</p>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-line pt-3"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez une question sur les données…" className="input" />
        <Button type="submit" variant="primary" disabled={pending}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
