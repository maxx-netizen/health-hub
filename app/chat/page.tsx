"use client";
import { useState, useRef, useEffect } from "react";
import TabBar from "@/components/TabBar";

interface Msg { role: "user" | "ai"; content: string; }

const SUGGESTIES = [
  "Hoe was mijn slaap deze week?",
  "Waarom is mijn HRV veranderd?",
  "Hoe gaat het met mijn gewicht?",
  "Geef me 3 tips voor deze week",
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", content: "Hoi Max! 👋 Ik ken al je data van je Helio strap, weegschaal en LARQ-fles. Wat wil je weten?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(1).map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((cur) => [...cur, { role: "ai", content: data.reply ?? "Er ging iets mis. Probeer het opnieuw." }]);
    } catch {
      setMessages((cur) => [...cur, { role: "ai", content: "Er ging iets mis. Probeer het opnieuw." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="date">JOUW PERSOONLIJKE COACH</div>
        <h1>AI-coach</h1>
      </div>
      <div className="chat-box">
        <div className="msgs">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>{m.content}</div>
          ))}
          {busy && <div className="msg ai">Denkt na…</div>}
          <div ref={bottom} />
        </div>
        {messages.length <= 1 && (
          <div className="chips">
            {SUGGESTIES.map((s) => (
              <button key={s} onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Vraag iets over je gezondheid…" disabled={busy} />
          <button type="submit" disabled={busy}>↑</button>
        </form>
      </div>
      <TabBar active="chat" />
    </div>
  );
}
