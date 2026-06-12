export default function TabBar({ active }: { active: "home" | "chat" }) {
  return (
    <nav className="tabbar">
      <a href="/" className={active === "home" ? "active" : ""}>
        <span className="ticon">📊</span>Overzicht
      </a>
      <a href="/chat" className={active === "chat" ? "active" : ""}>
        <span className="ticon">💬</span>AI-coach
      </a>
    </nav>
  );
}
