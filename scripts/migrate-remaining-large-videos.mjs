/**
 * migrate-remaining-large-videos.mjs
 *
 * Scarica in locale temporaneamente i 5 video rimanenti (>100MB)
 * ed effettua l'upload chunked (upload_large) su Cloudinary (oe1bztwb),
 * aggiornando poi il DB PostgreSQL locale/live.
 */

import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import os from "os";

const NEW_CLOUD_NAME = process.env.CLOUDINARY_NAME;
const NEW_API_KEY = process.env.CLOUDINARY_API_KEY;
const NEW_API_SECRET = process.env.CLOUDINARY_SECRET;

cloudinary.config({
  cloud_name: NEW_CLOUD_NAME,
  api_key: NEW_API_KEY,
  api_secret: NEW_API_SECRET,
  secure: true,
});

const BACKEND_URL = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getAuthToken() {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error("Login admin fallito.");
  const data = await res.json();
  return data.token || data.accessToken || data.jwt;
}

async function downloadFile(url, destPath) {
  console.log(`    Scaricamento da ${url.substring(0, 70)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download fallito (${res.status})`);
  const fileStream = fs.createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
  const sizeMB = fs.statSync(destPath).size / (1024 * 1024);
  console.log(`    -> Scaricato in locale: ${sizeMB.toFixed(1)} MB`);
}

async function uploadLargeVideo(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`    Upload chunked (upload_large) su Cloudinary...`);
    cloudinary.uploader.upload_large(
      filePath,
      {
        folder: "vinco_eventi_galleria",
        resource_type: "video",
        chunk_size: 6000000, // 6MB chunk size
      },
      (error, result) => {
        if (error) return reject(new Error(error.message));
        resolve(result);
      }
    );
  });
}

function generatePosterUrl(videoSecureUrl) {
  if (!videoSecureUrl || !videoSecureUrl.includes("/video/upload/")) return videoSecureUrl;
  return videoSecureUrl.replace(
    "/video/upload/",
    "/video/upload/f_jpg,q_auto,w_720,so_2/"
  ).replace(/\.[^/.]+$/, ".jpg");
}

async function main() {
  console.log("=" .repeat(65));
  console.log("  🚀 UPLOAD CHUNKED PER I 5 VIDEO GRANDI RIMANENTI");
  console.log("=" .repeat(65) + "\n");

  const token = await getAuthToken();
  const galleryRes = await fetch(`${BACKEND_URL}/api/gallery`);
  const items = await galleryRes.json();

  const remaining = items.filter((i) => i.src && i.src.includes("ytjdxerb"));
  console.log(`Trovati ${remaining.length} video grandi rimanenti da migrare.\n`);

  const tempDir = os.tmpdir();

  for (let i = 0; i < remaining.length; i++) {
    const item = remaining[i];
    console.log(`[${i + 1}/${remaining.length}] "${item.titleIta}" (Order: ${item.displayOrder})`);
    
    const ext = item.src.endsWith(".mp4") ? ".mp4" : ".mov";
    const tempFilePath = path.join(tempDir, `vinco_migration_temp_${i}${ext}`);

    try {
      await downloadFile(item.src, tempFilePath);
      const uploadRes = await uploadLargeVideo(tempFilePath);
      const newSrc = uploadRes.secure_url;
      const newPublicId = uploadRes.public_id;
      const newPosterUrl = generatePosterUrl(newSrc);

      console.log(`    -> Nuova URL Cloudinary: ${newSrc}`);

      const payload = {
        titleIta: item.titleIta,
        titleEng: item.titleEng,
        subtitleIta: item.subtitleIta,
        subtitleEng: item.subtitleEng,
        type: item.type,
        src: newSrc,
        category: item.category,
        featured: item.featured,
        startTime: item.startTime,
        displayOrder: item.displayOrder,
        publicId: newPublicId,
        posterUrl: newPosterUrl,
      };

      const putRes = await fetch(`${BACKEND_URL}/api/admin/gallery/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (putRes.ok) {
        console.log(`    ✅ DB aggiornato con successo!\n`);
      } else {
        console.error(`    ❌ Errore aggiornamento DB: ${await putRes.text()}\n`);
      }
    } catch (err) {
      console.error(`    ❌ ERRORE: ${err.message}\n`);
    } finally {
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch {}
      }
    }

    await sleep(500);
  }

  console.log("=" .repeat(65));
  console.log("  🎉 MIGRAZIONE VIDEO GRANDI COMPLETATA!");
  console.log("=" .repeat(65));
}

main().catch((err) => {
  console.error("Errore critico:", err.message);
  process.exit(1);
});
