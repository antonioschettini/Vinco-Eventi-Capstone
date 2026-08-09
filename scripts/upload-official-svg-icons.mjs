import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "oe1bztwb",
  api_key: "282269152156915",
  api_secret: "6_XTfKIbzd_nloCv1rCR1fIG9UU",
  secure: true,
});

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="#ffffff"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1 .04-2.19.67-2.88 1.47-.62.72-1.16 1.89-.99 3.01 1.11.09 2.22-.54 2.88-1.36z"/></svg>`;

const googleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="96" height="96"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.60l6.9-6.9C35.9 2.38 30.47 0 24 0 14.66 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.42 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59C9.97 26.91 9.97 25.09 10.53 23.41l-7.98-6.19C1.01 19.83 0 21.85 0 24c0 2 .15 4.17.75 6.18l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.4 0-11.57-3.92-13.47-9.31l-7.98 6.19C6.51 42.62 14.66 48 24 48z"/></svg>`;

async function run() {
  console.log("Upload icone vettoriali ufficiali su Cloudinary...");

  const appleDataUri = `data:image/svg+xml;base64,${Buffer.from(appleSvg).toString("base64")}`;
  const resApple = await cloudinary.uploader.upload(appleDataUri, {
    public_id: "vinco_email_assets/apple-official-v2",
    overwrite: true,
    resource_type: "image",
  });
  console.log("✅ Apple Official URL:", resApple.secure_url);

  const googleDataUri = `data:image/svg+xml;base64,${Buffer.from(googleSvg).toString("base64")}`;
  const resGoogle = await cloudinary.uploader.upload(googleDataUri, {
    public_id: "vinco_email_assets/google-official-v2",
    overwrite: true,
    resource_type: "image",
  });
  console.log("✅ Google Official URL:", resGoogle.secure_url);
}

run().catch(console.error);
