"use client";
import { useState, useRef, useEffect } from "react";

interface Msg { role: "user" | "ai"; content: string; }

const SUGGESTIES = [
  "Hoe was mijn slaap deze week?",
  "Waarom is mijn HRV veranderd?",
  "Vergelijk mijn training dit vs vorige week",
  "Wat zijn mijn 3 verbeterpunten?",
  "Hoe is mijn herstel na de laatste workout?",
  "Geef me advies voor vandaag",
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", content: "Hoi Max! Ik heb toegang tot al je gezondheidsdata — slaap, HRV, workouts, gewicht en meer. Wat wil je weten?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(1).map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setMessages(cur => [...cur, { role: "ai", content: data.reply ?? "Probeer het opnieuw." }]);
    } catch {
      setMessages(cur => [...cur, { role: "ai", content: "Verbindingsfout. Probeer het opnieuw." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-header">
        <a href="/" className="chat-header-back">
          <svg width={10} height={18} viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 1L1 9l8 8"/>
          </svg>
          Terug
        </a>
        <span className="chat-header-title">AI-coach</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Berichten */}
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="chat-thinking">
            <span/><span/><span/>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Onderste balk */}
      <div className="chat-bottom">
        {messages.length <= 1 && (
          <div className="chat-chips">
            {SUGGESTIES.map(s => (
              <button key={s} className="chat-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        <form
          className="chat-input-row"
          onSubmit={e => { e.preventDefault(); send(input); }}
        >
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Stel een vraag…"
            disabled={busy}
          />
          <button type="submit" className="chat-send" disabled={busy || !input.trim()}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
