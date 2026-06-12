"use client";
import { useState, useRef, useEffect } from "react";

interface Msg { role: "user" | "ai"; content: string; }

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", content: "Hoi Max! 👋 Ik ken al je data van je Helio strap, weegschaal en LARQ-fles. Vraag me bijvoorbeeld: \"Hoe was mijn slaap deze week?\" of \"Zie je een verband tussen mijn waterinname en mijn energie?\"" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m, i) => !(i === 0 && m.role === "ai"))
            .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((cur) => [...cur, { role: "ai", content: data.reply ?? "Er ging iets mis. Controleer je ANTHROPIC_API_KEY." }]);
    } catch {
      setMessages((cur) => [...cur, { role: "ai", content: "Er ging iets mis. Probeer het opnieuw." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="nav">
        <h1>💬 AI-coach</h1>
        <div className="links"><a href="/">← Dashboard</a></div>
      </div>
      <div className="chat-box">
        <div className="msgs">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>{m.content}</div>
          ))}
          {busy && <div className="msg ai">Denkt na…</div>}
          <div ref={bottom} />
        </div>
        <form className="chat-input" onSubmit={send}>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Stel een vraag over je gezondheid…" disabled={busy}
          />
          <button type="submit" disabled={busy}>Verstuur</button>
        </form>
      </div>
    </div>
  );
}
