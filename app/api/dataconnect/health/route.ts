import { getPostgresPool } from "@/lib/postgres";

function resolveConnectionSource() {
  if (process.env.FIREBASE_DATA_CONNECT_POSTGRES_URL) {
    return "FIREBASE_DATA_CONNECT_POSTGRES_URL";
  }
  if (process.env.DATABASE_URL) {
    return "DATABASE_URL";
  }
  if (process.env.POSTGRES_URL) {
    return "POSTGRES_URL";
  }
  if (process.env.FIREBASE_DATA_CONNECT_SQL_CONNECT) {
    return "FIREBASE_DATA_CONNECT_SQL_CONNECT";
  }
  return "none";
}

export async function GET() {
  const source = resolveConnectionSource();

  try {
    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query("select 1");
      return Response.json({
        ok: true,
        source,
        message: "Data Connect database reachable.",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Could not connect to database.";

    const isLocalRefused =
      /ECONNREFUSED/i.test(rawMessage) &&
      /(127\.0\.0\.1|localhost):9399/.test(rawMessage);

    const message = isLocalRefused
      ? "Could not reach local SQL Connect at 127.0.0.1:9399. Start the SQL tunnel/emulator and restart dev server."
      : rawMessage;

    return Response.json(
      {
        ok: false,
        source,
        message,
      },
      { status: 500 }
    );
  }
}
