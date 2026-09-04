/**
 * compress-and-upload.mjs
 *
 * Comprime i 2 video grandi (>100MB) con ffmpeg a ~80MB,
 * poi li carica su Cloudinary direttamente e aggiorna il DB.
 *
 * Usa: node scripts/compress-and-upload.mjs
 */

import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import os from "os";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const ffmpeg = require("fluent-ffmpeg");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = path.resolve(__dirname, "../frontend/src");
const BACKEND_URL = "http://localhost:8080";
const ADMIN_EMAIL = "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Usa ffmpeg bundled da npm
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

async function getAuthToken() {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login fallito: ${res.status}`);
  const data = await res.json();
  const token = data.token || data.accessToken || data.jwt;
  if (!token) throw new Error("Token non trovato");
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

/**
 * Comprime il video con ffmpeg a un bitrate target che porta il file < 90MB.
 * Usa H.264 + AAC con CRF 28 e scala a 720p max.
 */
function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const fileSizeMB = fs.statSync(inputPath).size / (1024 * 1024);
    console.log(`  Dimensione originale: ${fileSizeMB.toFixed(1)} MB`);
    console.log(`  Compressione con ffmpeg in corso (può richiedere qualche minuto)...`);

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-crf 28",           // qualità (18=alta, 28=buona, 35=bassa)
        "-preset fast",
        "-vf scale=-2:720",  // downscale a 720p max
        "-c:a aac",
        "-b:a 128k",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("progress", (p) => {
        if (p.percent != null) {
          process.stdout.write(`\r  Progresso: ${Math.round(p.percent)}%    `);
        }
      })
      .on("end", () => {
        console.log(); // nuova riga dopo il progresso
        const outSizeMB = fs.statSync(outputPath).size / (1024 * 1024);
        console.log(`  Compressione completata: ${outSizeMB.toFixed(1)} MB`);
        resolve(outputPath);
      })
      .on("error", (err) => reject(new Error(`FFmpeg errore: ${err.message}`)))
      .run();
  });
}

async function uploadDirect(localFilePath) {
  return new Promise((resolve, reject) => {
    console.log(`  Upload su Cloudinary...`);
    cloudinary.uploader.upload(
      localFilePath,
      {
        folder: "vinco_eventi_galleria",
        resource_type: "video",
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
  console.log("  Comprimi & Carica Video Grandi - Vinco Eventi");
  console.log("=".repeat(60) + "\n");

  const token = await getAuthToken();
  console.log("Token JWT ottenuto.\n");

  const items = await fetchGalleryItems();
  const toProcess = items.filter((i) => i.src && !i.src.startsWith("http"));

  console.log(`Item da processare: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("Tutti i media sono gia su Cloudinary!");
    return;
  }

  const tempDir = os.tmpdir();
  const results = { success: [], failed: [] };

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i];
    const localPath = resolveLocalPath(item.src);
    const shortName = path.basename(localPath);
    const ext = path.extname(shortName) || ".mp4";
    const tempOutput = path.join(tempDir, `vinco_compressed_${i}${ext}`);

    console.log(`[${i + 1}/${toProcess.length}] "${item.titleIta}"`);
    console.log(`  File originale: ${shortName}`);

    try {
      // Step 1: Comprimi il video
      await compressVideo(localPath, tempOutput);

      // Step 2: Carica su Cloudinary il file compresso
      const cloudinaryUrl = await uploadDirect(tempOutput);
      console.log(`  URL Cloudinary: ${cloudinaryUrl.substring(0, 80)}`);

      // Step 3: Aggiorna il DB
      await updateGalleryItemSrc(item, cloudinaryUrl, token);
      console.log(`  DB aggiornato!\n`);

      results.success.push({ title: item.titleIta, url: cloudinaryUrl });
    } catch (err) {
      console.error(`  ERRORE: ${err.message}\n`);
      results.failed.push({ title: item.titleIta, error: err.message });
    } finally {
      // Pulizia file temporaneo
      if (fs.existsSync(tempOutput)) {
        fs.unlinkSync(tempOutput);
      }
    }
  }

  console.log("=".repeat(60));
  console.log("  REPORT FINALE");
  console.log("=".repeat(60));
  console.log(`Caricati con successo: ${results.success.length}/${toProcess.length}`);

  if (results.failed.length > 0) {
    console.log(`\nFalliti (${results.failed.length}):`);
    results.failed.forEach((f) => console.log(`  - "${f.title}": ${f.error}`));
  } else {
    console.log("\nTutti i video sono ora su Cloudinary!");
    console.log("Puoi svuotare assets/galleria/ e assets/nuove Foto VIdeo/");
  }
}

main().catch((err) => {
  console.error("Errore critico:", err.message);
  process.exit(1);
});
