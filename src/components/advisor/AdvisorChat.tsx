import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { AdvisorAnswers, ChatMessage, Recommendation, AdvisorProductBrief } from "@/types/advisor";
import { supabase } from "@/integrations/supabase/client";
import { trackAdvisor } from "@/lib/advisor/analytics";

interface Props {
  answers: AdvisorAnswers;
  recommendation: Recommendation;
  products: Record<string, AdvisorProductBrief>;
  assessmentId?: string | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advisor-chat`;

const SUGGESTED = [
  "Why not the bootcamp?",
  "What if I have less time than I said?",
  "How do I pay in instalments?",
  "What jobs can I get after this?",
];

export default function AdvisorChat({ answers, recommendation, products, assessmentId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Always-current ref of the full transcript so persistence never sees stale state
  const messagesRef = useRef<ChatMessage[]>([]);
  const assessmentIdRef = useRef<string | null>(assessmentId ?? null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    assessmentIdRef.current = assessmentId ?? null;
  }, [assessmentId]);

  async function persistTranscript(history: ChatMessage[]) {
    const id = assessmentIdRef.current;
    if (!id || history.length === 0) return;
    try {
      await supabase.functions.invoke("advisor-chat-persist", {
        body: { assessment_id: id, messages: history },
      });
    } catch (e) {
      console.warn("chat persist failed", e);
    }
  }

  // Flush latest transcript on unmount (e.g. user navigates away mid-chat)
  useEffect(() => {
    return () => {
      const finalHistory = messagesRef.current;
      if (assessmentIdRef.current && finalHistory.length > 0) {
        // Fire-and-forget; safe to ignore errors during teardown
        void persistTranscript(finalHistory);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    // Snapshot the prior history from the ref (always up to date) and append the new user msg
    const historyWithUser = [...messagesRef.current, userMsg];
    setMessages(historyWithUser);
    messagesRef.current = historyWithUser;
    setInput("");
    setIsStreaming(true);
    trackAdvisor("chat_message_sent", {
      assessmentId: assessmentId ?? null,
      metadata: { length: userMsg.content.length },
    });
    // Persist immediately so the user message is never lost, even if the stream fails
    void persistTranscript(historyWithUser);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          const next = prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          messagesRef.current = next;
          return next;
        }
        const next = [...prev, { role: "assistant" as const, content: assistantSoFar }];
        messagesRef.current = next;
        return next;
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          answers,
          recommendation,
          products,
        }),
      });

      if (resp.status === 429) { toast.error("Rate limit reached. Try again in a moment."); setIsStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); setIsStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      trackAdvisor("chat_message_received", {
        assessmentId: assessmentId ?? null,
        metadata: { length: assistantSoFar.length },
      });
      // Persist the full transcript including the assistant reply
      await persistTranscript(messagesRef.current);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't get a response. Please try again.");
      // Even on stream failure, persist whatever we captured so far
      void persistTranscript(messagesRef.current);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        <div>
          <div className="font-semibold">Refine with the AI advisor</div>
          <div className="text-xs text-white/80">Ask why, compare options, or share new info</div>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[400px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Ask a follow-up question to refine your pathway.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:bg-primary/5 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-2">
                  <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="p-3 border-t bg-card flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the advisor anything..."
          disabled={isStreaming}
        />
        <Button type="submit" disabled={isStreaming || !input.trim()} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}