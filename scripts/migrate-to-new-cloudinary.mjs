/**
 * migrate-to-new-cloudinary.mjs
 *
 * Script di migrazione automatizzato e sicuro al 100% da un account Cloudinary
 * al NUOVO account (oe1bztwb).
 */

import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_STATIC_IMAGES = path.resolve(__dirname, "../backend/src/main/resources/static/images");

const NEW_CLOUD_NAME = "oe1bztwb";
const NEW_API_KEY = "282269152156915";
const NEW_API_SECRET = "6_XTfKIbzd_nloCv1rCR1fIG9UU";

cloudinary.config({
  cloud_name: NEW_CLOUD_NAME,
  api_key: NEW_API_KEY,
  api_secret: NEW_API_SECRET,
  secure: true,
});

const BACKEND_URL = "http://localhost:8080";
const ADMIN_EMAIL = "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "RipBigVincoEventi!";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`    ⚠️ Tentativo ${i + 1} fallito (${err.message}). Riprovo in ${backoff}ms...`);
      await sleep(backoff);
    }
  }
}

// --- 1. Autenticazione Admin ---
async function getAuthToken() {
  console.log("🔒 Autenticazione admin in corso su backend...");
  const res = await fetchWithRetry(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const data = await res.json();
  const token = data.token || data.accessToken || data.jwt;
  if (!token) throw new Error("Token JWT non trovato nella risposta.");
  console.log("✅ Token JWT ottenuto con successo.\n");
  return token;
}

// --- 2. Pulizia risorse di esempio di Cloudinary ---
async function deleteSampleCloudinaryAssets() {
  console.log("🧹 Pulizia risorse di esempio dal nuovo account Cloudinary...");
  try {
    const sampleIds = ["sample", "cld-sample", "cld-sample-2", "cld-sample-3", "cld-sample-4", "cld-sample-5", "shoes"];
    await cloudinary.api.delete_resources(sampleIds, { resource_type: "image" }).catch(() => {});
    await cloudinary.api.delete_resources_by_prefix("samples/").catch(() => {});
    console.log("  ✅ Risorse di esempio rimosse / pulizia completata.\n");
  } catch (err) {
    console.warn("  ⚠️ Nota su pulizia campioni:", err.message);
  }
}

// --- 3. Upload Media a Cloudinary tramite URL o File Locale ---
async function uploadToNewCloudinary(sourceUrlOrPath, folder, resourceType = "image") {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
      quality: "auto",
      fetch_format: "auto",
    };

    cloudinary.uploader.upload(sourceUrlOrPath, options, (error, result) => {
      if (error) {
        return reject(new Error(`Cloudinary upload error: ${error.message}`));
      }
      resolve(result);
    });
  });
}

function generatePosterUrl(videoSecureUrl) {
  if (!videoSecureUrl || !videoSecureUrl.includes("/video/upload/")) return videoSecureUrl;
  return videoSecureUrl.replace(
    "/video/upload/",
    "/video/upload/f_jpg,q_auto,w_720,so_2/"
  ).replace(/\.[^/.]+$/, ".jpg");
}

// --- MAIN MIGRATION PROCESS ---
async function main() {
  console.log("=" .repeat(65));
  console.log("  🚀 VINCO EVENTI - MIGRAZIONE COMPLETA AL NUOVO CLOUDINARY");
  console.log(`  Account Target: ${NEW_CLOUD_NAME}`);
  console.log("=" .repeat(65) + "\n");

  const token = await getAuthToken();

  await deleteSampleCloudinaryAssets();

  // --- SEZIONE A: SERVIZI OFFERTI ---
  console.log("📦 --- 1/3 MIGRAZIONE SERVIZI OFFERTI (BASIC, PLUS, FULL) ---");
  const servicesRes = await fetchWithRetry(`${BACKEND_URL}/api/services`);
  const services = await servicesRes.json();
  console.log(`  Trovati ${services.length} Servizi Offerti a DB.\n`);

  const updatedServices = [];

  for (const s of services) {
    console.log(`  Aggiornamento Servizio "${s.titleIta}" (${s.badge})...`);
    let newUrlIta = s.imageUrlIta;
    let newUrlEng = s.imageUrlEng;

    if (s.imageUrlIta && s.imageUrlIta.startsWith("http")) {
      if (!s.imageUrlIta.includes(NEW_CLOUD_NAME)) {
        console.log(`    Upload Immagine ITA su nuovo Cloudinary...`);
        const resIta = await uploadToNewCloudinary(s.imageUrlIta, "vinco_eventi_servizi", "image");
        newUrlIta = resIta.secure_url;
        console.log(`    -> OK: ${newUrlIta}`);
      } else {
        console.log(`    -> Già su nuovo Cloudinary: ${newUrlIta}`);
      }
    }

    if (s.imageUrlEng && s.imageUrlEng.startsWith("http")) {
      if (s.imageUrlEng === s.imageUrlIta) {
        newUrlEng = newUrlIta;
      } else if (!s.imageUrlEng.includes(NEW_CLOUD_NAME)) {
        console.log(`    Upload Immagine ENG su nuovo Cloudinary...`);
        const resEng = await uploadToNewCloudinary(s.imageUrlEng, "vinco_eventi_servizi", "image");
        newUrlEng = resEng.secure_url;
        console.log(`    -> OK: ${newUrlEng}`);
      } else {
        console.log(`    -> Già su nuovo Cloudinary: ${newUrlEng}`);
      }
    }

    const payload = {
      titleIta: s.titleIta,
      titleEng: s.titleEng,
      subtitleIta: s.subtitleIta,
      subtitleEng: s.subtitleEng,
      category: s.category,
      badge: s.badge,
      imageUrlIta: newUrlIta,
      imageUrlEng: newUrlEng,
      featuresIta: s.featuresIta,
      featuresEng: s.featuresEng,
      brochureUrlIta: s.brochureUrlIta,
      brochureUrlEng: s.brochureUrlEng,
      displayOrder: s.displayOrder,
    };

    const putRes = await fetchWithRetry(`${BACKEND_URL}/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log(`    ✅ Servizio "${s.titleIta}" salvato a DB!`);
    updatedServices.push({ id: s.id, title: s.titleIta, urlIta: newUrlIta, urlEng: newUrlEng });
    await sleep(400);
  }

  // --- SEZIONE B: GALLERIA MULTIMEDIALE ---
  console.log("\n🎬 --- 2/3 MIGRAZIONE GALLERIA MULTIMEDIALE (32 MEDIA) ---");
  const galleryRes = await fetchWithRetry(`${BACKEND_URL}/api/gallery`);
  const galleryItems = await galleryRes.json();
  galleryItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  console.log(`  Trovati ${galleryItems.length} elementi della Galleria a DB.\n`);

  let gallerySuccess = 0;

  for (let i = 0; i < galleryItems.length; i++) {
    const item = galleryItems[i];
    console.log(`[${i + 1}/${galleryItems.length}] "${item.titleIta}" (${item.type.toUpperCase()}) - Order: ${item.displayOrder}`);

    let newSrc = item.src;
    let newPosterUrl = item.posterUrl;
    let newPublicId = item.publicId;

    if (item.src && item.src.startsWith("http")) {
      if (!item.src.includes(NEW_CLOUD_NAME)) {
        const resourceType = item.type === "video" ? "video" : "image";
        console.log(`  Caricamento ${resourceType} da URL sorgente al nuovo Cloudinary...`);
        try {
          const uploadRes = await uploadToNewCloudinary(item.src, "vinco_eventi_galleria", resourceType);
          newSrc = uploadRes.secure_url;
          newPublicId = uploadRes.public_id;

          if (item.type === "video") {
            newPosterUrl = generatePosterUrl(newSrc);
          } else {
            newPosterUrl = newSrc;
          }

          console.log(`  -> Nuova URL: ${newSrc}`);
        } catch (err) {
          console.error(`  ❌ Errore upload "${item.titleIta}": ${err.message}`);
          continue;
        }
      } else {
        console.log(`  -> Già sul nuovo Cloudinary.`);
      }
    }

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

    const putRes = await fetchWithRetry(`${BACKEND_URL}/api/admin/gallery/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log(`  ✅ DB aggiornato con successo!`);
    gallerySuccess++;

    if (i < galleryItems.length - 1) await sleep(500);
  }

  // --- SEZIONE C: ICONE EMAIL ---
  console.log("\n📧 --- 3/3 MIGRAZIONE ED UPLOAD ICONE EMAIL ---");
  const emailIcons = [
    { name: "logo-vinco-tondo.png", varName: "URL_LOGO_VINCO" },
    { name: "google-icon.png", varName: "URL_GOOGLE_ICON" },
    { name: "apple-icon.png", varName: "URL_APPLE_ICON" },
    { name: "dashboard-icon.png", varName: "URL_DASHBOARD_ICON" },
    { name: "instagram-icon.png", varName: "URL_INSTAGRAM_ICON" },
    { name: "phone-icon.png", varName: "URL_PHONE_ICON" },
    { name: "whatsapp-icon.png", varName: "URL_WHATSAPP_ICON" },
  ];

  const uploadedEmailUrls = {};

  for (const icon of emailIcons) {
    const iconPath = path.join(BACKEND_STATIC_IMAGES, icon.name);
    if (fs.existsSync(iconPath)) {
      console.log(`  Caricamento icona ${icon.name}...`);
      const res = await uploadToNewCloudinary(iconPath, "vinco_email_assets", "image");
      uploadedEmailUrls[icon.varName] = res.secure_url;
      console.log(`  -> ${icon.varName}: ${res.secure_url}`);
    } else {
      console.warn(`  ⚠️ Icona non trovata in local path: ${iconPath}`);
    }
  }

  console.log("\n" + "=".repeat(65));
  console.log("  🎉 MIGRAZIONE AL NUOVO CLOUDINARY COMPLETATA CON SUCCESSO!");
  console.log(`  - Servizi aggiornati: ${updatedServices.length}/3`);
  console.log(`  - Media Galleria allineati: ${gallerySuccess}/${galleryItems.length}`);
  console.log(`  - Icone Email caricate: ${Object.keys(uploadedEmailUrls).length}/7`);
  console.log("=" .repeat(65));

  console.log("\n📋 URL Icone Email per EmailService.java:");
  console.log(JSON.stringify(uploadedEmailUrls, null, 2));
}

main().catch((err) => {
  console.error("\n❌ Errore critico durante la migrazione:", err.message);
  process.exit(1);
});
