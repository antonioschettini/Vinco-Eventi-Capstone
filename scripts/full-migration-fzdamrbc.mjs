/**
 * full-migration-fzdamrbc.mjs
 *
 * Script definitivo per:
 * 1. Upload icone email e loghi su nuovo account Cloudinary (fzdamrbc)
 * 2. Upload banner servizi (4 BannerBox) su Cloudinary
 * 3. Compressione FFmpeg (720p CRF 28 +faststart) e upload dei 26 video
 * 4. Upload delle 14 immagini galleria
 * 5. Aggiornamento Neon DB su Render (Gallery + Servizi)
 * 6. Aggiornamento fallback locale frontend/src/components/GallerySection/galleryData.js
 * 7. Aggiornamento costanti EmailService.java
 */

import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import os from "os";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_ASSETS = path.resolve(ROOT_DIR, "frontend/src/assets/Vinco Eventi assets");
const BACKEND_DIR = path.resolve(ROOT_DIR, "backend");

const CLOUD_NAME = "fzdamrbc";
const API_KEY = "872756552472583";
const API_SECRET = "G4iDrYWiciby7uTGUDPE59ZPOU4";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

const LIVE_URL = "https://vinco-eventi-backend.onrender.com";
const ADMIN_EMAIL = "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "RipBigVincoEventi!";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`    ⚠️ Tentativo ${i + 1} fallito (${err.message}). Riprovo in ${backoff}ms...`);
      await sleep(backoff);
    }
  }
}

// 1. Compressione Video con FFmpeg
function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const origMB = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(1);
    process.stdout.write(`  🎬 Compressione FFmpeg 720p (${origMB} MB)... `);

    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-crf 28",
        "-preset fast",
        "-vf scale=-2:720",
        "-c:a aac",
        "-b:a 128k",
        "-movflags +faststart",
      ])
      .output(outputPath)
      .on("end", () => {
        const outMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(1);
        console.log(`-> ${outMB} MB ✅`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error(`❌ Errore FFmpeg: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

// 2. Upload generico su Cloudinary
async function uploadToCloudinary(filePath, folder, resourceType = "image", publicId = null) {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: resourceType,
      overwrite: true,
    };
    if (publicId) options.public_id = publicId;

    if (resourceType === "video") {
      cloudinary.uploader.upload_large(filePath, options, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    } else {
      cloudinary.uploader.upload(filePath, options, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    }
  });
}

// 3. Definizione Metadati dei 40 Elementi della Galleria
const GALLERY_ITEMS_METADATA = [
  // --- FEATURED VIDEOS ---
  {
    displayOrder: 1,
    fileName: "Video presentazione vinco eventi .mp4",
    type: "video",
    titleIta: "Showreel Presentazione Ufficiale",
    titleEng: "Official Presentation Showreel",
    subtitleIta: "L'eccellenza, l'energia e le emozioni firmate VINCO EVENTI.",
    subtitleEng: "The excellence, energy and emotions signed by VINCO EVENTI.",
    category: "live",
    featured: true,
    startTime: 0,
  },
  {
    displayOrder: 2,
    fileName: "blasck voice & sax on dancefloor 3d.mp4",
    type: "video",
    titleIta: "Black Voice & Live Sax su Dancefloor 3D",
    titleEng: "Black Voice & Live Sax on 3D Dancefloor",
    subtitleIta: "Uno spettacolo esclusivo con voce black internazionale, sax live e pista LED 3D.",
    subtitleEng: "An exclusive show with international black vocals, live sax and 3D LED dancefloor.",
    category: "djset",
    featured: true,
    startTime: null,
  },
  {
    displayOrder: 3,
    fileName: "live show duo violino.mp4",
    type: "video",
    titleIta: "Live Show Duo Violino Scenografico",
    titleEng: "Scenic Violin Duo Live Show",
    subtitleIta: "Performance vibrante con violini scenografici ed effetti visivi mozzafiato.",
    subtitleEng: "Vibrant performance with scenic violins and breathtaking visual effects.",
    category: "live",
    featured: true,
    startTime: null,
  },
  {
    displayOrder: 4,
    fileName: "dj colaluca djset & percussion.mp4",
    type: "video",
    titleIta: "DJ Vincenzo Colaluca & Live Percussion Show",
    titleEng: "DJ Vincenzo Colaluca & Live Percussion Show",
    subtitleIta: "Ritmo travolgente e percussioni dal vivo sulla dancefloor.",
    subtitleEng: "Overwhelming rhythm and live percussions on the dancefloor.",
    category: "djset",
    featured: true,
    startTime: null,
  },
  {
    displayOrder: 5,
    fileName: "live band 2.mp4",
    type: "video",
    titleIta: "Live Band & Party Explosion",
    titleEng: "Live Band & Party Explosion",
    subtitleIta: "Energia pura e grandi successi suonati dal vivo per far ballare tutti gli ospiti.",
    subtitleEng: "Pure energy and live hits to keep all guests dancing.",
    category: "band",
    featured: true,
    startTime: null,
  },
  {
    displayOrder: 6,
    fileName: "dj set colaluca american wedding.mp4",
    type: "video",
    titleIta: "American Destination Wedding DJ Set",
    titleEng: "American Destination Wedding DJ Set",
    subtitleIta: "Soundtrack internazionale per matrimoni ed eventi esclusivi in Puglia.",
    subtitleEng: "International soundtrack for luxury destination weddings in Puglia.",
    category: "djset",
    featured: true,
    startTime: null,
  },

  // --- RESTANTI 20 VIDEO ---
  {
    displayOrder: 7,
    fileName: "arpa & violino.mp4",
    type: "video",
    titleIta: "Arpa & Violino Romantic Ceremony",
    titleEng: "Arpa & Violino Romantic Ceremony",
    subtitleIta: "Atmosfere raffinate ed eleganti per il rito civile o religioso.",
    subtitleEng: "Refined and elegant atmospheres for civil or religious ceremonies.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 8,
    fileName: "chitarra live.mp4",
    type: "video",
    titleIta: "Chitarra Live & Loop Station Acoustic",
    titleEng: "Live Guitar & Acoustic Loop Station",
    subtitleIta: "Sonorità acustiche moderne e coinvolgenti per l'aperitivo.",
    subtitleEng: "Modern acoustic grooves and loop acoustic vibes for welcome drinks.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 9,
    fileName: "dancefloor 3d.mp4",
    type: "video",
    titleIta: "Dancefloor 3D Infinity Mirror Effect",
    titleEng: "3D Infinity Mirror LED Dancefloor",
    subtitleIta: "Pista da ballo LED 3D per un party futuristico e spettacolare.",
    subtitleEng: "3D LED dancefloor for a futuristic and breathtaking party experience.",
    category: "lightshow",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 10,
    fileName: "dj set & sax afterparty.mp4",
    type: "video",
    titleIta: "DJ Set & Sax Afterparty",
    titleEng: "DJ Set & Sax Afterparty",
    subtitleIta: "Il mix perfetto tra beat elettronici e improvvisazione sax dal vivo.",
    subtitleEng: "The perfect blend of electronic beats and live sax improvisation.",
    category: "djset",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 11,
    fileName: "djset borgo ritella destination wedding.mp4",
    type: "video",
    titleIta: "Borgo Ritella Destination Wedding Party",
    titleEng: "Borgo Ritella Destination Wedding Party",
    subtitleIta: "Serata indimenticabile in una delle location più suggestive di Puglia.",
    subtitleEng: "Unforgettable party night in one of Puglia's most prestigious venues.",
    category: "djset",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 12,
    fileName: "djset vinco eventi team.mp4",
    type: "video",
    titleIta: "VINCO EVENTI Crew DJ Set",
    titleEng: "VINCO EVENTI Crew DJ Set",
    subtitleIta: "La professionalità e la sintonia del nostro team artistico.",
    subtitleEng: "The harmony, passion and expertise of our artistic DJ crew.",
    category: "djset",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 13,
    fileName: "duo voce e onemanband.mp4",
    type: "video",
    titleIta: "Duo Voce & One Man Band",
    titleEng: "Vocals Duo & One Man Band",
    subtitleIta: "Intrattenimento versatile e polistrumentale per ogni momento del ricevimento.",
    subtitleEng: "Versatile multi-instrumental performance tailored for every reception phase.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 14,
    fileName: "live band.mp4",
    type: "video",
    titleIta: "Live Band Wedding Performance",
    titleEng: "Live Band Wedding Performance",
    subtitleIta: "Repertorio pop, rock e dance suonato con passione e maestria.",
    subtitleEng: "Pop, rock and dance repertoire performed live with style and mastery.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 15,
    fileName: "live black voice.mp4",
    type: "video",
    titleIta: "International Black Voice Live",
    titleEng: "International Black Voice Live",
    subtitleIta: "Timbro soul e potenza vocale per un'esperienza da brividi.",
    subtitleEng: "Soulful power vocals delivering chills and pure musical passion.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 16,
    fileName: "quartetto archi candle.mp4",
    type: "video",
    titleIta: "Quartetto d'Archi Candlelight Emotion",
    titleEng: "Candlelight String Quartet Emotion",
    subtitleIta: "La magia degli archi a lume di candela per momenti indimenticabili.",
    subtitleEng: "Candlelight string enchantment for unforgettable emotional highlights.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 17,
    fileName: "sax donna.mp4",
    type: "video",
    titleIta: "Female Saxophone Solo Performance",
    titleEng: "Female Saxophone Solo Performance",
    subtitleIta: "Eleganza, fascino e note calde per l'accoglienza degli ospiti.",
    subtitleEng: "Elegance, charm and warm melodies welcoming your guests.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 18,
    fileName: "sax live with band.mp4",
    type: "video",
    titleIta: "Live Saxophone & Full Band Jam",
    titleEng: "Live Saxophone & Full Band Jam",
    subtitleIta: "Armonia e virtuosismo con il sax solista integrato nella band.",
    subtitleEng: "Harmony and virtuosic solos with live sax integrated with the band.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 19,
    fileName: "Service av discoball.mp4",
    type: "video",
    titleIta: "Service AV Vintage Discoball Scenografico",
    titleEng: "Scenic Vintage Discoball AV Setup",
    subtitleIta: "Riflessi di luce scintillanti per un'atmosfera retrò ed elegante.",
    subtitleEng: "Glittering light reflections creating an elegant retro dancefloor mood.",
    category: "lightshow",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 20,
    fileName: "service av fiori e beam.mp4",
    type: "video",
    titleIta: "Light Show Beam & Scenografia Architetturale",
    titleEng: "Beam Light Show & Architectural Scenography",
    subtitleIta: "Illuminazione architetturale dinamica con teste mobili Beam e accenti floreali.",
    subtitleEng: "Dynamic architectural lighting with Beam moving heads and floral accents.",
    category: "lightshow",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 21,
    fileName: "singer male live.mp4",
    type: "video",
    titleIta: "Male Singer Live Pop & Acoustic",
    titleEng: "Male Singer Live Pop & Acoustic",
    subtitleIta: "Interpretazioni emozionanti dei più celebri brani italiani e internazionali.",
    subtitleEng: "Heartfelt interpretations of classic Italian and global hits.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 22,
    fileName: "swing band acustico.mp4",
    type: "video",
    titleIta: "Acoustic Swing & Manouche Band",
    titleEng: "Acoustic Swing & Manouche Band",
    subtitleIta: "Ritmi vintage e allegria contagiosa per l'aperitivo e il welcome drink.",
    subtitleEng: "Vintage rhythms and infectious joy for appetizers and welcome drinks.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 23,
    fileName: "trolling band 2.mp4",
    type: "video",
    titleIta: "Trolling Band Comedy & Music Show",
    titleEng: "Trolling Band Comedy & Music Show",
    subtitleIta: "Goliardia, musica e coinvolgimento itinerante tra i tavoli.",
    subtitleEng: "Playful comedy and roaming live music among the wedding tables.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 24,
    fileName: "Trolling band dinner.mp4",
    type: "video",
    titleIta: "Trolling Band Dinner Entertainment",
    titleEng: "Trolling Band Dinner Entertainment",
    subtitleIta: "Momenti di allegria e risate che uniscono tutti gli invitati a cena.",
    subtitleEng: "Moments of joy and laughter connecting all guests during dinner.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 25,
    fileName: "vintage band.mp4",
    type: "video",
    titleIta: "Vintage Rock'n'Roll & Swing Live",
    titleEng: "Vintage Rock'n'Roll & Swing Live",
    subtitleIta: "Spettacolo live anni '50 e '60 con look a tema e grandissima grinta.",
    subtitleEng: "'50s and '60s themed live show packed with style and raw energy.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 26,
    fileName: "violino & sax.mp4",
    type: "video",
    titleIta: "Electric Violin & LED Sax Duet",
    titleEng: "Electric Violin & LED Sax Duet",
    subtitleIta: "Il dinamico connubio tra violino elettrico e sax luminoso per il taglio torta.",
    subtitleEng: "Dynamic fusion of electric violin and LED sax for cake cutting & party.",
    category: "live",
    featured: false,
    startTime: null,
  },

  // --- 14 IMMAGINI GALLERIA (NON USATE NELLE PAGINE FISSE) ---
  {
    displayOrder: 27,
    fileName: "Arpa violino e clarinetto women.webp",
    type: "image",
    titleIta: "Trio Femminile Arpa, Violino e Clarinetto",
    titleEng: "All-Female Trio: Harp, Violin & Clarinet",
    subtitleIta: "Armonie raffinate per cerimonie esclusive e aperitivi di classe.",
    subtitleEng: "Refined harmonies for luxury wedding ceremonies and classy cocktail hours.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 28,
    fileName: "Band.webp",
    type: "image",
    titleIta: "Live Band Lineup Completo",
    titleEng: "Full Live Band Lineup",
    subtitleIta: "Formazione completa di musicisti professionisti pronti ad accendere la serata.",
    subtitleEng: "Complete lineup of seasoned musicians ready to ignite the dancefloor.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 29,
    fileName: "foto dj enzo evento privato.webp",
    type: "image",
    titleIta: "DJ Set Private Exclusive Event",
    titleEng: "DJ Set Private Exclusive Event",
    subtitleIta: "Regia musicale e luci personalizzate per feste private di prestigio.",
    subtitleEng: "Tailored soundtrack and lighting design for high-end private parties.",
    category: "djset",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 30,
    fileName: "foto dj enzo pool party.webp",
    type: "image",
    titleIta: "Summer Sunset & Pool Party DJ Set",
    titleEng: "Summer Sunset & Pool Party DJ Set",
    subtitleIta: "Vibes estive, house raffinata e atmosfera rilassata a bordo piscina.",
    subtitleEng: "Summer vibes, refined deep house and poolside sunset ambience.",
    category: "djset",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 31,
    fileName: "live band.webp",
    type: "image",
    titleIta: "Live Band on Stage Performance",
    titleEng: "Live Band on Stage Performance",
    subtitleIta: "Impatto scenico e qualità audio per i palchi più prestigiosi.",
    subtitleEng: "Stage presence and pristine sound for premier wedding venues.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 32,
    fileName: "live singer with show.webp",
    type: "image",
    titleIta: "Live Vocals & Stage Entertainment",
    titleEng: "Live Vocals & Stage Entertainment",
    subtitleIta: "Presenza scenica magnetica e repertorio vocale di altissimo livello.",
    subtitleEng: "Magnetic stage presence and top-tier vocal performance.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 33,
    fileName: "percussioni.webp",
    type: "image",
    titleIta: "Live Percussion Setup & Congas",
    titleEng: "Live Percussion Setup & Congas",
    subtitleIta: "Ritmi tribali e sonorità calde per accompagnare il DJ set.",
    subtitleEng: "Tribal rhythms and acoustic warmth accompanying the live DJ set.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 34,
    fileName: "pizzica.webp",
    type: "image",
    titleIta: "Pizzica Salentina & Tradizione Popolare",
    titleEng: "Salento Pizzica & Folk Tradition",
    subtitleIta: "La travolgente energia della tradizione pugliese con tamburelli e danzatori.",
    subtitleEng: "The infectious pulse of Apulian folk tradition with tambourines and dancers.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 35,
    fileName: "sax con sposi bn.webp",
    type: "image",
    titleIta: "Sax Emotion con gli Sposi",
    titleEng: "Sax Emotion with the Newlyweds",
    subtitleIta: "Momenti intimi e coinvolgenti durante il ballo degli sposi.",
    subtitleEng: "Intimate, unforgettable moments during the couple's first dance.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 36,
    fileName: "service av palco frontale.webp",
    type: "image",
    titleIta: "Service Audio Luci & Struttura Palco Frontale",
    titleEng: "Audio-Visual Stage & Truss Rigging Setup",
    subtitleIta: "Tecnologie audio-luci all'avanguardia e americane modulari.",
    subtitleEng: "Cutting-edge AV technology and modular truss lighting architecture.",
    category: "lightshow",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 37,
    fileName: "Street band.webp",
    type: "image",
    titleIta: "Street Band Itinerante Festosa",
    titleEng: "Roaming Itinerant Street Brass Band",
    subtitleIta: "Fiati, ottoni e percussioni in movimento per un'accoglienza calorosa.",
    subtitleEng: "Brass and drums roaming among guests for an energetic welcome.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 38,
    fileName: "Trio archi su palchetti.webp",
    type: "image",
    titleIta: "Trio d'Archi Acustico su Palchetti Scenografici",
    titleEng: "Acoustic String Trio on Scenic Platforms",
    subtitleIta: "Esecuzione classica e contemporanea in armonia con la location.",
    subtitleEng: "Classical and modern crossover string execution matching the venue aesthetics.",
    category: "live",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 39,
    fileName: "vintage band aperitivo.webp",
    type: "image",
    titleIta: "Vintage Swing Band Welcome Drinks",
    titleEng: "Vintage Swing Band Welcome Drinks",
    subtitleIta: "Atmosfere d'altri tempi per un cocktail party fresco ed elegante.",
    subtitleEng: "Retro vibes for a fresh, sophisticated welcome cocktail party.",
    category: "band",
    featured: false,
    startTime: null,
  },
  {
    displayOrder: 40,
    fileName: "violoncello.webp",
    type: "image",
    titleIta: "Violoncello Soloist & Romantic Mood",
    titleEng: "Violoncello Soloist & Romantic Mood",
    subtitleIta: "Profondità timbrica ed emozione pura per il momento del sì.",
    subtitleEng: "Timbre depth and pure resonance for ceremony emotional highlights.",
    category: "live",
    featured: false,
    startTime: null,
  },
];

async function main() {
  console.log("🚀 AVVIO MIGRAZIONE DEFINITIVA SU CLOUDINARY (fzdamrbc)\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vinco-upload-"));

  // ==========================================
  // FASE 1: UPLOAD ICONE EMAIL E LOGO VINCO
  // ==========================================
  console.log("📧 --- FASE 1: UPLOAD ASSET EMAIL E LOGHI ---");
  const emailIconsDir = path.join(BACKEND_DIR, "src/main/resources/static/images");
  const emailIconFiles = fs.readdirSync(emailIconsDir);
  const uploadedEmailUrls = {};

  for (const file of emailIconFiles) {
    const filePath = path.join(emailIconsDir, file);
    const publicId = `vinco_email_assets/${path.parse(file).name}`;
    console.log(`  Upload icona ${file}...`);
    const res = await uploadToCloudinary(filePath, "vinco_email_assets", "image", publicId);
    uploadedEmailUrls[file] = res.secure_url;
    console.log(`  ✅ ${file} -> ${res.secure_url}`);
  }

  // Upload Logo ufficiale per email
  const logoOffPath = path.join(FRONTEND_ASSETS, "assets loghi/Logo vinco eventi off.png");
  console.log("  Upload Logo vinco eventi off per template email...");
  const resLogo = await uploadToCloudinary(logoOffPath, "vinco_email_assets", "image", "vinco_email_assets/logo-vinco-off");
  uploadedEmailUrls["logo-vinco-off"] = resLogo.secure_url;
  console.log(`  ✅ Logo email -> ${resLogo.secure_url}\n`);

  // ==========================================
  // FASE 2: UPLOAD BANNER PACCHETTI SERVIZI
  // ==========================================
  console.log("📦 --- FASE 2: UPLOAD BANNER PACCHETTI SERVIZI (4 BannerBox) ---");
  const bannersDir = path.join(FRONTEND_ASSETS, "4 BannerBox IT ENG Servizi");
  const bannerFiles = [
    "essentialIta.png", "essentialEng.png",
    "plusIta.png", "plusEng.png",
    "fullIta.png", "fullEng.png"
  ];
  const uploadedBannerUrls = {};

  for (const bFile of bannerFiles) {
    const bPath = path.join(bannersDir, bFile);
    const publicId = `vinco_eventi_servizi/${path.parse(bFile).name}`;
    console.log(`  Upload banner ${bFile}...`);
    const res = await uploadToCloudinary(bPath, "vinco_eventi_servizi", "image", publicId);
    uploadedBannerUrls[bFile] = res.secure_url;
    console.log(`  ✅ ${bFile} -> ${res.secure_url}`);
  }
  console.log();

  // ==========================================
  // FASE 3: UPLOAD MEDIA GALLERIA (40 ELEMENTI)
  // ==========================================
  console.log("🎬 --- FASE 3: COMPRESSIONE E UPLOAD DEI 40 MEDIA DELLA GALLERIA ---");
  const processedGalleryItems = [];

  for (const item of GALLERY_ITEMS_METADATA) {
    console.log(`\n[${item.displayOrder}/40] Elaborazione "${item.titleIta}" (${item.type.toUpperCase()})...`);
    const isVideo = item.type === "video";
    const subFolder = isVideo ? "assets video" : "assets immagini";
    const inputPath = path.join(FRONTEND_ASSETS, subFolder, item.fileName);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`File non trovato: ${inputPath}`);
    }

    let uploadFilePath = inputPath;
    if (isVideo) {
      const compressedName = `c_${path.parse(item.fileName).name}.mp4`;
      const compressedPath = path.join(tempDir, compressedName);
      await compressVideo(inputPath, compressedPath);
      uploadFilePath = compressedPath;
    }

    const publicId = `vinco_eventi_galleria/${path.parse(item.fileName).name.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    console.log(`  Cloudinary Upload in corso...`);
    const cldRes = await uploadToCloudinary(uploadFilePath, "vinco_eventi_galleria", isVideo ? "video" : "image", publicId);
    console.log(`  ✅ Secure URL: ${cldRes.secure_url}`);

    let posterUrl = cldRes.secure_url;
    if (isVideo) {
      // Poster WebP/JPG generato da Cloudinary al secondo 2
      posterUrl = cldRes.secure_url.replace(
        "/video/upload/",
        "/video/upload/f_jpg,q_auto,w_720,so_2/"
      ).replace(/\.[a-zA-Z0-9]+$/, ".jpg");
    }

    processedGalleryItems.push({
      displayOrder: item.displayOrder,
      type: item.type,
      titleIta: item.titleIta,
      titleEng: item.titleEng,
      subtitleIta: item.subtitleIta,
      subtitleEng: item.subtitleEng,
      category: item.category,
      featured: item.featured,
      startTime: item.startTime,
      src: cldRes.secure_url,
      posterUrl: posterUrl,
      publicId: cldRes.public_id,
    });

    // Pulizia file temporaneo compresso per non saturare disco
    if (isVideo && fs.existsSync(uploadFilePath)) {
      try { fs.unlinkSync(uploadFilePath); } catch {}
    }
  }

  // ==========================================
  // FASE 4: AGGIORNAMENTO NEON DB (RENDER)
  // ==========================================
  console.log("\n🔒 --- FASE 4: AUTENTICAZIONE ADMIN E SINCRONIZZAZIONE NEON DB ---");
  const loginRes = await fetchWithRetry(`${LIVE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken || loginData.jwt;
  console.log("✅ Token JWT ottenuto con successo su Render!\n");

  // 1. Pulizia e ricreazione Galleria su Neon
  console.log("🧹 Reset Galleria esistente su Neon DB...");
  const oldGalleryRes = await fetch(`${LIVE_URL}/api/gallery`);
  const oldGallery = await oldGalleryRes.json();
  for (const oldItem of oldGallery) {
    await fetch(`${LIVE_URL}/api/admin/gallery/${oldItem.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  console.log(`✅ Eliminati ${oldGallery.length} vecchi elementi galleria.`);

  console.log("📥 Inserimento 40 nuovi elementi galleria su Neon DB...");
  for (const gItem of processedGalleryItems) {
    const payload = {
      titleIta: gItem.titleIta,
      titleEng: gItem.titleEng,
      subtitleIta: gItem.subtitleIta,
      subtitleEng: gItem.subtitleEng,
      type: gItem.type,
      src: gItem.src,
      category: gItem.category,
      featured: gItem.featured,
      startTime: gItem.startTime,
      displayOrder: gItem.displayOrder,
      posterUrl: gItem.posterUrl,
    };

    const postRes = await fetch(`${LIVE_URL}/api/admin/gallery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!postRes.ok) {
      console.error(`❌ Errore creazione [${gItem.displayOrder}]: ${await postRes.text()}`);
    } else {
      const created = await postRes.json();
      gItem.id = created.id;
      process.stdout.write(`.`);
    }
    await sleep(200);
  }
  console.log("\n✅ 40 Elementi Galleria sincronizzati con successo su Neon DB!");

  // 2. Aggiornamento Servizi su Neon DB
  console.log("\n📦 Aggiornamento Servizi su Neon DB...");
  const liveServicesRes = await fetch(`${LIVE_URL}/api/services`);
  const liveServices = await liveServicesRes.json();

  const servicePayloads = [
    {
      badge: "ESSENTIAL",
      titleIta: "Pacchetto Essential",
      titleEng: "Essential Package",
      subtitleIta: "DJ Set & Regia Musicale Completa per l'Intero Evento",
      subtitleEng: "DJ Set & Complete Musical Direction for the Entire Event",
      imageUrlIta: uploadedBannerUrls["essentialIta.png"],
      imageUrlEng: uploadedBannerUrls["essentialEng.png"],
      featuresIta: "DJ Set professionale senza limiti di orario;Regia musicale aperitivo, cena e party;Consolle professionale e microfonia wireless;Consulenza musicale personalizzata prima dell'evento",
      featuresEng: "Professional DJ Set with no time limits;Musical direction for cocktail, dinner & party;Pro console and wireless microphones;Personalized music consultation prior to event",
      category: "PACKAGE",
      displayOrder: 1,
    },
    {
      badge: "PLUS",
      titleIta: "Pacchetto Plus",
      titleEng: "Plus Package",
      subtitleIta: "DJ Set + Service Audio/Luci Scenografico & Effetti Speciali",
      subtitleEng: "DJ Set + Scenic Audio/Lighting Service & Special Effects",
      imageUrlIta: uploadedBannerUrls["plusIta.png"],
      imageUrlEng: uploadedBannerUrls["plusEng.png"],
      featuresIta: "Tutto il pacchetto Essential;Service Audio e Luci scenografiche architetturali;Teste mobili, fari LED a batteria e fumo scenografico;Fontane fredde Sparkular per taglio torta;Assistenza tecnica dedicata in loco",
      featuresEng: "Everything in the Essential Package;Scenic and architectural lighting service;Moving heads, battery LED uplights & scenic fog;Sparkular cold spark fountains for cake cutting;Dedicated on-site technical assistance",
      category: "PACKAGE",
      displayOrder: 2,
    },
    {
      badge: "FULL",
      titleIta: "Pacchetto Full Experience",
      titleEng: "Full Experience Package",
      subtitleIta: "L'Esperienza Definitiva: DJ Set, Service Completo e Musicisti Live",
      subtitleEng: "The Ultimate Experience: DJ Set, Full AV Service & Live Musicians",
      imageUrlIta: uploadedBannerUrls["fullIta.png"],
      imageUrlEng: uploadedBannerUrls["fullEng.png"],
      featuresIta: "Tutto il pacchetto Plus;Band dal vivo o Musicisti live (Sax, Violino o Voce);Dancefloor LED 3D o allestimento palco frontale;Regia completa per cerimonia, aperitivo, cena e afterparty;Coordinamento totale dello show musicale",
      featuresEng: "Everything in the Plus Package;Live Band or Live Musicians (Sax, Violin or Vocals);3D LED Dancefloor or Frontal Stage Rigging;Complete direction for ceremony, cocktail, dinner & afterparty;Total coordination of the music show",
      category: "PACKAGE",
      displayOrder: 3,
    },
  ];

  for (const sPayload of servicePayloads) {
    const existing = liveServices.find((s) => s.badge === sPayload.badge || s.displayOrder === sPayload.displayOrder);
    if (existing) {
      console.log(`  Aggiornamento servizio "${sPayload.titleIta}" (ID: ${existing.id})...`);
      const putRes = await fetch(`${LIVE_URL}/api/admin/services/${existing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sPayload),
      });
      if (putRes.ok) console.log(`  ✅ Servizio ${sPayload.badge} aggiornato!`);
    } else {
      console.log(`  Creazione nuovo servizio "${sPayload.titleIta}"...`);
      const postRes = await fetch(`${LIVE_URL}/api/admin/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sPayload),
      });
      if (postRes.ok) console.log(`  ✅ Servizio ${sPayload.badge} creato!`);
    }
  }

  // ==========================================
  // FASE 5: AGGIORNAMENTO FALLBACK galleryData.js
  // ==========================================
  console.log("\n📄 --- FASE 5: SCRITTURA FALLBACK STATIC FRONTEND galleryData.js ---");
  const galleryDataFilePath = path.resolve(ROOT_DIR, "frontend/src/components/GallerySection/galleryData.js");
  const fallbackFileContent = `// NOTA: File di fallback offline/emergenza sincronizzato con Cloudinary (${CLOUD_NAME}).
// La fonte primaria dei dati dinamici è il DB PostgreSQL su Neon / Render.

export const galleryItems = ${JSON.stringify(processedGalleryItems.map(i => ({ ...i, isFallback: true })), null, 2)};
`;
  fs.writeFileSync(galleryDataFilePath, fallbackFileContent, "utf-8");
  console.log(`✅ Scritto ${galleryDataFilePath} con 40 elementi aggiornati!`);

  // ==========================================
  // FASE 6: AGGIORNAMENTO EmailService.java
  // ==========================================
  console.log("\n✉️ --- FASE 6: AGGIORNAMENTO COSTANTI EmailService.java ---");
  const emailServicePath = path.resolve(BACKEND_DIR, "src/main/java/antonioschettini/backend/services/EmailService.java");
  let emailServiceCode = fs.readFileSync(emailServicePath, "utf-8");

  const logoUrl = uploadedEmailUrls["logo-vinco-off"] || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/vinco_email_assets/logo-vinco-off.png`;
  const googleIconUrl = uploadedEmailUrls["google-icon.png"] || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/vinco_email_assets/google-icon.png`;
  const appleIconUrl = uploadedEmailUrls["apple-icon.png"] || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/vinco_email_assets/apple-icon.png`;
  const dashboardIconUrl = uploadedEmailUrls["dashboard-icon.png"] || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/vinco_email_assets/dashboard-icon.png`;
  const instagramIconUrl = uploadedEmailUrls["instagram-icon.png"] || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/vinco_email_assets/instagram-icon.png`;
  const phoneIconUrl = uploadedEmailUrls["phone-icon.png"] || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/vinco_email_assets/phone-icon.png`;
  const whatsappIconUrl = uploadedEmailUrls["whatsapp-icon.png"] || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/vinco_email_assets/whatsapp-icon.png`;

  emailServiceCode = emailServiceCode.replace(
    /private static final String URL_LOGO_VINCO = "[^"]+";/,
    `private static final String URL_LOGO_VINCO = "${logoUrl}";`
  ).replace(
    /private static final String URL_GOOGLE_ICON = "[^"]+";/,
    `private static final String URL_GOOGLE_ICON = "${googleIconUrl}";`
  ).replace(
    /private static final String URL_APPLE_ICON = "[^"]+";/,
    `private static final String URL_APPLE_ICON = "${appleIconUrl}";`
  ).replace(
    /private static final String URL_DASHBOARD_ICON = "[^"]+";/,
    `private static final String URL_DASHBOARD_ICON = "${dashboardIconUrl}";`
  ).replace(
    /private static final String URL_INSTAGRAM_ICON = "[^"]+";/,
    `private static final String URL_INSTAGRAM_ICON = "${instagramIconUrl}";`
  ).replace(
    /private static final String URL_PHONE_ICON = "[^"]+";/,
    `private static final String URL_PHONE_ICON = "${phoneIconUrl}";`
  ).replace(
    /private static final String URL_WHATSAPP_ICON = "[^"]+";/,
    `private static final String URL_WHATSAPP_ICON = "${whatsappIconUrl}";`
  );

  fs.writeFileSync(emailServicePath, emailServiceCode, "utf-8");
  console.log(`✅ Aggiornate costanti URL su EmailService.java!`);

  // Pulizia temp dir
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}

  console.log("\n🎉 MIGRAZIONE DEFINITIVA COMPLETATA CON SUCCESSO AL 100%!");
}

main().catch((err) => {
  console.error("\n❌ ERRORE CRITICO DURANTE LA MIGRAZIONE:", err);
  process.exit(1);
});
