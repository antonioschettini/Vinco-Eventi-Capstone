/**
 * Utility per la trasformazione automatica e ottimizzazione dinamica degli URL Cloudinary
 * (Fast-Start video streaming, f_auto, q_auto:eco, ridimensionamento responsivo e generazione di poster/thumbnail).
 */

export function getOptimizedCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const {
    type = "grid", // 'grid', 'modal', 'poster'
    width,
    quality = "auto",
    format = "auto",
    crop = "limit",
  } = options;

  const uploadToken = "/upload/";
  const uploadIndex = url.indexOf(uploadToken);
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + uploadToken.length);
  const rest = url.substring(uploadIndex + uploadToken.length);
  const isVideo = url.includes("/video/upload/");

  const parts = rest.split("/");
  let version = "";
  let publicIdParts = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // Se il segmento contiene trasformazioni esistenti (es. f_auto,q_auto, w_720), lo ignoriamo per rigenerarle pulite
    if (
      i === 0 &&
      (part.includes(",") ||
        (part.includes("_") &&
          !part.startsWith("v1") &&
          !part.startsWith("v2") &&
          !part.startsWith("vinco_")))
    ) {
      continue;
    }
    if (part.match(/^v\d+$/)) {
      version = part;
    } else {
      publicIdParts.push(part);
    }
  }

  let publicIdPath = publicIdParts.join("/");

  // PER I VIDEO: Non applichiamo trasformazioni URL dinamiche (w_480, w_720, q_auto:eco)
  // al volo per azzerare il consumo di "Video Transformations" su Cloudinary (0 Crediti consumati).
  // I video vengono serviti direttamente dall'URL raw CDN pulito.
  if (isVideo) {
    if (type === "poster") {
      if (options.posterUrl) {
        return getOptimizedCloudinaryUrl(options.posterUrl, { type: "poster" });
      }
      // Se richiesta la copertina/poster su un video senza posterUrl esplicito,
      // estraiamo il frame statico poster in formato immagine (.jpg) con so_0 per non scaricare mai il video mp4 in tag <img>
      const versionPath = version ? `${version}/` : "";
      const imagePath = publicIdPath.replace(/\.(mp4|mov|webm|avi|mkv)$/i, ".jpg");
      return `${prefix}f_auto,q_auto:good,so_0/${versionPath}${imagePath}`;
    }
    const versionPath = version ? `${version}/` : "";
    return `${prefix}${versionPath}${publicIdPath}`;
  }

  // PER LE IMMAGINI: Manteniamo le ottimizzazioni f_auto, q_auto e ridimensionamento responsivo ad alta fedeltà (WebP/AVIF)
  let transformQuality = quality;
  const transformList = [`f_${format}`];

  if (width) {
    transformList.push(`q_${transformQuality}`, `w_${width}`, `c_${crop}`);
  } else if (type === "carousel") {
    transformList.push("q_auto:good", "w_1440", `c_${crop}`);
  } else if (type === "poster") {
    transformList.push("q_auto:good", "w_1280", `c_${crop}`);
  } else if (type === "grid") {
    transformList.push("q_auto", "w_800", `c_${crop}`);
  } else if (type === "modal") {
    transformList.push("q_auto:good", "w_1920", `c_${crop}`);
  }

  const versionPath = version ? `${version}/` : "";
  return `${prefix}${transformList.join(",")}/${versionPath}${publicIdPath}`;
}


