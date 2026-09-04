import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const IMAGES_DIR = path.resolve(ROOT_DIR, "frontend/src/assets/Vinco Eventi assets/assets immagini");

const CLOUD_NAME = process.env.CLOUDINARY_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_SECRET;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

const LIVE_URL = process.env.LIVE_BACKEND_URL || "https://vinco-eventi-backend.onrender.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const NEW_MEDIA = [
  {
    fileName: "consolle dj.webp",
    titleIta: "Consolle DJ & Atmosfera Notturna",
    titleEng: "DJ Booth & Night Party Atmosphere",
    subtitleIta: "Controllo totale del dancefloor e vibrazioni esclusive per la notte.",
    subtitleEng: "Total dancefloor control and exclusive party vibes under the stars.",
    category: "djset",
    type: "image",
    featured: false,
    displayOrder: 41,
  },
  {
    fileName: "djset coccaro white party.webp",
    titleIta: "White Party & Live Sax Performance",
    titleEng: "Exclusive White Party & Live Sax",
    subtitleIta: "DJ set esplosivo e sax luminoso a bordo piscina per un party da sogno.",
    subtitleEng: "Explosive DJ set paired with illuminated live sax for a dream party experience.",
    category: "djset",
    type: "image",
    featured: false,
    displayOrder: 42,
  },
  {
    fileName: "djset di spalle.webp",
    titleIta: "Clubbing Experience & Dancefloor Vibes",
    titleEng: "Clubbing Experience & Dancefloor Vibes",
    subtitleIta: "Scenografia luci dinamiche e dancefloor scatenato con VINCO EVENTI.",
    subtitleEng: "Dynamic light design and non-stop dancing curated by VINCO EVENTI.",
    category: "djset",
    type: "image",
    featured: false,
    displayOrder: 43,
  },
];

async function getAdminToken() {
  console.log("🔒 Autenticazione admin su Render...");
  const res = await fetch(`${LIVE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login fallito (${res.status}): ${text}`);
  }
  const data = await res.json();
  const token = data.token || data.accessToken || data.jwt;
  console.log("✅ Token admin ottenuto con successo.\n");
  return token;
}

async function uploadToCloudinary(filePath, customPublicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: "vinco_eventi_galleria",
        public_id: customPublicId,
        resource_type: "image",
        overwrite: true,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

async function main() {
  console.log("🚀 Inizio upload 3 immagini su Cloudinary...");
  const uploadedItems = [];

  for (const item of NEW_MEDIA) {
    const filePath = path.join(IMAGES_DIR, item.fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File non trovato: ${filePath}`);
    }

    const baseName = path.basename(item.fileName, path.extname(item.fileName)).replace(/\s+/g, "_");
    console.log(`📤 Caricamento "${item.fileName}" -> Cloudinary ID: ${baseName}...`);

    const result = await uploadToCloudinary(filePath, baseName);
    console.log(`  ✅ URL: ${result.secure_url}`);

    uploadedItems.push({
      ...item,
      src: result.secure_url,
      posterUrl: result.secure_url,
      publicId: result.public_id,
    });
  }

  const token = await getAdminToken();

  // Verifica elementi esistenti a DB
  const galleryRes = await fetch(`${LIVE_URL}/api/gallery`);
  const existingGallery = await galleryRes.json();
  console.log(`Trovati ${existingGallery.length} elementi esistenti su Neon DB.`);

  for (const item of uploadedItems) {
    const existing = existingGallery.find(
      (e) => e.displayOrder === item.displayOrder || e.titleIta === item.titleIta
    );

    const payload = {
      titleIta: item.titleIta,
      titleEng: item.titleEng,
      subtitleIta: item.subtitleIta,
      subtitleEng: item.subtitleEng,
      category: item.category,
      type: item.type,
      featured: item.featured,
      src: item.src,
      posterUrl: item.posterUrl,
      publicId: item.publicId,
      startTime: null,
      displayOrder: item.displayOrder,
    };

    if (existing) {
      console.log(`🔄 Aggiornamento elemento ID: ${existing.id} (${item.titleIta})...`);
      const updateRes = await fetch(`${LIVE_URL}/api/admin/gallery/${existing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!updateRes.ok) {
        console.error(`❌ Errore update: ${await updateRes.text()}`);
      } else {
        console.log(`  ✅ Elemento aggiornato a DB!`);
      }
    } else {
      console.log(`➕ Creazione nuovo elemento (${item.titleIta})...`);
      const createRes = await fetch(`${LIVE_URL}/api/admin/gallery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        console.error(`❌ Errore creazione: ${await createRes.text()}`);
      } else {
        const created = await createRes.json();
        console.log(`  ✅ Elemento creato con ID: ${created.id}!`);
      }
    }
  }

  console.log("\n✨ Dettagli per galleryData.js:");
  console.log(JSON.stringify(uploadedItems, null, 2));
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
