import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

cloudinary.config({
  cloud_name: "fzdamrbc",
  api_key: "872756552472583",
  api_secret: "G4iDrYWiciby7uTGUDPE59ZPOU4",
  secure: true,
});

const tempDir = path.join(rootDir, "temp_official_icons");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// 1. SVG Ufficiale Google "G" 4-colori
const googleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="128" height="128">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>`;

// 2. SVG Ufficiale Apple da Wikipedia (100% Autentico con foglia e morso a destra)
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000" width="128" height="128">
  <path fill="#ffffff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
</svg>`;

// 3. SVG Ufficiale WhatsApp (Baloon + Cornetta autentica in bianco per pulsanti)
const whatsappSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="128" height="128">
  <path fill="#ffffff" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m-3.53 3.03c-.19 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.19 2.05 3.28 5.08 4.47 2.52.99 3.04.79 3.59.74.55-.06 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.68-2.09-.17-.3-.02-.46.13-.61.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.18-.01-.38-.01-.58-.01z"/>
</svg>`;

// 4. SVG Ufficiale Instagram Icon
const instagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="128" height="128">
  <path fill="#E1306C" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
</svg>`;

// 5. SVG Ufficiale Phone Handset
const phoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="128" height="128">
  <path fill="#ffffff" d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.92c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.63 17.02 17.02 17.02.55 0 1-.45 1-1v-3.56c0-.55-.45-1-1.01-1z"/>
</svg>`;

async function uploadAndSync() {
  console.log("Caricamento SVG ufficiali su Cloudinary vinco_email_assets...");

  const googleBase64 = `data:image/svg+xml;base64,${Buffer.from(googleSvg).toString("base64")}`;
  const appleBase64 = `data:image/svg+xml;base64,${Buffer.from(appleSvg).toString("base64")}`;
  const whatsappBase64 = `data:image/svg+xml;base64,${Buffer.from(whatsappSvg).toString("base64")}`;
  const instagramBase64 = `data:image/svg+xml;base64,${Buffer.from(instagramSvg).toString("base64")}`;
  const phoneBase64 = `data:image/svg+xml;base64,${Buffer.from(phoneSvg).toString("base64")}`;

  const googleRes = await cloudinary.uploader.upload(googleBase64, {
    folder: "vinco_email_assets",
    public_id: "google-official-icon",
    format: "png",
    transformation: [{ width: 128, height: 128, crop: "fit" }],
    overwrite: true,
    resource_type: "image",
  });
  console.log("✅ Google Official Icon URL:", googleRes.secure_url);

  const appleRes = await cloudinary.uploader.upload(appleBase64, {
    folder: "vinco_email_assets",
    public_id: "apple-official-icon",
    format: "png",
    transformation: [{ width: 128, height: 128, crop: "fit" }],
    overwrite: true,
    resource_type: "image",
  });
  console.log("✅ Apple Official Icon URL:", appleRes.secure_url);

  const whatsappRes = await cloudinary.uploader.upload(whatsappBase64, {
    folder: "vinco_email_assets",
    public_id: "whatsapp-official-icon",
    format: "png",
    transformation: [{ width: 128, height: 128, crop: "fit" }],
    overwrite: true,
    resource_type: "image",
  });
  console.log("✅ WhatsApp Official Icon URL:", whatsappRes.secure_url);

  const instagramRes = await cloudinary.uploader.upload(instagramBase64, {
    folder: "vinco_email_assets",
    public_id: "instagram-official-icon",
    format: "png",
    transformation: [{ width: 128, height: 128, crop: "fit" }],
    overwrite: true,
    resource_type: "image",
  });
  console.log("✅ Instagram Official Icon URL:", instagramRes.secure_url);

  const phoneRes = await cloudinary.uploader.upload(phoneBase64, {
    folder: "vinco_email_assets",
    public_id: "phone-official-icon",
    format: "png",
    transformation: [{ width: 128, height: 128, crop: "fit" }],
    overwrite: true,
    resource_type: "image",
  });
  console.log("✅ Phone Official Icon URL:", phoneRes.secure_url);

  // Aggiornamento EmailService.java
  const emailServicePath = path.join(rootDir, "backend", "src", "main", "java", "antonioschettini", "backend", "services", "EmailService.java");
  let emailContent = fs.readFileSync(emailServicePath, "utf-8");

  emailContent = emailContent.replace(
    /private static final String URL_GOOGLE_ICON = "[^"]+";/,
    `private static final String URL_GOOGLE_ICON = "${googleRes.secure_url}";`
  );
  emailContent = emailContent.replace(
    /private static final String URL_APPLE_ICON = "[^"]+";/,
    `private static final String URL_APPLE_ICON = "${appleRes.secure_url}";`
  );
  emailContent = emailContent.replace(
    /private static final String URL_WHATSAPP_ICON = "[^"]+";/,
    `private static final String URL_WHATSAPP_ICON = "${whatsappRes.secure_url}";`
  );
  emailContent = emailContent.replace(
    /private static final String URL_INSTAGRAM_ICON = "[^"]+";/,
    `private static final String URL_INSTAGRAM_ICON = "${instagramRes.secure_url}";`
  );
  emailContent = emailContent.replace(
    /private static final String URL_PHONE_ICON = "[^"]+";/,
    `private static final String URL_PHONE_ICON = "${phoneRes.secure_url}";`
  );

  fs.writeFileSync(emailServicePath, emailContent, "utf-8");
  console.log("✅ Tutte le costanti icone aggiornate in EmailService.java!");
}

uploadAndSync().catch(console.error);
