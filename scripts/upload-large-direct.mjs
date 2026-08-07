/**
 * upload-large-direct.mjs
 *
 * Carica i 2 video grandi (>100MB) direttamente su Cloudinary via SDK Node.js
 * con upload chunked, poi aggiorna il DB tramite il backend.
 *
 * Usa: node scripts/upload-large-direct.mjs
 */

import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = path.resolve(__dirname, "../frontend/src");
const BACKEND_URL = "http://localhost:8080";
const ADMIN_EMAIL = "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Credenziali Cloudinary
cloudinary.config({
  cloud_name: "y9rfpsut",
  api_key: "712925246641983",
  api_secret: "sUsI55biRKpJdV4187_q9Dasp0c",
  secure: true,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getAuthToken() {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login fallito: ${res.status}`);
  const data = await res.json();
  const token = data.token || data.accessToken || data.jwt;
  if (!token) throw new Error("Token non trovato: " + JSON.stringify(data));
  return token;
}

async function fetchGalleryItems() {
  const res = await fetch(`${BACKEND_URL}/api/gallery`);
  if (!res.ok) throw new Error(`Errore galleria: ${res.status}`);
  return res.json();
}

function resolveLocalPath(src) {
  let decoded;
  try { decoded = decodeURIComponent(src); } catch { decoded = src; }
  const relativePart = decoded.replace(/^\/src\//, "");
  return path.join(FRONTEND_SRC, relativePart);
}

async function uploadLargeDirect(localFilePath) {
  console.log(`  Caricamento chunked diretto su Cloudinary...`);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      localFilePath,
      {
        folder: "vinco_eventi_galleria",
        resource_type: "video",
        chunk_size: 6 * 1024 * 1024, // chunk da 6MB
      },
      (error, result) => {
        if (error) reject(new Error(error.message));
        else resolve(result.secure_url || result.url);
      }
    );
  });
}

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

async function main() {
  console.log("=".repeat(60));
  console.log("  Upload Diretto Cloudinary - Video Grandi (>100MB)");
  console.log("=".repeat(60) + "\n");

  const token = await getAuthToken();
  console.log("Token JWT ottenuto.\n");

  const items = await fetchGalleryItems();
  const toProcess = items.filter((i) => i.src && !i.src.startsWith("http"));

  console.log(`Item con src locale da caricare: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("Tutti i media sono gia su Cloudinary!");
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
      const cloudinaryUrl = await uploadLargeDirect(localPath);
      console.log(`  URL: ${cloudinaryUrl.substring(0, 80)}`);

      await updateGalleryItemSrc(item, cloudinaryUrl, token);
      console.log(`  DB aggiornato!\n`);

      results.success.push({ title: item.titleIta, url: cloudinaryUrl });
    } catch (err) {
      console.error(`  ERRORE: ${err.message}\n`);
      results.failed.push({ title: item.titleIta, error: err.message });
    }

    if (i < toProcess.length - 1) await sleep(1000);
  }

  console.log("=".repeat(60));
  console.log("  REPORT FINALE");
  console.log("=".repeat(60));
  console.log(`Caricati con successo: ${results.success.length}/${toProcess.length}`);

  if (results.failed.length > 0) {
    console.log(`\nFalliti (${results.failed.length}):`);
    results.failed.forEach((f) => console.log(`  - "${f.title}": ${f.error}`));
  } else {
    console.log("\nTutti i video grandi sono ora su Cloudinary!");
  }
}

main().catch((err) => {
  console.error("Errore critico:", err.message);
  process.exit(1);
});
