import pg from "pg";

const { Client } = pg;

const pgConfig = {
  host: "localhost",
  port: 5432,
  database: "vincoeventi",
  user: "postgres",
  password: "1234",
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
