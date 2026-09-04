import fetch from "node-fetch";

const BASE = "http://localhost:8080";

async function checkStats() {
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL || "vincoeventi@gmail.com", password: process.env.ADMIN_PASSWORD }),
  });
  const data = await loginRes.json();
  const token = data.token || data.accessToken || data.jwt;

  const todayIso = new Date().toISOString().split("T")[0];
  const statsRes = await fetch(`${BASE}/api/admin/audit/stats?from=${todayIso}&to=${todayIso}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const stats = await statsRes.json();
  console.log("📊 STATO ATTUALE AUDIT:");
  console.log("   Errori Totali:", stats.totalErrors);
  console.log("   Errori per status:", stats.errorsByStatus);
}

checkStats();
