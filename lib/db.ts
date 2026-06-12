import postgres from "postgres";

// Tabellen worden automatisch aangemaakt bij het eerste gebruik.
const globalAny = globalThis as any;

function getSql() {
  if (!globalAny.__sql) {
    globalAny.__sql = postgres(process.env.DATABASE_URL!, { max: 1, ssl: "require" });
  }
  return globalAny.__sql as ReturnType<typeof postgres>;
}

async function init(sql: ReturnType<typeof postgres>) {
  await sql`CREATE TABLE IF NOT EXISTS metric (
    id serial PRIMARY KEY,
    date timestamptz NOT NULL,
    name text NOT NULL,
    field text NOT NULL,
    value double precision NOT NULL,
    units text,
    UNIQUE (date, name, field)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS metric_name_date ON metric (name, date)`;
  await sql`CREATE TABLE IF NOT EXISTS workout (
    id serial PRIMARY KEY,
    start timestamptz NOT NULL,
    "end" timestamptz NOT NULL,
    name text NOT NULL,
    duration double precision,
    energy double precision,
    distance double precision,
    avghr double precision,
    maxhr double precision,
    UNIQUE (start, name)
  )`;
}

export async function db() {
  const sql = getSql();
  if (!globalAny.__sqlReady) globalAny.__sqlReady = init(sql);
  await globalAny.__sqlReady;
  return sql;
}
