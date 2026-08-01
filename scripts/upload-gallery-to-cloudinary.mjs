/**
 * upload-gallery-to-cloudinary.mjs
 *
 * Script batch: per ogni item nella galleria che ha un src locale (/src/assets/...),
 * carica il file su Cloudinary tramite il backend e aggiorna il DB con l'URL Cloudinary.
 *
 * Uso: node scripts/upload-gallery-to-cloudinary.mjs
 * (da eseguire dalla root del progetto, con il backend attivo su localhost:8080)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";
import fetch from "node-fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = path.resolve(__dirname, "../frontend/src");
const BACKEND_URL = "http://localhost:8080";
const ADMIN_EMAIL = "vincoeventi@gmail.com";
const ADMIN_PASSWORD = "RipBigVincoEventi!";

// Piccola pausa per non sovraccaricare Cloudinary
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. Login e ottenimento JWT ---
async function getAuthToken() {
  console.log("Autenticazione admin in corso...");
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login fallito (${res.status}): ${body}`);
  }

  const data = await res.json();
  const token = data.token || data.accessToken || data.jwt;
  if (!token) throw new Error("Token JWT non trovato nella risposta: " + JSON.stringify(data));
  console.log("Token JWT ottenuto con successo.\n");
  return token;
}

// --- 2. Recupera tutti gli item della galleria dal DB ---
async function fetchGalleryItems() {
  console.log("Recupero elementi galleria dal DB...");
  const res = await fetch(`${BACKEND_URL}/api/gallery`);
  if (!res.ok) throw new Error(`Errore fetch galleria: ${res.status}`);
  const items = await res.json();
  console.log(`Trovati ${items.length} elementi totali.\n`);
  return items;
}

// --- 3. Mappa il percorso DB -> percorso file locale ---
function resolveLocalPath(src) {
  let decoded;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    decoded = src;
  }
  const relativePart = decoded.replace(/^\/src\//, "");
  return path.join(FRONTEND_SRC, relativePart);
}

// --- 4. Upload file su Cloudinary tramite endpoint backend ---
async function uploadToCloudinary(localFilePath, token) {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File non trovato: ${localFilePath}`);
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(localFilePath));

  const res = await fetch(`${BACKEND_URL}/api/admin/gallery/upload-media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload fallito (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.url;
}

// --- 5. Aggiorna il record nel DB con il nuovo src Cloudinary ---
async function updateGalleryItemSrc(item, cloudinaryUrl, token) {
  const payload = {
    titleIta: item.titleIta,
    titleEng: item.titleEng,
    subtitleIta: item.subtitleIta,
    subtitleEng: item.subtitleEng,
    type: item.type,
    src: cloudinaryUrl,
    category: item.category,
    featured: item.featured,
    startTime: item.startTime,
    displayOrder: item.displayOrder,
  };

  const res = await fetch(`${BACKEND_URL}/api/admin/gallery/${item.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Update DB fallito (${res.status}): ${body}`);
  }
}

// --- MAIN ---
async function main() {
  console.log("=".repeat(60));
  console.log("  Gallery Cloudinary Batch Uploader - Vinco Eventi");
  console.log("=".repeat(60) + "\n");

  const token = await getAuthToken();
  const items = await fetchGalleryItems();

  const toProcess = items.filter((item) => item.src && !item.src.startsWith("http"));
  const alreadyOk = items.filter((item) => item.src && item.src.startsWith("http"));

  console.log(`Riepilogo:`);
  console.log(`  Gia su Cloudinary: ${alreadyOk.length}`);
  console.log(`  Da caricare: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("Tutti i media sono gia su Cloudinary! Niente da fare.");
    return;
  }

  const results = { success: [], failed: [] };

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i];
    const localPath = resolveLocalPath(item.src);
    const shortName = path.basename(localPath);

    console.log(`[${i + 1}/${toProcess.length}] "${item.titleIta}"`);
    console.log(`  File: ${shortName}`);

    try {
      console.log(`  Upload su Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(localPath, token);
      console.log(`  URL: ${cloudinaryUrl.substring(0, 80)}`);

      console.log(`  Aggiornamento DB...`);
      await updateGalleryItemSrc(item, cloudinaryUrl, token);
      console.log(`  OK!\n`);

      results.success.push({ title: item.titleIta, url: cloudinaryUrl });
    } catch (err) {
      console.error(`  ERRORE: ${err.message}\n`);
      results.failed.push({ title: item.titleIta, src: item.src, error: err.message });
    }

    if (i < toProcess.length - 1) await sleep(500);
  }

  console.log("\n" + "=".repeat(60));
  console.log("  REPORT FINALE");
  console.log("=".repeat(60));
  console.log(`Caricati con successo: ${results.success.length}/${toProcess.length}`);

  if (results.failed.length > 0) {
    console.log(`\nFalliti (${results.failed.length}):`);
    results.failed.forEach((f) => {
      console.log(`  - "${f.title}": ${f.error}`);
    });
  } else {
    console.log("\nTutti i media sono stati caricati su Cloudinary e il DB e stato aggiornato!");
    console.log("Puoi ora svuotare le cartelle assets/galleria/ e assets/nuove Foto VIdeo/");
  }
}

main().catch((err) => {
  console.error("\nErrore critico:", err.message);
  process.exit(1);
});
