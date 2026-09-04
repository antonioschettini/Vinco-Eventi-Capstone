import pg from "pg";

const { Client } = pg;

const pgConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "vincoeventi",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
};

async function cleanAuditLogs() {
  const client = new Client(pgConfig);
  try {
    await client.connect();
    const res = await client.query("DELETE FROM audit_error_log");
    console.log(`✅ Pulizia completata: eliminati ${res.rowCount} log di test dalla tabella audit_error_log.`);
  } catch (err) {
    console.error("❌ Errore durante la pulizia dei log:", err.message);
  } finally {
    await client.end();
  }
}

cleanAuditLogs();
