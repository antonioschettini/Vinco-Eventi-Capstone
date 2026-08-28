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

// 3. SVG Ufficiale WhatsApp (Wikipedia Originale con Sfumatura Verde, Cerchio e Cornetta)
const whatsappSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175.216 175.552" width="128" height="128">
  <defs>
    <linearGradient id="b" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#57d163"/>
      <stop offset="1" stop-color="#23b33a"/>
    </linearGradient>
  </defs>
  <path fill="#ffffff" d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"/>
  <path fill="url(#b)" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"/>
  <path fill="#ffffff" fill-rule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
</svg>`;

// 4. SVG Ufficiale Instagram con Sfumatura Radiale Originale
const instagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="128" height="128">
  <defs>
    <radialGradient id="rg" cx="0.15" cy="1" r="1.15">
      <stop offset="0%" stop-color="#FFD600"/>
      <stop offset="15%" stop-color="#FF7A00"/>
      <stop offset="50%" stop-color="#FF0069"/>
      <stop offset="75%" stop-color="#D300C5"/>
      <stop offset="100%" stop-color="#7638FA"/>
    </radialGradient>
  </defs>
  <rect width="256" height="256" rx="58" fill="url(#rg)"/>
  <rect x="38" y="38" width="180" height="180" rx="48" fill="none" stroke="#ffffff" stroke-width="18"/>
  <circle cx="128" cy="128" r="44" fill="none" stroke="#ffffff" stroke-width="18"/>
  <circle cx="176" cy="80" r="11" fill="#ffffff"/>
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
