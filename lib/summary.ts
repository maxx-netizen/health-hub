import { db } from "@/lib/db";

// Metrics die je per dag optelt i.p.v. middelt
const SUM_METRICS = new Set([
  "step_count", "active_energy", "basal_energy_burned", "dietary_water",
  "apple_exercise_time", "flights_climbed", "distance_walking_running", "sleep_analysis",
]);

export type DailyData = Record<string, Record<string, number>>; // dag -> "metric.field" -> waarde

export async function getDailyData(days: number): Promise<{ daily: DailyData; workouts: any[] }> {
  const since = new Date(Date.now() - days * 86400000);
  const sql = await db();
  const [metrics, workouts] = await Promise.all([
    sql`SELECT * FROM metric WHERE date >= ${since} ORDER BY date ASC`,
    sql`SELECT * FROM workout WHERE start >= ${since} ORDER BY start ASC`,
  ])as unknown as [any[], any[]];

  const acc: Record<string, Record<string, { sum: number; n: number }>> = {};
  for (const m of metrics) {
    const day = new Date(m.date).toISOString().slice(0, 10);
    const key = `${m.name}.${m.field}`;
    acc[day] ??= {};
    acc[day][key] ??= { sum: 0, n: 0 };
    acc[day][key].sum += m.value;
    acc[day][key].n++;
  }

  const daily: DailyData = {};
  for (const day of Object.keys(acc).sort()) {
    daily[day] = {};
    for (const key of Object.keys(acc[day])) {
      const name = key.split(".")[0];
      const { sum, n } = acc[day][key];
      daily[day][key] = SUM_METRICS.has(name) ? sum : sum / n;
    }
  }
  return { daily, workouts };
}

function avg(values: number[]): number | null {
  const v = values.filter((x) => isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function pick(daily: DailyData, dayKeys: string[], metric: string): number[] {
  return dayKeys.map((d) => daily[d]?.[metric]).filter((v) => typeof v === "number") as number[];
}

export interface Insight {
  emoji: string;
  text: string;
}

// Regelgebaseerde week-op-week inzichten (Nederlands)
export function computeInsights(daily: DailyData): Insight[] {
  const days = Object.keys(daily).sort();
  const last7 = days.slice(-7);
  const prev7 = days.slice(-14, -7);
  const out: Insight[] = [];

  const compare = (
    metric: string, label: string, unit: string,
    fmt: (v: number) => string, higherIsBetter: boolean | null
  ) => {
    const nu = avg(pick(daily, last7, metric));
    const vorig = avg(pick(daily, prev7, metric));
    if (nu == null) return;
    if (vorig == null) {
      out.push({ emoji: "📊", text: `${label}: gemiddeld ${fmt(nu)}${unit} afgelopen 7 dagen.` });
      return;
    }
    const diff = ((nu - vorig) / vorig) * 100;
    const arrow = diff > 1 ? "↑" : diff < -1 ? "↓" : "→";
    let emoji = "📊";
    if (higherIsBetter !== null && Math.abs(diff) > 1) {
      emoji = (diff > 0) === higherIsBetter ? "✅" : "⚠️";
    }
    out.push({
      emoji,
      text: `${label}: ${fmt(nu)}${unit} ${arrow} ${diff >= 0 ? "+" : ""}${diff.toFixed(0)}% t.o.v. vorige week (${fmt(vorig)}${unit}).`,
    });
  };

  const uur = (v: number) => (v / 60).toFixed(1).replace(".", ",");
  compare("sleep_analysis.asleep", "Slaap", " uur", (v) => uur(v), true);
  compare("sleep_analysis.deep", "Diepe slaap", " uur", (v) => uur(v), true);
  compare("heart_rate_variability.qty", "HRV", " ms", (v) => v.toFixed(0), true);
  compare("resting_heart_rate.qty", "Rusthartslag", " bpm", (v) => v.toFixed(0), false);
  compare("step_count.qty", "Stappen", "", (v) => Math.round(v).toLocaleString("nl-NL"), true);
  compare("dietary_water.qty", "Water", " ml", (v) => v.toFixed(0), true);
  compare("weight_body_mass.qty", "Gewicht", " kg", (v) => v.toFixed(1).replace(".", ","), null);
  compare("body_fat_percentage.qty", "Vetpercentage", "%", (v) => v.toFixed(1).replace(".", ","), false);

  // Drempel-checks
  const water = avg(pick(daily, last7, "dietary_water.qty"));
  if (water != null && water < 2000) {
    out.push({ emoji: "💧", text: `Je dronk gemiddeld ${(water / 1000).toFixed(1).replace(".", ",")} L per dag — richt op minimaal 2 L.` });
  }
  const slaap = avg(pick(daily, last7, "sleep_analysis.asleep"));
  if (slaap != null && slaap < 7 * 60) {
    out.push({ emoji: "😴", text: `Gemiddeld ${uur(slaap)} uur slaap — onder de aanbevolen 7 uur.` });
  }
  return out;
}

// Compacte tekstsamenvatting van de data, als context voor de AI
export function buildAIContext(daily: DailyData, workouts: any[]): string {
  const days = Object.keys(daily).sort();
  const lines: string[] = ["Dagelijkse gezondheidsdata (laatste " + days.length + " dagen):"];
  const interesting = [
    ["sleep_analysis.asleep", "slaap_min"], ["sleep_analysis.deep", "diepe_slaap_min"],
    ["sleep_analysis.rem", "rem_min"], ["heart_rate_variability.qty", "hrv_ms"],
    ["resting_heart_rate.qty", "rusthartslag"], ["heart_rate.Avg", "hartslag_gem"],
    ["step_count.qty", "stappen"], ["active_energy.qty", "actieve_kcal"],
    ["dietary_water.qty", "water_ml"], ["weight_body_mass.qty", "gewicht_kg"],
    ["body_fat_percentage.qty", "vet_pct"], ["lean_body_mass.qty", "spiermassa_kg"],
    ["respiratory_rate.qty", "ademhaling"], ["blood_oxygen_saturation.qty", "spo2"],
    ["vo2_max.qty", "vo2max"],
  ];
  for (const day of days) {
    const parts: string[] = [];
    for (const [key, label] of interesting) {
      const v = daily[day]?.[key];
      if (typeof v === "number") parts.push(`${label}=${Math.round(v * 10) / 10}`);
    }
    if (parts.length) lines.push(`${day}: ${parts.join(", ")}`);
  }
  if (workouts.length) {
    lines.push("\nWorkouts:");
    for (const w of workouts.slice(-30)) {
      lines.push(
        `${new Date(w.start).toISOString().slice(0, 10)}: ${w.name}` +
        (w.duration ? `, ${Math.round(w.duration)} min` : "") +
        (w.energy ? `, ${Math.round(w.energy)} kcal` : "") +
        (w.avghr ? `, gem. HR ${Math.round(w.avghr)}` : "")
      );
    }
  }
  return lines.join("\n");
}
