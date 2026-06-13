"use client";
import { useState, useRef, useEffect } from "react";

interface Msg { role: "user" | "ai"; content: string; }

const SUGGESTIES = [
  "Hoe was mijn slaap deze week?",
  "Waarom is mijn HRV veranderd?",
  "Hoe gaat het met mijn gewicht?",
  "Geef me 3 tips voor deze week",
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", content: "Hoi Max! 👋 Ik ken al je data van je Amazfit Helio strap, weegschaal en LARQ-fles. Stel me gerust een vraag over je gezondheid." },
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
          messages: next.slice(1).map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(cur => [...cur, { role: "ai", content: data.reply ?? "Er ging iets mis. Probeer opnieuw." }]);
    } catch {
      setMessages(cur => [...cur, { role: "ai", content: "Er ging iets mis. Probeer opnieuw." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="app-header">
        <button className="header-date">✦ AI-coach</button>
        <a href="/" className="header-icon-btn" style={{ textDecoration: "none" }}>✕</a>
      </div>
      <div className="chat-wrap">
        <div className="chat-box">
          <div className="chat-msgs">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
            ))}
            {busy && <div className="chat-msg ai">Denkt na…</div>}
            <div ref={bottom} />
          </div>
          {messages.length <= 1 && (
            <div className="chat-chips">
              {SUGGESTIES.map(s => (
                <button key={s} className="chat-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}
          <form className="chat-input-row" onSubmit={e => { e.preventDefault(); send(input); }}>
            <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Stel een vraag…" disabled={busy} autoFocus />
            <button type="submit" className="chat-send" disabled={busy}>↑</button>
          </form>
        </div>
      </div>
    </div>
  );
}
