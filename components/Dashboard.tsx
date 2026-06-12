"use client";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, Area, AreaChart,
} from "recharts";
import type { DailyData, Insight } from "@/lib/summary";
import TabBar from "@/components/TabBar";

const C = { grid: "#2c2c2e", text: "#8e8e93", blue: "#0a84ff", green: "#30d158", purple: "#bf5af2", orange: "#ff9f0a", red: "#ff375f", teal: "#64d2ff", indigo: "#5e5ce6", yellow: "#ffd60a" };
const tt = { background: "#1c1c1e", border: "0.5px solid #38383a", borderRadius: 12, color: "#fff", fontSize: 13 };

function fmtDay(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

const WORKOUT_ICONS: Record<string, string> = {
  hardlopen: "🏃", running: "🏃", run: "🏃", wandelen: "🚶", walking: "🚶", walk: "🚶",
  fietsen: "🚴", cycling: "🚴", kracht: "🏋️", strength: "🏋️", traditional: "🏋️",
  zwemmen: "🏊", swimming: "🏊", voetbal: "⚽", soccer: "⚽", football: "⚽",
  yoga: "🧘", core: "🤸", hiit: "🔥", elliptical: "🚲", rowing: "🚣",
};
function workoutIcon(name: string) {
  const n = name.toLowerCase();
  for (const k of Object.keys(WORKOUT_ICONS)) if (n.includes(k)) return WORKOUT_ICONS[k];
  return "💪";
}

function ScoreRing({ score }: { score: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const color = score >= 75 ? C.green : score >= 50 ? C.yellow : C.red;
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#2c2c2e" strokeWidth="11" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 65 65)" />
      <text x="65" y="62" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="800">{score}</text>
      <text x="65" y="82" textAnchor="middle" fill="#8e8e93" fontSize="11" fontWeight="600">DAGSCORE</text>
    </svg>
  );
}

export default function Dashboard({ daily, workouts, insights, dayScore }: {
  daily: DailyData; workouts: any[]; insights: Insight[];
  dayScore: { score: number; parts: { label: string; pct: number }[] } | null;
}) {
  const [range, setRange] = useState(30);
  const allDays = Object.keys(daily).sort();
  const days = allDays.slice(-range);

  const rows = days.map((d) => {
    const m = daily[d] ?? {};
    const v = (k: string, f = 1, dec = 1) => (m[k] != null ? +((m[k] * f).toFixed(dec)) : null);
    return {
      day: fmtDay(d),
      slaap: v("sleep.total", 1 / 60), diep: v("sleep.deep", 1 / 60), rem: v("sleep.rem", 1 / 60), licht: v("sleep.core", 1 / 60),
      hrv: v("heart_rate_variability.qty", 1, 0), rusthr: v("resting_heart_rate.qty", 1, 0),
      stappen: v("step_count.qty", 1, 0), water: v("dietary_water.qty", 1, 0),
      gewicht: v("weight_body_mass.qty"), vet: v("body_fat_percentage.qty"),
      spier: v("lean_body_mass.qty"), kcal: v("active_energy.qty", 1, 0),
    };
  });

  const latest = (key: keyof (typeof rows)[0]) => {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] != null) return rows[i][key] as number;
    return null;
  };
  const prev = (key: keyof (typeof rows)[0]) => {
    let found = 0;
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] != null && ++found === 2) return rows[i][key] as number;
    return null;
  };

  const today = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  const weekWorkouts = workouts.filter((w) => new Date(w.start) > new Date(Date.now() - 7 * 86400000));

  if (!allDays.length) {
    return (
      <div className="container">
        <Header today={today} />
        <div className="empty">
          <h2>Nog geen data 📡</h2>
          <p>Zodra Health Auto Export pusht naar <code>/api/ingest</code> verschijnt hier alles.</p>
        </div>
        <TabBar active="home" />
      </div>
    );
  }

  const stappenVandaag = latest("stappen") ?? 0;
  const waterVandaag = latest("water") ?? 0;

  return (
    <div className="container">
      <Header today={today} />

      {dayScore && (
        <div className="card score-card">
          <ScoreRing score={dayScore.score} />
          <div className="score-parts">
            {dayScore.parts.map((p) => (
              <div className="score-part" key={p.label}>
                <div className="row"><span>{p.label}</span><span style={{ color: "#8e8e93" }}>{p.pct}%</span></div>
                <div className="bar"><div style={{ width: `${p.pct}%`, background: p.pct >= 75 ? C.green : p.pct >= 50 ? C.yellow : C.red }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>🎯 Doelen vandaag</h3>
        <Goal label="🚶 Stappen" value={stappenVandaag} goal={8000} unit="" color={C.green} />
        <Goal label="💧 Water" value={waterVandaag} goal={2000} unit=" ml" color={C.teal} />
        <Goal label="🏋️ Workouts deze week" value={weekWorkouts.length} goal={4} unit="" color={C.orange} />
      </div>

      <div className="segment">
        {[7, 30, 90].map((r) => (
          <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r} dagen</button>
        ))}
      </div>

      <div className="grid2" style={{ marginBottom: 12 }}>
        <Stat label="😴 Slaap" value={latest("slaap")} prev={prev("slaap")} unit=" u" higherBetter />
        <Stat label="❤️ HRV" value={latest("hrv")} prev={prev("hrv")} unit=" ms" higherBetter />
        <Stat label="🫀 Rust-HR" value={latest("rusthr")} prev={prev("rusthr")} unit=" bpm" higherBetter={false} />
        <Stat label="⚖️ Gewicht" value={latest("gewicht")} prev={prev("gewicht")} unit=" kg" />
        <Stat label="📊 Vet" value={latest("vet")} prev={prev("vet")} unit="%" higherBetter={false} />
        <Stat label="💪 Spiermassa" value={latest("spier")} prev={prev("spier")} unit=" kg" higherBetter />
        <Stat label="🔥 Actieve kcal" value={latest("kcal")} prev={prev("kcal")} unit="" higherBetter />
        <Stat label="🏋️ Workouts (7d)" value={weekWorkouts.length} unit="" />
      </div>

      {insights.length > 0 && (
        <div className="card">
          <h3>💡 Inzichten</h3>
          {insights.map((ins, i) => (
            <div className="insight" key={i}><span>{ins.emoji}</span><span>{ins.text}</span></div>
          ))}
        </div>
      )}

      <div className="charts">
        <ChartCard title="😴 Slaapfases (uren)">
          <BarChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: C.text, fontSize: 10 }} width={28} />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="diep" name="Diep" stackId="s" fill={C.indigo} />
            <Bar dataKey="rem" name="REM" stackId="s" fill={C.teal} />
            <Bar dataKey="licht" name="Licht" stackId="s" fill={C.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="❤️ HRV & rusthartslag">
          <LineChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: C.text, fontSize: 10 }} width={28} />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="hrv" name="HRV (ms)" stroke={C.green} strokeWidth={2} dot={false} connectNulls />
            <Line dataKey="rusthr" name="Rust-HR" stroke={C.red} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ChartCard>
        <ChartCard title="⚖️ Lichaamssamenstelling">
          <LineChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="l" domain={["auto", "auto"]} tick={{ fill: C.text, fontSize: 10 }} width={32} />
            <YAxis yAxisId="r" orientation="right" domain={["auto", "auto"]} tick={{ fill: C.text, fontSize: 10 }} width={28} />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="l" dataKey="gewicht" name="Gewicht (kg)" stroke={C.blue} strokeWidth={2} dot={false} connectNulls />
            <Line yAxisId="r" dataKey="vet" name="Vet (%)" stroke={C.orange} strokeWidth={2} dot={false} connectNulls />
            <Line yAxisId="l" dataKey="spier" name="Spier (kg)" stroke={C.green} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ChartCard>
        <ChartCard title="🚶 Stappen & actieve calorieën">
          <AreaChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: C.text, fontSize: 10 }} width={36} />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area dataKey="stappen" name="Stappen" stroke={C.green} fill={C.green} fillOpacity={0.18} strokeWidth={2} connectNulls />
            <Area dataKey="kcal" name="Actieve kcal" stroke={C.orange} fill={C.orange} fillOpacity={0.12} strokeWidth={2} connectNulls />
          </AreaChart>
        </ChartCard>
        <ChartCard title="💧 Water (ml)">
          <BarChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: C.text, fontSize: 10 }} width={36} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="water" name="Water (ml)" fill={C.teal} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {workouts.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>🏋️ Recente workouts</h3>
          {workouts.slice(-12).reverse().map((w, i) => (
            <div className="workout" key={i}>
              <div className="icon">{workoutIcon(w.name)}</div>
              <div className="info">
                <div className="name">{w.name}</div>
                <div className="meta">
                  {new Date(w.start).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })}
                  {w.duration ? ` · ${Math.round(w.duration)} min` : ""}
                  {w.energy ? ` · ${Math.round(w.energy)} kcal` : ""}
                  {w.avghr ? ` · ❤️ ${Math.round(w.avghr)}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TabBar active="home" />
    </div>
  );
}

function Header({ today }: { today: string }) {
  return (
    <div className="header">
      <div className="date">{today}</div>
      <h1>Health Hub</h1>
    </div>
  );
}

function Goal({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div className="goal">
      <div className="row">
        <span>{label}</span>
        <span>{Math.round(value).toLocaleString("nl-NL")}{unit} / {goal.toLocaleString("nl-NL")}{unit} {pct >= 100 ? "✅" : ""}</span>
      </div>
      <div className="bar big"><div style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function Stat({ label, value, prev, unit, higherBetter }: { label: string; value: number | null; prev?: number | null; unit: string; higherBetter?: boolean }) {
  let delta: React.ReactNode = null;
  if (value != null && prev != null && prev !== 0) {
    const diff = ((value - prev) / Math.abs(prev)) * 100;
    const cls = Math.abs(diff) < 1 ? "flat" : higherBetter === undefined ? "flat" : (diff > 0) === higherBetter ? "up" : "down";
    delta = <div className={`delta ${cls}`}>{diff > 0 ? "↑" : diff < 0 ? "↓" : "→"} {Math.abs(diff).toFixed(0)}%</div>;
  }
  return (
    <div className="card stat" style={{ marginBottom: 0 }}>
      <div className="label">{label}</div>
      <div className="value">{value != null ? value.toLocaleString("nl-NL") : "–"}<small>{value != null ? unit : ""}</small></div>
      {delta}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer>
    </div>
  );
}
