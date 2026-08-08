// Test invio preventivo backend senza numeroOspiti
import fetch from "node-fetch";

const BASE = "http://localhost:8080";

async function testQuoteSubmission() {
  console.log("=== TEST POST /api/quotes ===");
  const payload = {
    nome: "Antonio",
    cognome: "Schettini",
    email: "antonio.schettini93@gmail.com",
    telefono: "+39 3496037722",
    dataEvento: "2026-08-09",
    tipoEvento: "Matrimonio",
    location: "Masseria Coccaro, Monopoli",
    numeroOspiti: null,
    orarioGiornata: "Pranzo",
    tipoCerimonia: "Religioso",
    messaggio: "Test richiesta preventivo da script di verifica",
    budget: "1.500€-3.000€",
    lingua: "it",
  };

  try {
    const res = await fetch(`${BASE}/api/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    if (res.ok) {
      console.log("✅ POST /api/quotes RIUSCITO!");
      console.log("ID Preventivo creato:", data.id);
      console.log("Stato:", data.stato);
      console.log("Location ricevuta:", data.location);
      console.log("Numero Ospiti:", data.numeroOspiti);
    } else {
      console.log("❌ POST /api/quotes FALLITO!");
      console.log("Errore backend:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log("Backend non attivo o irraggiungibile su http://localhost:8080:", err.message);
  }
}

testQuoteSubmission();
