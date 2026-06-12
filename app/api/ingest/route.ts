import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Ontvangt automatische pushes van de Health Auto Export app (REST API automation).
// URL in de app: https://JOUW-APP.vercel.app/api/ingest?key=INGEST_SECRET
function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(String(s).replace(" +", "+").replace(" -", "-"));
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-api-key");
  if (key !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sql = await db();
  const metrics = body?.data?.metrics ?? [];
  const workouts = body?.data?.workouts ?? [];

  // Alle numerieke velden van elk datapunt opslaan (qty, Avg, deep, rem, ...)
  const rows: { date: Date; name: string; field: string; value: number; units: string | null }[] = [];
  for (const metric of metrics) {
    const name = String(metric.name ?? "unknown");
    const units = metric.units ? String(metric.units) : null;
    for (const point of metric.data ?? []) {
      const date = parseDate(point.date);
      if (!date) continue;
      for (const f of Object.keys(point)) {
        if (f === "date" || f === "source") continue;
        const v = point[f];
        if (typeof v !== "number" || !isFinite(v)) continue;
        rows.push({ date, name, field: f, value: v, units });
      }
    }
  }

  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    await sql`
      INSERT INTO metric ${sql(chunk, "date", "name", "field", "value", "units")}
      ON CONFLICT (date, name, field) DO UPDATE SET value = excluded.value, units = excluded.units
    `;
  }

  let savedWorkouts = 0;
  for (const w of workouts) {
    const start = parseDate(w.start);
    const end = parseDate(w.end);
    if (!start || !end) continue;
    const name = String(w.name ?? "Workout");
    const num = (x: any) => (typeof x === "number" ? x : typeof x?.qty === "number" ? x.qty : null);
    await sql`
      INSERT INTO workout (start, "end", name, duration, energy, distance, avghr, maxhr)
      VALUES (${start}, ${end}, ${name}, ${num(w.duration)}, ${num(w.activeEnergyBurned ?? w.activeEnergy)},
              ${num(w.distance)}, ${num(w.avgHeartRate ?? w.heartRateAvg)}, ${num(w.maxHeartRate ?? w.heartRateMax)})
      ON CONFLICT (start, name) DO UPDATE SET
        "end" = excluded."end", duration = excluded.duration, energy = excluded.energy,
        distance = excluded.distance, avghr = excluded.avghr, maxhr = excluded.maxhr
    `;
    savedWorkouts++;
  }

  return NextResponse.json({ ok: true, metrics: rows.length, workouts: savedWorkouts });
}
