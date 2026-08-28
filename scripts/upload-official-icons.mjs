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

// 2. SVG Ufficiale Apple classico silhouette monocromatico
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 170" width="128" height="128">
  <path fill="#FFFFFF" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.71-14.02-6.19-9.55-11.05-20.45-14.57-32.69-3.52-12.24-5.28-23.75-5.28-34.54 0-14.32 3.65-26.25 10.95-35.8 7.3-9.55 16.59-14.41 27.87-14.59 4.35 0 9.44 1.13 15.28 3.38 5.84 2.25 9.77 3.42 11.79 3.51 1.62-.1 5.69-1.32 12.2-3.66 6.52-2.34 11.96-3.38 16.32-3.12 12.7.74 22.84 5.37 30.42 13.88-11.07 6.74-16.48 16.09-16.23 28.05.25 9.45 3.84 17.37 10.77 23.76 6.93 6.39 15.24 10.05 24.94 10.99-2.22 6.64-4.99 13.2-8.32 19.69zM119.22 31.84c0-7.05 2.58-13.75 7.74-20.09 5.16-6.34 11.55-10.29 19.16-11.75.98 6.94-.8 13.62-5.34 20.03-4.54 6.41-11.09 10.42-19.64 12.03-.23-.07-.75-.14-1.54-.22h-.38z"/>
</svg>`;

async function uploadAndSync() {
  console.log("Caricamento SVG ufficiali su Cloudinary vinco_email_assets...");

  const googleBase64 = `data:image/svg+xml;base64,${Buffer.from(googleSvg).toString("base64")}`;
  const appleBase64 = `data:image/svg+xml;base64,${Buffer.from(appleSvg).toString("base64")}`;

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

  fs.writeFileSync(emailServicePath, emailContent, "utf-8");
  console.log("✅ Costanti aggiornate in EmailService.java!");
}

uploadAndSync().catch(console.error);
