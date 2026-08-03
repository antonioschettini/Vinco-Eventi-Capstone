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

  // Se richiesto poster da un video, genera l'immagine del primo frame in formato JPG comprimibile
  if (type === "poster" && isVideo) {
    const cleanPublicId = publicIdPath.replace(/\.[^/.]+$/, "");
    const posterTransforms = `f_jpg,q_${quality},so_0,w_${width || 720},c_${crop}`;
    const versionPath = version ? `${version}/` : "";
    return `${prefix}${posterTransforms}/${versionPath}${cleanPublicId}.jpg`;
  }

  let transformQuality = quality;
  const transformList = [`f_${format}`];

  if (width) {
    transformList.push(`q_${transformQuality}`, `w_${width}`, `c_${crop}`);
  } else if (type === "carousel") {
    // 720p HD per il carosello "Momenti in Evidenza" in alto (nitidezza e colori superiori)
    if (isVideo) {
      transformList.push("q_auto", "w_720", `c_${crop}`);
    } else {
      transformList.push("q_auto", "w_1200", `c_${crop}`);
    }
  } else if (type === "grid") {
    // 480p per anteprime animate veloci in griglia (download istantaneo in < 100ms)
    if (isVideo) {
      transformList.push("q_auto:eco", "w_480", `c_${crop}`);
    } else {
      transformList.push("q_auto", "w_800", `c_${crop}`);
    }
  } else if (type === "modal") {
    // 720p HD ad avvio istantaneo (< 260ms streaming range request) per il modale video
    if (isVideo) {
      transformList.push("q_auto:eco", "w_720", `c_${crop}`);
    } else {
      transformList.push("q_auto", "w_1600", `c_${crop}`);
    }
  }

  // Converti estensioni legacy .mov in .mp4 per massima compatibilità streaming dei browser con f_auto
  if (isVideo && publicIdPath.endsWith(".mov")) {
    publicIdPath = publicIdPath.replace(/\.mov$/, ".mp4");
  }

  const versionPath = version ? `${version}/` : "";
  return `${prefix}${transformList.join(",")}/${versionPath}${publicIdPath}`;
}
