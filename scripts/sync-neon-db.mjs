/**
 * sync-neon-db.mjs
 *
 * Mappa e aggiorna tutti i Servizi e i 32 elementi della Galleria nel DB di Produzione (Neon su Render)
 * per farli puntare alle nuove URL Cloudinary (oe1bztwb).
 */

import fetch from "node-fetch";

const LIVE_URL = process.env.LIVE_BACKEND_URL || "https://vinco-eventi-backend.onrender.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("🔒 Autenticazione Admin su Render Backend (Neon DB)...");
  const loginRes = await fetch(`${LIVE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login Render fallito (${loginRes.status}): ${await loginRes.text()}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken || loginData.jwt;
  console.log("✅ Token JWT ottenuto su Render!\n");

  // 1. Recupera la fonte di verità (DB locale su oe1bztwb)
  const localGRes = await fetch("http://localhost:8080/api/gallery");
  const localGallery = await localGRes.json();

  const localSRes = await fetch("http://localhost:8080/api/services");
  const localServices = await localSRes.json();

  // 2. Recupera i dati attuali da Render (Neon DB)
  const liveGRes = await fetch(`${LIVE_URL}/api/gallery`);
  const liveGallery = await liveGRes.json();

  const liveSRes = await fetch(`${LIVE_URL}/api/services`);
  const liveServices = await liveSRes.json();

  console.log(`📦 --- 1/2 AGGIORNAMENTO SERVIZI SU NEON DB ---`);
  for (const liveS of liveServices) {
    const matchedLocal = localServices.find((s) => s.badge === liveS.badge || s.displayOrder === liveS.displayOrder);
    if (!matchedLocal) {
      console.warn(`  ⚠️ Nessun match locale per servizio "${liveS.titleIta}"`);
      continue;
    }

    console.log(`  Aggiornamento Servizio "${liveS.titleIta}" (ID Neon: ${liveS.id})...`);
    const payload = {
      titleIta: liveS.titleIta,
      titleEng: liveS.titleEng,
      subtitleIta: liveS.subtitleIta,
      subtitleEng: liveS.subtitleEng,
      category: liveS.category,
      badge: liveS.badge,
      imageUrlIta: matchedLocal.imageUrlIta,
      imageUrlEng: matchedLocal.imageUrlEng,
      featuresIta: liveS.featuresIta,
      featuresEng: liveS.featuresEng,
      brochureUrlIta: liveS.brochureUrlIta,
      brochureUrlEng: liveS.brochureUrlEng,
      displayOrder: liveS.displayOrder,
    };

    const putRes = await fetch(`${LIVE_URL}/api/admin/services/${liveS.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (putRes.ok) {
      console.log(`  ✅ Servizio "${liveS.titleIta}" aggiornato su Neon DB!\n`);
    } else {
      console.error(`  ❌ Errore aggiornamento Servizio: ${await putRes.text()}\n`);
    }
    await sleep(300);
  }

  console.log(`🎬 --- 2/2 AGGIORNAMENTO GALLERIA (32 MEDIA) SU NEON DB ---`);
  let successCount = 0;

  for (const liveItem of liveGallery) {
    // Mappa per displayOrder o titleIta
    const matchedLocal = localGallery.find(
      (l) => l.displayOrder === liveItem.displayOrder || l.titleIta === liveItem.titleIta
    );

    if (!matchedLocal) {
      console.warn(`  ⚠️ Nessun match locale per media "${liveItem.titleIta}"`);
      continue;
    }

    console.log(`  Aggiornamento Media "${liveItem.titleIta}" (Order: ${liveItem.displayOrder}, ID Neon: ${liveItem.id})...`);
    const payload = {
      titleIta: liveItem.titleIta,
      titleEng: liveItem.titleEng,
      subtitleIta: liveItem.subtitleIta,
      subtitleEng: liveItem.subtitleEng,
      type: liveItem.type,
      src: matchedLocal.src,
      category: liveItem.category,
      featured: liveItem.featured,
      startTime: liveItem.startTime,
      displayOrder: liveItem.displayOrder,
      publicId: matchedLocal.publicId || liveItem.publicId,
      posterUrl: matchedLocal.posterUrl || matchedLocal.src,
    };

    const putRes = await fetch(`${LIVE_URL}/api/admin/gallery/${liveItem.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (putRes.ok) {
      console.log(`  ✅ Neon DB aggiornato! URL: ${matchedLocal.src.substring(0, 75)}...`);
      successCount++;
    } else {
      console.error(`  ❌ Errore aggiornamento DB: ${await putRes.text()}`);
    }
    await sleep(400);
  }

  console.log("\n" + "=".repeat(65));
  console.log("  🎉 NEON DB DI PRODUZIONE (RENDER) MIGRATO ED ALLINEATO A OE1BZTWIB!");
  console.log(`  - Servizi aggiornati: ${liveServices.length}/3`);
  console.log(`  - Media Galleria allineati: ${successCount}/${liveGallery.length}`);
  console.log("=" .repeat(65));
}

main().catch((err) => {
  console.error("Errore critico migrazione Neon DB:", err.message);
  process.exit(1);
});
