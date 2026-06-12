import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") ?? "30"), 365);
  const since = new Date(Date.now() - days * 86400000);
  const sql = await db();
  const [metrics, workouts] = await Promise.all([
    sql`SELECT * FROM metric WHERE date >= ${since} ORDER BY date ASC`,
    sql`SELECT * FROM workout WHERE start >= ${since} ORDER BY start ASC`,
  ]);
  return NextResponse.json({ metrics, workouts });
}
