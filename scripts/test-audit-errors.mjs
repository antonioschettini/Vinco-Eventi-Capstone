import fetch from "node-fetch";

const BASE = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const EMAIL = "vincoeventi@gmail.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "RipBigVincoEventi!";

console.log("===============================================");
console.log(`🚀 TEST GENERAZIONE ERRORI AUDIT (4xx & 5xx) SU: ${BASE}`);
console.log("===============================================\n");

async function runTests() {
  // Autenticazione Admin per alcune chiamate con token
  console.log("🔒 Autenticazione Admin per setup test...");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken || loginData.jwt;
  console.log("   ✅ Token Admin ottenuto.\n");

  // 1. Genera Errori 404 (Not Found - 4xx)
  console.log("📌 1. Generazione errori 404 (Not Found)...");
  const notFound1 = await fetch(`${BASE}/api/services/00000000-0000-0000-0000-000000000000`);
  console.log(`   GET /api/services/... -> Status ${notFound1.status}`);

  const notFound2 = await fetch(`${BASE}/api/gallery/00000000-0000-0000-0000-000000000000`);
  console.log(`   GET /api/gallery/... -> Status ${notFound2.status}`);

  const notFound3 = await fetch(`${BASE}/api/admin/quotes/00000000-0000-0000-0000-000000000000`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`   GET /api/admin/quotes/... -> Status ${notFound3.status}`);

  // 2. Genera Errori 400 (Bad Request - 4xx)
  console.log("\n📌 2. Generazione errori 400 (Bad Request)...");
  const badReq1 = await fetch(`${BASE}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  console.log(`   POST /api/quotes ({}) -> Status ${badReq1.status}`);

  const badReq2 = await fetch(`${BASE}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "A", email: "email-errata" }),
  });
  console.log(`   POST /api/quotes (dati invalidi) -> Status ${badReq2.status}`);

  const badReq3 = await fetch(`${BASE}/api/admin/quotes/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text: "" }),
  });
  console.log(`   POST /api/admin/quotes/translate (dati vuoti) -> Status ${badReq3.status}`);

  // 3. Genera Errori 401 / 403 (Unauthorized / Forbidden - 4xx)
  console.log("\n📌 3. Generazione errori 401 / 403...");
  const unauth1 = await fetch(`${BASE}/api/admin/agenda`);
  console.log(`   GET /api/admin/agenda (senza token) -> Status ${unauth1.status}`);

  const unauth2 = await fetch(`${BASE}/api/admin/quotes`);
  console.log(`   GET /api/admin/quotes (senza token) -> Status ${unauth2.status}`);

  // 4. Genera Errori 500 (Internal Server Error - 5xx)
  console.log("\n📌 4. Generazione errori 500 (Internal Server Error)...");
  const err500_1 = await fetch(`${BASE}/api/admin/agenda/report?year=not-a-number`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`   GET /api/admin/agenda/report?year=not-a-number -> Status ${err500_1.status}`);

  const err500_2 = await fetch(`${BASE}/api/admin/quotes/00000000-0000-0000-0000-000000000000/status?stato=INVALID_STATUS_NAME`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`   PUT /api/admin/quotes/.../status?stato=INVALID -> Status ${err500_2.status}`);

  // Attendi 1.5s per consentire al servizio asincrono @Async di persistere tutti i log
  await new Promise((r) => setTimeout(r, 1500));

  // 5. Recupero Statistiche Audit aggiornate
  const todayIso = new Date().toISOString().split("T")[0];
  const statsRes = await fetch(`${BASE}/api/admin/audit/stats?from=${todayIso}&to=${todayIso}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (statsRes.ok) {
    const stats = await statsRes.json();
    console.log("\n===============================================");
    console.log("📊 STATISTICHE AUDIT FINALI NEL DATABASE");
    console.log("===============================================");
    console.log(`👁️  Visite Totali:  ${stats.totalVisits}`);
    console.log(`⚠️  Errori Totali:  ${stats.totalErrors}`);
    console.log(`🔴 Errori per Status Code:`, stats.errorsByStatus);
  }

  // 6. Elenco degli ultimi errori registrati
  const errorsRes = await fetch(`${BASE}/api/admin/audit/errors?page=0&size=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (errorsRes.ok) {
    const errorsData = await errorsRes.json();
    console.log("\n===============================================");
    console.log(`📋 REGISTRO DELLE ULTIME ${errorsData.content.length} ECCEZIONI CATTURATE`);
    console.log("===============================================");
    errorsData.content.forEach((err, idx) => {
      console.log(`${idx + 1}. [Status ${err.httpStatus}] ${err.httpMethod} ${err.requestUri}`);
      console.log(`   Tipo: ${err.errorType} | Messaggio: ${err.errorMessage?.substring(0, 120)}...`);
      console.log(`   Data: ${err.occurredAt}\n`);
    });
  }
}

runTests();
