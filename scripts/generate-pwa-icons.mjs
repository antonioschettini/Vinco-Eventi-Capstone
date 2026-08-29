import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const LOGO_PATH = path.resolve(ROOT_DIR, "frontend/src/assets/Vinco Eventi assets/assets loghi/Logo vinco eventi off.png");
const PUBLIC_DIR = path.resolve(ROOT_DIR, "frontend/public");

const CLOUD_NAME = "fzdamrbc";
const API_KEY = "872756552472583";
const API_SECRET = "G4iDrYWiciby7uTGUDPE59ZPOU4";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

async function main() {
  console.log("📤 Upload logo a fondo nero su Cloudinary per resize...");
  const uploadRes = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      LOGO_PATH,
      {
        folder: "vinco_eventi_pwa",
        public_id: "vinco_app_icon_full",
        overwrite: true,
      },
      (err, res) => (err ? reject(err) : resolve(res))
    );
  });

  console.log("✅ Upload completato:", uploadRes.secure_url);

  const targets = [
    {
      fileName: "android-chrome-512x512.png",
      url: cloudinary.url(uploadRes.public_id, {
        width: 512,
        height: 512,
        crop: "fill",
        background: "#000000",
        format: "png",
        secure: true,
      }),
    },
    {
      fileName: "maskable-icon-512x512.png",
      url: cloudinary.url(uploadRes.public_id, {
        width: 512,
        height: 512,
        crop: "fill",
        background: "#000000",
        format: "png",
        secure: true,
      }),
    },
    {
      fileName: "android-chrome-192x192.png",
      url: cloudinary.url(uploadRes.public_id, {
        width: 192,
        height: 192,
        crop: "fill",
        background: "#000000",
        format: "png",
        secure: true,
      }),
    },
    {
      fileName: "maskable-icon-192x192.png",
      url: cloudinary.url(uploadRes.public_id, {
        width: 192,
        height: 192,
        crop: "fill",
        background: "#000000",
        format: "png",
        secure: true,
      }),
    },
    {
      fileName: "apple-touch-icon.png",
      url: cloudinary.url(uploadRes.public_id, {
        width: 180,
        height: 180,
        crop: "fill",
        background: "#000000",
        format: "png",
        secure: true,
      }),
    },
  ];

  for (const target of targets) {
    console.log(`⬇️ Scaricamento ${target.fileName}... (${target.url})`);
    const res = await fetch(target.url);
    if (!res.ok) throw new Error(`Errore download ${target.fileName}: ${res.status}`);
    const buffer = await res.buffer();
    const destPath = path.join(PUBLIC_DIR, target.fileName);
    fs.writeFileSync(destPath, buffer);
    console.log(`  ✅ Salvato in: ${destPath} (${buffer.length} bytes)`);
  }

  console.log("\n🎉 Tutte le icone PWA sono state generate a piena icona a fondo nero!");
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
