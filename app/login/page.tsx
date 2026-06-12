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
    <form className="login" onSubmit={submit}>
      <h1>🩺 Health Hub</h1>
      <input
        type="password" placeholder="Wachtwoord" value={password}
        onChange={(e) => setPassword(e.target.value)} autoFocus
      />
      <button type="submit">Inloggen</button>
      {error && <p style={{ color: "#f87171" }}>{error}</p>}
    </form>
  );
}
