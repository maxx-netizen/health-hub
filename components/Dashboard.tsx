"use client";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from "recharts";
import type { DailyData, Insight } from "@/lib/summary";

const C = { grid: "#1f2b47", text: "#8b9bbd", blue: "#38bdf8", green: "#34d399", purple: "#a78bfa", orange: "#fb923c", pink: "#f472b6", yellow: "#facc15" };

function fmtDay(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function Dashboard({ daily, workouts, insights }: { daily: DailyData; workouts: any[]; insights: Insight[] }) {
  const [range, setRange] = useState(30);
  const allDays = Object.keys(daily).sort();
  const days = allDays.slice(-range);

  const rows = days.map((d) => {
    const m = daily[d] ?? {};
    return {
      day: fmtDay(d),
      slaap: m["sleep_analysis.asleep"] != null ? +(m["sleep_analysis.asleep"] / 60).toFixed(1) : null,
      diep: m["sleep_analysis.deep"] != null ? +(m["sleep_analysis.deep"] / 60).toFixed(1) : null,
      rem: m["sleep_analysis.rem"] != null ? +(m["sleep_analysis.rem"] / 60).toFixed(1) : null,
      hrv: m["heart_rate_variability.qty"] != null ? Math.round(m["heart_rate_variability.qty"]) : null,
      rusthr: m["resting_heart_rate.qty"] != null ? Math.round(m["resting_heart_rate.qty"]) : null,
      stappen: m["step_count.qty"] != null ? Math.round(m["step_count.qty"]) : null,
      water: m["dietary_water.qty"] != null ? Math.round(m["dietary_water.qty"]) : null,
      gewicht: m["weight_body_mass.qty"] != null ? +m["weight_body_mass.qty"].toFixed(1) : null,
      vet: m["body_fat_percentage.qty"] != null ? +m["body_fat_percentage.qty"].toFixed(1) : null,
    };
  });

  const latest = (key: keyof (typeof rows)[0]) => {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] != null) return rows[i][key];
    return null;
  };

  const hasData = allDays.length > 0;
  const weekWorkouts = workouts.filter((w) => new Date(w.start) > new Date(Date.now() - 7 * 86400000));

  if (!hasData) {
    return (
      <div className="container">
        <Nav />
        <div className="empty">
          <h2>Nog geen data 📡</h2>
          <p>
            Zodra Health Auto Export zijn eerste push doet naar <code>/api/ingest</code>,<br />
            verschijnt hier je dashboard. Zie de README voor de setup.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Nav />
      <div className="range">
        {[7, 30, 90].map((r) => (
          <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>
            {r} dagen
          </button>
        ))}
      </div>

      <div className="grid">
        <Stat label="Gewicht" value={latest("gewicht")} unit=" kg" />
        <Stat label="Vet%" value={latest("vet")} unit="%" />
        <Stat label="Slaap (laatst)" value={latest("slaap")} unit=" u" />
        <Stat label="HRV" value={latest("hrv")} unit=" ms" />
        <Stat label="Rusthartslag" value={latest("rusthr")} unit=" bpm" />
        <Stat label="Stappen (laatst)" value={latest("stappen")} unit="" />
        <Stat label="Water (laatst)" value={latest("water")} unit=" ml" />
        <Stat label="Workouts (7d)" value={weekWorkouts.length} unit="" />
      </div>

      {insights.length > 0 && (
        <div className="insights">
          <h2>💡 Inzichten</h2>
          {insights.map((ins, i) => (
            <p key={i}>{ins.emoji} {ins.text}</p>
          ))}
        </div>
      )}

      <div className="charts">
        <Chart title="😴 Slaap (uren)">
          <BarChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 11 }} />
            <YAxis tick={{ fill: C.text, fontSize: 11 }} />
            <Tooltip contentStyle={tt} />
            <Legend />
            <Bar dataKey="diep" name="Diep" stackId="s" fill={C.purple} />
            <Bar dataKey="rem" name="REM" stackId="s" fill={C.blue} />
            <Bar dataKey="slaap" name="Totaal" fill={C.green} hide />
          </BarChart>
        </Chart>
        <Chart title="❤️ HRV & rusthartslag">
          <LineChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 11 }} />
            <YAxis tick={{ fill: C.text, fontSize: 11 }} />
            <Tooltip contentStyle={tt} />
            <Legend />
            <Line dataKey="hrv" name="HRV (ms)" stroke={C.green} dot={false} connectNulls />
            <Line dataKey="rusthr" name="Rust-HR (bpm)" stroke={C.pink} dot={false} connectNulls />
          </LineChart>
        </Chart>
        <Chart title="⚖️ Gewicht & vetpercentage">
          <LineChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 11 }} />
            <YAxis yAxisId="l" domain={["auto", "auto"]} tick={{ fill: C.text, fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" domain={["auto", "auto"]} tick={{ fill: C.text, fontSize: 11 }} />
            <Tooltip contentStyle={tt} />
            <Legend />
            <Line yAxisId="l" dataKey="gewicht" name="Gewicht (kg)" stroke={C.blue} dot={false} connectNulls />
            <Line yAxisId="r" dataKey="vet" name="Vet (%)" stroke={C.orange} dot={false} connectNulls />
          </LineChart>
        </Chart>
        <Chart title="🚶 Stappen">
          <BarChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 11 }} />
            <YAxis tick={{ fill: C.text, fontSize: 11 }} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="stappen" name="Stappen" fill={C.blue} />
          </BarChart>
        </Chart>
        <Chart title="💧 Water (ml)">
          <BarChart data={rows}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: C.text, fontSize: 11 }} />
            <YAxis tick={{ fill: C.text, fontSize: 11 }} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="water" name="Water (ml)" fill={C.blue} />
          </BarChart>
        </Chart>
      </div>

      {workouts.length > 0 && (
        <div className="insights" style={{ marginTop: 24 }}>
          <h2>🏋️ Recente workouts</h2>
          {workouts.slice(-10).reverse().map((w, i) => (
            <p key={i}>
              {new Date(w.start).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })} — <b>{w.name}</b>
              {w.duration ? `, ${Math.round(w.duration)} min` : ""}
              {w.energy ? `, ${Math.round(w.energy)} kcal` : ""}
              {w.avghr ? `, ❤️ ${Math.round(w.avghr)} gem.` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

const tt = { background: "#131c31", border: "1px solid #1f2b47", borderRadius: 10, color: "#e8edf7" };

function Nav() {
  return (
    <div className="nav">
      <h1>🩺 Health Hub</h1>
      <div className="links">
        <a href="/">Dashboard</a>
        <a href="/chat">AI-chat 💬</a>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: any; unit: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value != null ? `${typeof value === "number" ? value.toLocaleString("nl-NL") : value}${unit}` : "–"}</div>
    </div>
  );
}

function Chart({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={240}>{children}</ResponsiveContainer>
    </div>
  );
}
