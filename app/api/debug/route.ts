import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Statusoverzicht: welke metrics zitten er in de database?
// Gebruik: /api/debug?key=INGEST_SECRET
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sql = await db();
  const metrics = await sql`
    SELECT name, count(*)::int AS punten, min(date)::date AS van, max(date)::date AS tot
    FROM metric GROUP BY name ORDER BY name`;
  const workouts = await sql`SELECT count(*)::int AS n FROM workout`;
  return NextResponse.json({
    metrics_in_database: metrics,
    workouts: workouts[0].n,
  });
}
