"use client";
import { useState } from "react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) window.location.href = "/";
    else setError("Onjuist wachtwoord");
  }

  return (
    <form className="login-wrap" onSubmit={submit}>
      <h1>🩺 Health Hub</h1>
      <input className="login-input" type="password" placeholder="Wachtwoord"
        value={password} onChange={e => setPassword(e.target.value)} autoFocus />
      <button className="login-btn" type="submit">Inloggen</button>
      {error && <p style={{ color: "#ff3b30", textAlign: "center" }}>{error}</p>}
    </form>
  );
}
