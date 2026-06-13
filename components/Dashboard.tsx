"use client";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Area, AreaChart,
} from "recharts";
import type { DailyData, Insight } from "@/lib/summary";

// ── Colors ──────────────────────────────────────────
const C = {
  green: "#30d158", blue: "#0a84ff", red: "#ff3b30", orange: "#ff9500",
  purple: "#5e5ce6", teal: "#5ac8fa", yellow: "#ffd60a",
  muted: "#8e8e93", border: "#2a2a2a", card3: "#2a2a2a",
};
const tt = { background: "#1c1c1e", border: "0.5px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 12 };

// ── Helpers ─────────────────────────────────────────
function fmtDay(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}
function fmtMin(min: number | null): string {
  if (min == null || min <= 0) return "–";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
}

const ICONS: Record<string, string> = {
  hardlopen:"🏃", running:"🏃", wandelen:"🚶", walking:"🚶", fietsen:"🚴",
  cycling:"🚴", kracht:"🏋️", strength:"🏋️", traditional:"🏋️", zwemmen:"🏊",
  swimming:"🏊", yoga:"🧘", hiit:"🔥", elliptical:"🚲", rowing:"🚣", voetbal:"⚽",
};
function icon(name: string) {
  const n = name.toLowerCase();
  for (const k of Object.keys(ICONS)) if (n.includes(k)) return ICONS[k];
  return "💪";
}

// ── SVG Ring ─────────────────────────────────────────
function Ring({ pct, size = 80, color = C.green, label, sublabel }: {
  pct: number; size?: number; color?: string; label?: string; sublabel?: string;
}) {
  const sw = 8, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const safe = Math.min(100, Math.max(0, pct));
  const dash = `${(safe / 100) * c} ${c}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.card3} strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={safe > 0 ? color : C.card3}
          strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash}
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        {label && (
          <>
            <text x={size/2} y={size/2 - (sublabel ? 6 : 0)} textAnchor="middle" fill="#fff"
              fontSize={size > 88 ? 16 : 13} fontWeight="800">{label}</text>
            {sublabel && (
              <text x={size/2} y={size/2 + 12} textAnchor="middle" fill={C.muted}
                fontSize={9} fontWeight="600">{sublabel}</text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

// ── Small Ring with % ─────────────────────────────────
function PctRing({ pct, size, color }: { pct: number; size: number; color: string }) {
  const sw = 7, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const safe = Math.min(100, Math.max(0, pct));
  const dash = `${(safe / 100) * c} ${c}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={safe > 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.18)"}
        strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">
        {Math.round(safe)}%
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────
export default function Dashboard({ daily, workouts, insights, dayScore }: {
  daily: DailyData; workouts: any[]; insights: Insight[];
  dayScore: { score: number; parts: { label: string; pct: number }[] } | null;
}) {
  const [tab, setTab] = useState<"home" | "trends" | "activiteit">("home");
  const [range, setRange] = useState(30);

  const allDays = Object.keys(daily).sort();
  const days = allDays.slice(-range);

  const rows = days.map((d) => {
    const m = daily[d] ?? {};
    const v = (k: string, f = 1, dec = 1) => (m[k] != null ? +((m[k] * f).toFixed(dec)) : null);
    return {
      day: fmtDay(d),
      slaap: v("sleep.total", 1/60), diep: v("sleep.deep", 1/60),
      rem: v("sleep.rem", 1/60), licht: v("sleep.core", 1/60),
      hrv: v("heart_rate_variability.qty", 1, 0), rusthr: v("resting_heart_rate.qty", 1, 0),
      stappen: v("step_count.qty", 1, 0), water: v("dietary_water.qty", 1, 0),
      gewicht: v("weight_body_mass.qty"), vet: v("body_fat_percentage.qty"),
      spier: v("lean_body_mass.qty"), kcal: v("active_energy.qty", 1, 0),
    };
  });

  const latest = (key: keyof typeof rows[0]) => {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] != null) return rows[i][key] as number;
    return null;
  };
  const prev = (key: keyof typeof rows[0]) => {
    let n = 0;
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] != null && ++n === 2) return rows[i][key] as number;
    return null;
  };

  const today = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
  const weekWorkouts = workouts.filter(w => new Date(w.start) > new Date(Date.now() - 7*86400000));

  // Compute ring percentages
  const latestHRV = latest("hrv");
  const baseHRVs = rows.slice(-30, -1).map(r => r.hrv).filter(v => v != null) as number[];
  const avgHRV = baseHRVs.length ? baseHRVs.reduce((a, b) => a + b, 0) / baseHRVs.length : 50;
  const herstelPct = latestHRV ? Math.min(100, Math.round((latestHRV / (avgHRV * 1.2)) * 100)) : 0;
  const stappenToday = latest("stappen") ?? 0;
  const inspanningPct = Math.min(100, Math.round((stappenToday / 8000) * 100));
  const waterToday = latest("water") ?? 0;
  const voedingPct = Math.min(100, Math.round((waterToday / 2000) * 100));

  // Sleep data
  const sleepTotal = latest("slaap"); // hours
  const sleepTotalMin = sleepTotal ? Math.round(sleepTotal * 60) : null;
  const sleepDeep = latest("diep");
  const sleepDeepMin = sleepDeep ? Math.round(sleepDeep * 60) : null;
  const sleepREM = latest("rem");
  const sleepREMMin = sleepREM ? Math.round(sleepREM * 60) : null;
  const sleepLight = latest("licht");
  const sleepLightMin = sleepLight ? Math.round(sleepLight * 60) : null;
  const sleepPct = sleepTotalMin ? Math.min(100, Math.round((sleepTotalMin / 480) * 100)) : 0;

  // HRV stats
  const hrvVals = rows.map(r => r.hrv).filter(v => v != null) as number[];
  const hrvMax = hrvVals.length ? Math.max(...hrvVals) : null;
  const hrvMin = hrvVals.length ? Math.min(...hrvVals) : null;
  const hrvAvg = hrvVals.length ? Math.round(hrvVals.reduce((a,b) => a+b, 0) / hrvVals.length) : null;

  const noData = !allDays.length;

  if (noData) {
    return (
      <div className="container">
        <AppHeader today={today} onAI={() => window.location.href = "/chat"} />
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
          <h2>Nog geen data</h2>
          <p>Zodra Health Auto Export pusht naar <code>/api/ingest</code> verschijnt hier alles.</p>
        </div>
        <SonarTabBar tab={tab} onTab={setTab} />
      </div>
    );
  }

  return (
    <div className="container">
      <AppHeader today={today} onAI={() => window.location.href = "/chat"} />

      {tab === "home" && (
        <HomeTab
          herstelPct={herstelPct} inspanningPct={inspanningPct} voedingPct={voedingPct}
          latestHRV={latestHRV} hrvMax={hrvMax} hrvMin={hrvMin} hrvAvg={hrvAvg}
          sleepPct={sleepPct} sleepTotalMin={sleepTotalMin} sleepDeepMin={sleepDeepMin}
          sleepREMMin={sleepREMMin} sleepLightMin={sleepLightMin}
          stappenToday={stappenToday} waterToday={waterToday} weekWorkouts={weekWorkouts}
          workouts={workouts} insights={insights} latest={latest} prev={prev}
          onAI={() => window.location.href = "/chat"}
        />
      )}

      {tab === "trends" && (
        <TrendsTab rows={rows} range={range} setRange={setRange}
          herstelPct={herstelPct} inspanningPct={inspanningPct} voedingPct={voedingPct}
          latest={latest} prev={prev}
        />
      )}

      {tab === "activiteit" && (
        <ActiviteitTab workouts={workouts} weekWorkouts={weekWorkouts}
          latest={latest} prev={prev}
        />
      )}

      <SonarTabBar tab={tab} onTab={setTab} />
    </div>
  );
}

// ── App Header ───────────────────────────────────────
function AppHeader({ today, onAI }: { today: string; onAI: () => void }) {
  return (
    <div className="app-header">
      <button className="header-date">
        📅 Vandaag, {today} ▾
      </button>
      <div className="header-icons">
        <button className="header-icon-btn">👤</button>
        <button className="header-icon-btn">🔔</button>
      </div>
    </div>
  );
}

// ── Home Tab ─────────────────────────────────────────
function HomeTab({ herstelPct, inspanningPct, voedingPct, latestHRV, hrvMax, hrvMin, hrvAvg,
  sleepPct, sleepTotalMin, sleepDeepMin, sleepREMMin, sleepLightMin,
  stappenToday, waterToday, weekWorkouts, workouts, insights, latest, prev, onAI }: any) {

  const lastScore = latestHRV != null
    ? `Je herstel vandaag is ${herstelPct}% op basis van je HRV.`
    : "Synchroniseer je Amazfit om gepersonaliseerde inzichten te zien.";

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-title">
          {latestHRV ? "Goedemorgen, Max! 👋" : "We verzamelen\nje gegevens."}
        </div>
        <div className="hero-sub">{lastScore}</div>
        <button className="ai-btn" onClick={onAI}>
          <span>✦</span> Vraag het aan AI-coach
        </button>
      </div>

      {/* Three Rings */}
      <div className="three-rings">
        <div className="ring-item">
          <div className="ring-label">⚡ Herstel</div>
          <Ring pct={herstelPct} size={80} color={C.green}
            label={`${herstelPct}%`} />
        </div>
        <div className="ring-item" style={{ flex: 1.3 }}>
          <div className="ring-label">🔥 Inspanning</div>
          <Ring pct={inspanningPct} size={96} color={C.orange}
            label={`${inspanningPct}%`} />
        </div>
        <div className="ring-item">
          <div className="ring-label">💧 Voeding</div>
          <Ring pct={voedingPct} size={80} color={C.teal}
            label={`${voedingPct}%`} />
        </div>
      </div>

      {/* Goals / Load */}
      <div className="section">
        <div className="section-title">
          Belastingsdoel <span className="section-chevron">›</span>
        </div>
        <div className="sonar-card">
          <div className="load-goal-text">
            Houd de inspanning van vandaag binnen een gezond bereik.
          </div>
          <div className="goal-bars">
            <GoalBar label="🚶 Stappen" value={stappenToday} goal={8000} unit="" color={C.green} />
            <GoalBar label="💧 Water" value={waterToday} goal={2000} unit=" ml" color={C.teal} />
            <GoalBar label="🏋️ Workouts deze week" value={weekWorkouts.length} goal={4} unit="" color={C.orange} />
          </div>
        </div>
      </div>

      {/* Energy / HRV */}
      <div className="section" style={{ marginTop: 8 }}>
        <div className="section-title">
          Energie en stress <span className="section-chevron">›</span>
        </div>
        <div className="sonar-card">
          <div className="energy-top">
            <span className="energy-icon">🔋</span>
            <div className="energy-bar">
              <div className="energy-bar-fill" style={{ width: `${Math.min(100, (latestHRV ?? 0) / 100 * 100)}%` }} />
            </div>
          </div>
          {latestHRV ? (
            <>
              <div className="energy-big">
                {latestHRV}<span className="energy-unit"> ms</span>
              </div>
              <div style={{ fontSize: 12, color: "#8e8e93", marginBottom: 10 }}>HRV – Hartslag Variabiliteit</div>
              <div className="energy-stats">
                <div className="energy-stat"><div className="energy-stat-val">{hrvMax ?? "–"}</div><div className="energy-stat-lbl">Max</div></div>
                <div className="energy-stat"><div className="energy-stat-val">{hrvMin ?? "–"}</div><div className="energy-stat-lbl">Min</div></div>
                <div className="energy-stat"><div className="energy-stat-val">{hrvAvg ?? "–"}</div><div className="energy-stat-lbl">Gem</div></div>
              </div>
            </>
          ) : (
            <div style={{ color: "#8e8e93", fontSize: 14, textAlign: "center", padding: "8px 0" }}>Geen HRV-data beschikbaar</div>
          )}
        </div>
      </div>

      {/* Sleep */}
      <div className="section" style={{ marginTop: 8 }}>
        <div className="section-title">
          Slaap <span className="section-chevron">›</span>
        </div>
        <div className="sonar-card">
          <div className="sleep-row">
            <div className="sleep-left">
              <Ring pct={sleepPct} size={90} color={C.purple}
                label={sleepTotalMin ? `${Math.floor(sleepTotalMin/60)}u` : "–"}
                sublabel={sleepTotalMin ? `${sleepTotalMin % 60}m` : "geen data"} />
              <div className="sleep-sublabel">Gebruikelijk bereik</div>
            </div>
            <div className="sleep-phases">
              <SleepPhase label="Diepe slaap" min={sleepDeepMin} max={sleepTotalMin ?? 480} color={C.purple} />
              <SleepPhase label="REM-slaap" min={sleepREMMin} max={sleepTotalMin ?? 480} color={C.teal} />
              <SleepPhase label="Lichte slaap" min={sleepLightMin} max={sleepTotalMin ?? 480} color={C.blue} />
              <SleepPhase label="Wakker" min={null} max={480} color={C.orange} />
            </div>
          </div>
        </div>
      </div>

      {/* Training */}
      <div className="section" style={{ marginTop: 8, marginBottom: 8 }}>
        <div className="section-title">
          Training <span className="section-chevron">›</span>
        </div>
        <div className="sonar-card">
          {workouts.length > 0 ? (
            workouts.slice(-5).reverse().map((w, i) => (
              <WorkoutItem key={i} w={w} />
            ))
          ) : (
            <div style={{ color: "#8e8e93", fontSize: 14, textAlign: "center", padding: "8px 0" }}>
              Geen workouts gevonden
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="section">
          <div className="section-title">Inzichten</div>
          <div className="sonar-card">
            {insights.map((ins: any, i: number) => (
              <div className="insight-item" key={i}>
                <span style={{ fontSize: 18 }}>{ins.emoji}</span>
                <span style={{ fontSize: 14, lineHeight: 1.45 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Trends Tab ───────────────────────────────────────
function TrendsTab({ rows, range, setRange, herstelPct, inspanningPct, voedingPct, latest, prev }: any) {
  const latestHRV = latest("hrv");
  const latestSlaap = latest("slaap");
  const latestStappen = latest("stappen");
  const latestGewicht = latest("gewicht");
  const latestVet = latest("vet");
  const latestSpier = latest("spier");

  const fitnessScore = Math.round((inspanningPct + Math.min(100, (latestStappen ?? 0) / 80)) / 2);
  const sleepScore = latestSlaap ? Math.min(100, Math.round((latestSlaap * 60 / 480) * 100)) : 0;
  const herstelScore = herstelPct;

  return (
    <>
      {/* Segment */}
      <div className="segment">
        {[7, 30, 90].map(r => (
          <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>
            {r}d
          </button>
        ))}
      </div>

      {/* Weekly Bar Chart */}
      <div className="section" style={{ marginBottom: 8 }}>
        <div className="section-title">Stappen {range}d</div>
        <div className="sonar-card" style={{ padding: "14px 8px 8px" }}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={rows} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 9 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 9 }} width={30} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="stappen" name="Stappen" fill={C.green} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Report Cards */}
      <div className="section" style={{ marginBottom: 8 }}>
        <div className="section-title">Wekelijks voortgangsrapport</div>
        <div className="photo-cards">
          <PhotoCard
            title="Fitness"
            sub={`Stappen: ${(latest("stappen") ?? 0).toLocaleString("nl-NL")} • Kcal: ${latest("kcal") ?? "–"}`}
            pct={fitnessScore}
            gradient="linear-gradient(135deg, #1a2a1a 0%, #0a1a0a 100%)"
            accent={C.green}
          />
          <PhotoCard
            title="Slaap"
            sub={`Totaal: ${fmtMin(latestSlaap ? Math.round(latestSlaap * 60) : null)} slaap`}
            pct={sleepScore}
            gradient="linear-gradient(135deg, #0d1a2a 0%, #060d1a 100%)"
            accent={C.purple}
          />
          <PhotoCard
            title="Herstel"
            sub={`HRV: ${latestHRV ?? "–"} ms • Rust-HR: ${latest("rusthr") ?? "–"} bpm`}
            pct={herstelScore}
            gradient="linear-gradient(135deg, #1a1a0d 0%, #0d0d06 100%)"
            accent={C.orange}
          />
        </div>
      </div>

      {/* Meer verkennen */}
      <div className="section-title" style={{ padding: "0 20px", marginBottom: 10 }}>
        Meer verkennen
      </div>
      <div className="explore-scroll">
        {[
          { emoji: "❤️", label: "Hartslagvari­abiliteit" },
          { emoji: "😴", label: "Slaap­score" },
          { emoji: "🌙", label: "Slaap­duur" },
          { emoji: "⚖️", label: "Gewicht" },
          { emoji: "🏃", label: "Stappen" },
          { emoji: "🔥", label: "Calorieën" },
          { emoji: "💧", label: "Water" },
          { emoji: "💪", label: "Spiermassa" },
        ].map((e, i) => (
          <div className="explore-item" key={i}>
            <div className="explore-icon">{e.emoji}</div>
            <div className="explore-label">{e.label}</div>
          </div>
        ))}
      </div>

      {/* Metric Charts */}
      <div className="section" style={{ marginTop: 12 }}>
        <MetricChart title="Tijd geslapen" value={latestSlaap ? fmtMin(Math.round(latestSlaap * 60)) : null}
          rows={rows} dataKey="slaap" color={C.purple} unit="u" />
        <MetricChart title="HRV (Hartslag variabiliteit)" value={latestHRV ? `${latestHRV} ms` : null}
          rows={rows} dataKey="hrv" color={C.green} unit="ms" />
        <MetricChart title="Rusthartslag" value={latest("rusthr") ? `${latest("rusthr")} bpm` : null}
          rows={rows} dataKey="rusthr" color={C.red} unit="bpm" />
        <MetricChart title="Gewicht" value={latestGewicht ? `${latestGewicht} kg` : null}
          rows={rows} dataKey="gewicht" color={C.blue} unit="kg" />
        <MetricChart title="Vetpercentage" value={latestVet ? `${latestVet}%` : null}
          rows={rows} dataKey="vet" color={C.orange} unit="%" />
        <MetricChart title="Spiermassa" value={latestSpier ? `${latestSpier} kg` : null}
          rows={rows} dataKey="spier" color={C.teal} unit="kg" />
      </div>
    </>
  );
}

// ── Activiteit Tab ────────────────────────────────────
function ActiviteitTab({ workouts, weekWorkouts, latest, prev }: any) {
  const latestStappen = latest("stappen");
  const latestKcal = latest("kcal");
  const prevStappen = prev("stappen");
  const prevKcal = prev("kcal");

  return (
    <>
      {/* Stats */}
      <div className="section" style={{ marginBottom: 8, marginTop: 4 }}>
        <div className="section-title">Vandaag</div>
        <div className="stats-grid">
          <StatCard label="Stappen" value={latestStappen} prevVal={prevStappen} unit="" higherBetter />
          <StatCard label="Actieve kcal" value={latestKcal} prevVal={prevKcal} unit="" higherBetter />
          <StatCard label="Water (ml)" value={latest("water")} prevVal={prev("water")} unit="" higherBetter />
          <StatCard label="Workouts 7d" value={weekWorkouts.length} unit="" />
        </div>
      </div>

      {/* Body composition */}
      <div className="section" style={{ marginBottom: 8 }}>
        <div className="section-title">Lichaamssamenstelling</div>
        <div className="stats-grid">
          <StatCard label="Gewicht" value={latest("gewicht")} prevVal={prev("gewicht")} unit=" kg" />
          <StatCard label="Vetpercentage" value={latest("vet")} prevVal={prev("vet")} unit="%" higherBetter={false} />
          <StatCard label="Spiermassa" value={latest("spier")} prevVal={prev("spier")} unit=" kg" higherBetter />
          <StatCard label="Rust-HR" value={latest("rusthr")} prevVal={prev("rusthr")} unit=" bpm" higherBetter={false} />
        </div>
      </div>

      {/* All workouts */}
      <div className="section">
        <div className="section-title">Alle workouts</div>
        <div className="sonar-card">
          {workouts.length > 0 ? (
            workouts.slice().reverse().slice(0, 20).map((w: any, i: number) => (
              <WorkoutItem key={i} w={w} />
            ))
          ) : (
            <div style={{ color: "#8e8e93", fontSize: 14, textAlign: "center", padding: "16px 0" }}>
              Geen workouts gevonden
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────
function GoalBar({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="goal-bar-item">
      <div className="goal-bar-row">
        <span>{label}</span>
        <span>{Math.round(value).toLocaleString("nl-NL")}{unit} / {goal.toLocaleString("nl-NL")}{unit} {pct >= 100 ? "✅" : ""}</span>
      </div>
      <div className="goal-track">
        <div className="goal-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function SleepPhase({ label, min, max, color }: { label: string; min: number | null; max: number; color: string }) {
  const pct = min && max > 0 ? Math.min(100, (min / max) * 100) : 0;
  return (
    <div>
      <div className="sleep-phase-row">
        <span className="sleep-phase-name" style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span className="sleep-phase-val">{fmtMin(min)}</span>
      </div>
      <div className="sleep-phase-track">
        <div className="sleep-phase-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function WorkoutItem({ w }: { w: any }) {
  return (
    <div className="workout-item">
      <div className="workout-icon">{icon(w.name ?? "")}</div>
      <div className="workout-info">
        <div className="workout-name">{w.name}</div>
        <div className="workout-meta">
          {new Date(w.start).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
          {w.duration ? ` · ${Math.round(w.duration)} min` : ""}
          {w.avghr ? ` · ❤️ ${Math.round(w.avghr)} bpm` : ""}
        </div>
      </div>
      {w.energy ? <div className="workout-kcal">{Math.round(w.energy)} kcal</div> : null}
    </div>
  );
}

function StatCard({ label, value, prevVal, unit, higherBetter }: {
  label: string; value: number | null; prevVal?: number | null; unit: string; higherBetter?: boolean;
}) {
  let deltaEl = null;
  if (value != null && prevVal != null && prevVal !== 0) {
    const diff = ((value - prevVal) / Math.abs(prevVal)) * 100;
    const cls = Math.abs(diff) < 1 ? "delta-flat" : (diff > 0) === (higherBetter !== false) && higherBetter !== undefined ? "delta-up" : "delta-down";
    deltaEl = <div className={`stat-delta ${cls}`}>{diff > 0 ? "↑" : diff < 0 ? "↓" : "→"} {Math.abs(diff).toFixed(0)}%</div>;
  }
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value != null ? value.toLocaleString("nl-NL") : "–"}<span className="stat-unit">{value != null ? unit : ""}</span></div>
      {deltaEl}
    </div>
  );
}

function PhotoCard({ title, sub, pct, gradient, accent }: { title: string; sub: string; pct: number; gradient: string; accent: string }) {
  return (
    <div className="photo-card" style={{ background: gradient }}>
      <div className="photo-card-overlay" style={{
        background: "linear-gradient(to right, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%)"
      }} />
      <div className="photo-card-content">
        <div className="photo-card-title">{title}</div>
        <div className="photo-card-sub">{sub}</div>
      </div>
      <div className="photo-card-ring">
        <PctRing pct={pct} size={72} color={accent} />
      </div>
    </div>
  );
}

function MetricChart({ title, value, rows, dataKey, color, unit }: {
  title: string; value: string | null; rows: any[]; dataKey: string; color: string; unit: string;
}) {
  const vals = rows.filter(r => r[dataKey] != null);
  return (
    <div className="metric-chart-card">
      <div className="metric-chart-label">{title}</div>
      <div className="metric-chart-val" style={!value ? { color: "#8e8e93" } as any : undefined}>
        {value ?? "Geen gegevens"}
      </div>
      {vals.length > 1 ? (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={rows} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 8 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: C.muted, fontSize: 8 }} width={24} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Line dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 40, display: "flex", alignItems: "flex-end" }}>
          {["M","D","W","D","V","Z","Z"].map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: C.muted, fontWeight: 600 }}>{d}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab Bar ───────────────────────────────────────────
function SonarTabBar({ tab, onTab }: { tab: string; onTab: (t: any) => void }) {
  return (
    <nav className="tabbar">
      <button className={`tab-item ${tab === "home" ? "active" : ""}`} onClick={() => onTab("home")}>
        <div className="tab-icon">🏠</div>Home
      </button>
      <button className={`tab-item ${tab === "trends" ? "active" : ""}`} onClick={() => onTab("trends")}>
        <div className="tab-icon">📊</div>Trends
      </button>
      <button className={`tab-item ${tab === "activiteit" ? "active" : ""}`} onClick={() => onTab("activiteit")}>
        <div className="tab-icon">❤️</div>Activiteit
      </button>
      <a className={`tab-item`} href="/chat">
        <div className="tab-icon">✦</div>AI Coach
      </a>
    </nav>
  );
}
