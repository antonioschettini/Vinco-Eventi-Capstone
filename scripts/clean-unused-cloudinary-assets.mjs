/**
 * clean-unused-cloudinary-assets.mjs
 *
 * Script per eliminare da Cloudinary tutti i file duplicati o vecchi
 * non utilizzati dal Database (PostgreSQL).
 *
 * Uso: node scripts/clean-unused-cloudinary-assets.mjs
 */

import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const BACKEND_URL = "http://localhost:8080";

function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return null;
  }
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  let rest = url.substring(uploadIndex + 8);
  const parts = rest.split("/");
  const idParts = [];
  for (const part of parts) {
    if (part.contains?.(",") || (part.includes("_") && !part.startsWith("v1") && !part.startsWith("v2") && !part.startsWith("vinco_"))) {
      continue;
    }
    if (part.match(/^v\d+$/)) {
      continue;
    }
    idParts.push(part);
  }
  const joined = idParts.join("/");
  return joined.replace(/\.[^/.]+$/, "");
}

async function main() {
  console.log("=" .repeat(65));
  console.log("  🧹 Cloudinary Orphan Assets Cleaner - Vinco Eventi");
  console.log("=" .repeat(65) + "\n");

  // 1. Recupera tutti gli URL attivi dal Database
  const activePublicIds = new Set();

  console.log("🔍 Recupero media attivi da DB...");
  const galleryRes = await fetch(`${BACKEND_URL}/api/gallery`);
  if (galleryRes.ok) {
    const galleryItems = await galleryRes.json();
    for (const item of galleryItems) {
      if (item.publicId) activePublicIds.add(item.publicId);
      const pidFromSrc = extractPublicIdFromUrl(item.src);
      if (pidFromSrc) activePublicIds.add(pidFromSrc);
    }
    console.log(`  -> Trovati ${galleryItems.length} elementi in Galleria.`);
  }

  const servicesRes = await fetch(`${BACKEND_URL}/api/services`);
  if (servicesRes.ok) {
    const services = await servicesRes.json();
    for (const s of services) {
      const pidIta = extractPublicIdFromUrl(s.imageUrlIta);
      const pidEng = extractPublicIdFromUrl(s.imageUrlEng);
      if (pidIta) activePublicIds.add(pidIta);
      if (pidEng) activePublicIds.add(pidEng);
    }
    console.log(`  -> Trovati ${services.length} Servizi Offerti.`);
  }

  console.log(`\n📋 Totale Public ID attivi a DB: ${activePublicIds.size}\n`);

  // 2. Recupera tutti i file da Cloudinary
  console.log("☁️ Scansione risorse presenti su Cloudinary...");

  const fetchCloudinaryAssets = async (prefix, resourceType = "image") => {
    let all = [];
    let nextCursor = null;
    do {
      const options = {
        type: "upload",
        prefix,
        resource_type: resourceType,
        max_results: 100,
      };
      if (nextCursor) options.next_cursor = nextCursor;
      const res = await cloudinary.api.resources(options);
      all = all.concat(res.resources || []);
      nextCursor = res.next_cursor;
    } while (nextCursor);
    return all;
  };

  const galleriaImages = await fetchCloudinaryAssets("vinco_eventi_galleria", "image");
  const galleriaVideos = await fetchCloudinaryAssets("vinco_eventi_galleria", "video");
  const serviziImages = await fetchCloudinaryAssets("vinco_eventi_servizi", "image");

  console.log(`  -> Trovati su Cloudinary:`);
  console.log(`     - Foto Galleria: ${galleriaImages.length}`);
  console.log(`     - Video Galleria: ${galleriaVideos.length}`);
  console.log(`     - Foto Servizi: ${serviziImages.length}`);
  console.log(`     - TOTALE ASSET: ${galleriaImages.length + galleriaVideos.length + serviziImages.length}\n`);

  // 3. Trova gli asset orfani (non presenti in activePublicIds)
  const isOrphan = (asset) => !activePublicIds.has(asset.public_id);

  const orphanImages = [...galleriaImages, ...serviziImages].filter(isOrphan);
  const orphanVideos = galleriaVideos.filter(isOrphan);

  console.log(`🗑️ Asset orfani/duplicati da eliminare:`);
  console.log(`  - Immagini orfane: ${orphanImages.length}`);
  console.log(`  - Video orfani: ${orphanVideos.length}`);

  // 4. Elimina gli asset orfani
  if (orphanImages.length > 0) {
    const imageIds = orphanImages.map((a) => a.public_id);
    console.log(`\nCancellazione ${imageIds.length} immagini orfane...`);
    const res = await cloudinary.api.delete_resources(imageIds, { resource_type: "image" });
    console.log(`  ✅ Immagini eliminate:`, Object.keys(res.deleted || {}).length);
  }

  if (orphanVideos.length > 0) {
    const videoIds = orphanVideos.map((a) => a.public_id);
    console.log(`\nCancellazione ${videoIds.length} video orfani...`);
    const res = await cloudinary.api.delete_resources(videoIds, { resource_type: "video" });
    console.log(`  ✅ Video eliminati:`, Object.keys(res.deleted || {}).length);
  }

  // 5. Riepilogo Finale
  console.log("\n" + "=".repeat(65));
  console.log("  🎉 PULIZIA COMPLETATA!");
  console.log("  Ora su Cloudinary ci sono SOLO ed ESCLUSIVAMENTE gli asset attivi.");
  console.log("=" .repeat(65));
}

main().catch((err) => {
  console.error("\n❌ Errore durante la pulizia:", err);
  process.exit(1);
});
