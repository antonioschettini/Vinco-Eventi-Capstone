/**
 * upload-gallery-to-cloudinary.mjs
 *
 * Script automatizzato batch per Vinco Eventi:
 * 1. Upload e aggiornamento delle immagini dei 3 Servizi Offerti (BASIC, PLUS, FULL) da serviziOfferti/
 * 2. Upload e aggiornamento dei 31 media della Galleria da riUploadCloudinary/
 *
 * Uso: node scripts/upload-gallery-to-cloudinary.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import FormData from "form-data";
import fetch from "node-fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = path.resolve(__dirname, "../frontend/src");
const RI_UPLOAD_DIR = path.join(FRONTEND_SRC, "assets/riUploadCloudinary");
const SERVIZI_DIR = path.join(FRONTEND_SRC, "assets/serviziOfferti");

const BACKEND_URL = "http://localhost:8080";
const ADMIN_EMAIL = "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Mappa esatta dei 31 media in ordine di displayOrder / galleria
const GALLERY_FILE_MAP = [
  "vaz9o4beyovfhcr5triw.mov", // 1. Set ELETTRICO
  "vbybme8q65ywkaisvhfo.mov", // 2. Crossroads Live
  "kz0w0hx5a8lhts8czb6l.mp4", // 3. DJ Set Exclusive Live
  "bkimedchkfe02pqhm5xi.jpg", // 4. Console DJ Set
  "gdj0cjbkmoakcpipxhmq.mov", // 5. Exclusive Night Party
  "un507woyugpftspgjajb.mp4", // 6. Live Band Night Performance
  "cywyjakbmcqh73tamzhg.webp",// 7. Esibizione Vocalist
  "mulpxihugmquppcreyp5.mp4", // 8. Luci LED & Console Show
  "tyz1zx989veguuhhfvdq.mov", // 9. Live Energy & Dj Set
  "e3chehntj5aesbx8gvpz.jpg", // 10. Illuminazione Cielo Stellato
  "wnqshvydnagmut5a4bw1.mov", // 11. Wedding Party Highlights
  "qfqfjc1lalwtrgnuwj0r.mp4", // 12. Party & Clubbing Vibe
  "vxjn1vwb9lvq4cljidu3.jpg", // 13. Il Primo Bacio degli Sposi
  "h6lvl6whetifsprevnn0.mov", // 14. Live Vibes & Social Reel
  "e5cd0uz0698qnnwnmgqs.mp4", // 15. Live Acoustics Aperitivo
  "hlxlk2jz64hd7pbq4u5k.mov", // 16. Atmosphere & Lights
  "uye6veyu60euff4oyynj.jpg", // 17. Brindisi & Taglio Torta
  "vunxsnh0lc2jkqdxuop9.mp4", // 18. Fumogeni & Effetti Scenografici
  "m86cnpmuhvavvo6u4ccd.mov", // 19. Festeggiamenti in Musica
  "nzf2avveppyfgavf5dlb.jpg", // 20. Fumogeni Colorati Sposi
  "yuhpya4xt3ipx3znwyl0.mp4", // 21. DJ Set & Live Mix
  "y2e73pox3aetvywkyfre.mov", // 22. Live Show Console
  "lemqus6xy5uc4z1uqstr.jpg", // 23. Band Live Aperitivo
  "deljvnzddlc8arskk15z.mov", // 24. DJ Set Moment
  "tacxrqeuinco1mfvsemr.mp4", // 25. Live Show Finale
  "lf8rkdrcvgu2fjl2glo3.mov", // 26. Show dal Vivo
  "mufw0vb5wyjfm72yzpop.jpg", // 27. Cocktail & Sax Vibe
  "o0n56p2rf3rfe0kexuvi.mov", // 28. Live Session Highlight
  "r8jfbr4d6lydp2d9eug2.png", // 29. I Nostri Musicisti
  "si66dzezw5mvdellz50x.mov", // 30. Live Sound Experience
  "jpztopltw1bmxyoovmyt.webp",// 31. Accoglienza Ospiti in Musica
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- 1. Autenticazione Admin ---
async function getAuthToken() {
  console.log("🔒 Autenticazione admin in corso...");
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
  if (!token) throw new Error("Token JWT non trovato nella risposta.");
  console.log("✅ Token JWT ottenuto con successo.\n");
  return token;
}

// --- 2. Upload Media Galleria ---
async function uploadGalleryMedia(localFilePath, token) {
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
    throw new Error(`Upload Galleria fallito (${res.status}): ${body}`);
  }

  return await res.json();
}

// --- 3. Upload Immagine Servizio ---
async function uploadServiceImage(localFilePath, token) {
  const form = new FormData();
  form.append("file", fs.createReadStream(localFilePath));

  const res = await fetch(`${BACKEND_URL}/api/admin/services/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload Servizio fallito (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.url;
}

// --- MAIN ---
async function main() {
  console.log("=" .repeat(65));
  console.log("  🚀 Vinco Eventi - Cloudinary Migration & Batch Uploader");
  console.log("=" .repeat(65) + "\n");

  const token = await getAuthToken();

  // --- SEZIONE 1: SERVIZI OFFERTI ---
  console.log("📦 --- PROCESSAMENTO SERVIZI OFFERTI (BASIC, PLUS, FULL) ---");
  const servicesRes = await fetch(`${BACKEND_URL}/api/services`);
  if (servicesRes.ok) {
    const services = await servicesRes.json();
    console.log(`Trovati ${services.length} servizi a database.`);

    for (const s of services) {
      console.log(`\nAggiornamento Servizio: "${s.titleIta}" (${s.badge})`);
      const badgeLower = (s.badge || s.titleIta).toLowerCase();
      const itaPath = path.join(SERVIZI_DIR, `${badgeLower}Ita.png`);
      const engPath = path.join(SERVIZI_DIR, `${badgeLower}Eng.png`);

      let newUrlIta = s.imageUrlIta;
      let newUrlEng = s.imageUrlEng;

      if (fs.existsSync(itaPath)) {
        console.log(`  Caricamento ${path.basename(itaPath)}...`);
        newUrlIta = await uploadServiceImage(itaPath, token);
        console.log(`  -> URL Ita: ${newUrlIta}`);
      } else {
        console.warn(`  ⚠️ File non trovato: ${itaPath}`);
      }

      if (fs.existsSync(engPath)) {
        console.log(`  Caricamento ${path.basename(engPath)}...`);
        newUrlEng = await uploadServiceImage(engPath, token);
        console.log(`  -> URL Eng: ${newUrlEng}`);
      } else {
        console.warn(`  ⚠️ File non trovato: ${engPath}`);
      }

      const updatePayload = {
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

      const putRes = await fetch(`${BACKEND_URL}/api/admin/services/${s.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (putRes.ok) {
        console.log(`  ✅ Servizio "${s.titleIta}" aggiornato con successo a DB!`);
      } else {
        console.error(`  ❌ Errore aggiornamento servizio: ${await putRes.text()}`);
      }
      await sleep(300);
    }
  } else {
    console.error("❌ Impossibile recuperare i servizi dal backend.");
  }

  // --- SEZIONE 2: GALLERIA ---
  console.log("\n🎬 --- PROCESSAMENTO GALLERIA MULTIMEDIALE ---");
  const galleryRes = await fetch(`${BACKEND_URL}/api/gallery`);
  if (!galleryRes.ok) {
    throw new Error(`Errore recupero galleria: ${galleryRes.status}`);
  }

  const items = await galleryRes.json();
  // Ordina gli elementi del DB per displayOrder
  items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  console.log(`Trovati ${items.length} elementi della galleria a DB.\n`);

  let successCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] "${item.titleIta}" (${item.type}) - Order: ${item.displayOrder}`);

    // Cerca il file locale tramite la mappa GALLERY_FILE_MAP o per nome
    const mappedFileName = GALLERY_FILE_MAP[i] || "";
    let localFilePath = path.join(RI_UPLOAD_DIR, mappedFileName);

    if (!fs.existsSync(localFilePath)) {
      // Fallback: cerca nel dir se l'estensione differisce
      const baseNoExt = mappedFileName.substring(0, mappedFileName.lastIndexOf("."));
      const foundInDir = fs.readdirSync(RI_UPLOAD_DIR).find((f) => f.startsWith(baseNoExt));
      if (foundInDir) {
        localFilePath = path.join(RI_UPLOAD_DIR, foundInDir);
      }
    }

    if (!fs.existsSync(localFilePath)) {
      console.warn(`  ⚠️ File locale non trovato per "${item.titleIta}" (Mappato: ${mappedFileName}). Salto...`);
      continue;
    }

    try {
      console.log(`  Caricamento ${path.basename(localFilePath)} su Cloudinary...`);
      const uploadResult = await uploadGalleryMedia(localFilePath, token);

      const updatePayload = {
        titleIta: item.titleIta,
        titleEng: item.titleEng,
        subtitleIta: item.subtitleIta,
        subtitleEng: item.subtitleEng,
        type: item.type,
        src: uploadResult.url,
        category: item.category,
        featured: item.featured,
        startTime: item.startTime,
        displayOrder: item.displayOrder,
        publicId: uploadResult.publicId || item.publicId,
        posterUrl: uploadResult.posterUrl || uploadResult.url,
      };

      const putRes = await fetch(`${BACKEND_URL}/api/admin/gallery/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (putRes.ok) {
        console.log(`  ✅ OK! Nuova URL: ${uploadResult.url}`);
        successCount++;
      } else {
        console.error(`  ❌ Errore aggiornamento DB per "${item.titleIta}": ${await putRes.text()}`);
      }
    } catch (err) {
      console.error(`  ❌ Errore durante l'upload: ${err.message}`);
    }

    if (i < items.length - 1) await sleep(400);
  }

  console.log("\n" + "=".repeat(65));
  console.log(`  🎉 RIPRISTINO E MIGRAZIONE COMPLETATA!`);
  console.log(`  - Servizi aggiornati con immagini Cloudinary ottimizzate.`);
  console.log(`  - Galleria: ${successCount}/${items.length} media re-importati su Cloudinary.`);
  console.log("=" .repeat(65));
}

main().catch((err) => {
  console.error("\n❌ Errore critico nel processo di upload:", err.message);
  process.exit(1);
});
