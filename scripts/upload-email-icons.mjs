import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

cloudinary.config({
  cloud_name: "y9rfpsut",
  api_key: "712925246641983",
  api_secret: "sUsI55biRKpJdV4187_q9Dasp0c",
  secure: true,
});

const imagesDir = "./backend/src/main/resources/static/images";
const files = fs.readdirSync(imagesDir);

console.log("Upload icone email su Cloudinary...");
const urls = {};

for (const file of files) {
  const filePath = path.join(imagesDir, file);
  const publicId = `vinco_email_assets/${path.parse(file).name}`;
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      overwrite: true,
    });
    console.log(`✅ ${file} -> ${res.secure_url}`);
    urls[file] = res.secure_url;
  } catch (err) {
    console.error(`❌ Errore upload ${file}:`, err.message);
  }
}

console.log("\n--- RISULTATO FINALE ---");
console.log(JSON.stringify(urls, null, 2));
