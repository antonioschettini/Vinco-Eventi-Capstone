/**
 * migrate-quotes-and-sync-gallery.mjs
 *
 * 1. Legge tutti i preventivi dal DB PostgreSQL locale (localhost:5432/vincoeventi)
 * 2. Stampa ed esporta la lista dei preventivi locali trovati
 * 3. Se fornito LIVE_BACKEND_URL (o localhost:8080), autentica l'admin ed invia tutti i preventivi ed allinea la galleria
 */

import pg from "pg";
import fetch from "node-fetch";

const { Client } = pg;

const BACKEND_URL = process.env.LIVE_BACKEND_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vincoeventi@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "RipBigVincoEventi!";

// Configurazione PostgreSQL Locale
const localPgConfig = {
  host: "localhost",
  port: 5432,
  database: "vincoeventi",
  user: "postgres",
  password: "1234",
};

// 32 Elementi della Galleria 100% Verificati ed Allineati Visualmente
const ALIGNED_GALLERY_ITEMS = [
  {
    displayOrder: 1,
    titleIta: "Set ELETTRICO - International Voice Black",
    titleEng: "ELECTRICAL Set - International Voice Black",
    subtitleIta: "La carica travolgente del nostro set elettrico live con Vincenzo Colaluca",
    subtitleEng: "The overwhelming energy of our live electric set with Vincenzo Colaluca",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785861122/vinco_eventi_galleria/rftirtcmqxgjsqsyu6fv.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785861122/vinco_eventi_galleria/rftirtcmqxgjsqsyu6fv.jpg",
    category: "live",
    featured: true
  },
  {
    displayOrder: 2,
    titleIta: "Crossroads Live Performance",
    titleEng: "Crossroads Live Performance",
    subtitleIta: "Spettacolo musicale d'impatto e ritmo coinvolgente sotto le luci",
    subtitleEng: "High impact musical performance with engaging rhythm under the lights",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738686/vinco_eventi_galleria/oiuv1egd7bx5atkiwzbb.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738686/vinco_eventi_galleria/oiuv1egd7bx5atkiwzbb.jpg",
    category: "band",
    featured: true
  },
  {
    displayOrder: 3,
    titleIta: "Duo Violino & Performance Scenografica",
    titleEng: "Violin Duo & Scenic Performance",
    subtitleIta: "Eleganza e sonorità uniche per momenti indimenticabili",
    subtitleEng: "Elegance and unique sounds for unforgettable moments",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738913/vinco_eventi_galleria/tuu3jqx5c72wyf9ldhbg.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738913/vinco_eventi_galleria/tuu3jqx5c72wyf9ldhbg.jpg",
    category: "band",
    featured: true
  },
  {
    displayOrder: 4,
    titleIta: "Console DJ Set Enzo Colaluca",
    titleEng: "Console DJ Set Enzo Colaluca",
    subtitleIta: "Musica e regia professionale per la serata",
    subtitleEng: "Professional music and direction for your evening",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738683/vinco_eventi_galleria/xp9vsaeg4vd8o7d2hzne.jpg",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738683/vinco_eventi_galleria/xp9vsaeg4vd8o7d2hzne.jpg",
    category: "djset",
    featured: true
  },
  {
    displayOrder: 5,
    titleIta: "Exclusive Night Party Console",
    titleEng: "Exclusive Night Party Console",
    subtitleIta: "Regia musicale, luci e console per eventi esclusivi",
    subtitleEng: "Music direction, lights and console for exclusive events",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785739072/vinco_eventi_galleria/r9e4uokfrbmpwadra7al.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785739072/vinco_eventi_galleria/r9e4uokfrbmpwadra7al.jpg",
    category: "djset",
    featured: true
  },
  {
    displayOrder: 6,
    titleIta: "Esibizione Vocalist Live",
    titleEng: "Live Vocalist Performance",
    subtitleIta: "Emozione pura e voce dal vivo durante il party",
    subtitleEng: "Pure emotion and live voice during the party",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785739059/vinco_eventi_galleria/ef6cr5xt3l4utt5ngzbz.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785739059/vinco_eventi_galleria/ef6cr5xt3l4utt5ngzbz.jpg",
    category: "live",
    featured: true
  },
  {
    displayOrder: 7,
    titleIta: "I Nostri Musicisti dal Vivo",
    titleEng: "Our Live Musicians",
    subtitleIta: "Band acustica ed intrattenimento d'eccellenza in giardino",
    subtitleEng: "Acoustic band and excellence entertainment in the garden",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739092/vinco_eventi_galleria/srdtwafxbjz3w9hdkxax.jpg",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739092/vinco_eventi_galleria/srdtwafxbjz3w9hdkxax.jpg",
    category: "band",
    featured: true
  },
  {
    displayOrder: 8,
    titleIta: "Cocktail & Sax Show",
    titleEng: "Cocktail & Sax Show",
    subtitleIta: "Assolo di sax ed sonorità moderne illuminate",
    subtitleEng: "Sax solo and modern illuminated sounds",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785739049/vinco_eventi_galleria/k6nrydw6lhpgaiztomgd.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785739049/vinco_eventi_galleria/k6nrydw6lhpgaiztomgd.jpg",
    category: "live",
    featured: false
  },
  {
    displayOrder: 9,
    titleIta: "Live Energy & Violino",
    titleEng: "Live Energy & Violin",
    subtitleIta: "Performance violinistica ed energia pura sul palco",
    subtitleEng: "Violin performance and pure energy on stage",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785739011/vinco_eventi_galleria/lq4emmoiddqhzpbgthq3.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785739011/vinco_eventi_galleria/lq4emmoiddqhzpbgthq3.jpg",
    category: "live",
    featured: false
  },
  {
    displayOrder: 10,
    titleIta: "Illuminazione Cielo Stellato",
    titleEng: "Starry Sky Lighting",
    subtitleIta: "Atmosfera magica per la cena all'aperto",
    subtitleEng: "Magical atmosphere for outdoor dinner",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738823/vinco_eventi_galleria/eo7tqi5jal8lbxvma4bo.jpg",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738823/vinco_eventi_galleria/eo7tqi5jal8lbxvma4bo.jpg",
    category: "decor",
    featured: false
  },
  {
    displayOrder: 11,
    titleIta: "Wedding Party & Sax Live",
    titleEng: "Wedding Party & Live Sax",
    subtitleIta: "I momenti più belli ed emozionanti del party tra le luci",
    subtitleEng: "The best and most exciting moments of the party in lights",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785739001/vinco_eventi_galleria/ufpb1xiseuvs1lsxonad.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785739001/vinco_eventi_galleria/ufpb1xiseuvs1lsxonad.jpg",
    category: "wedding",
    featured: false
  },
  {
    displayOrder: 12,
    titleIta: "Scenografia Luci & Tunnel Stellato",
    titleEng: "Lighting Design & Starry Tunnel",
    subtitleIta: "Pista di luci ed allestimento per una serata indimenticabile",
    subtitleEng: "Dancefloor lighting and setup for an unforgettable night",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738970/vinco_eventi_galleria/zhhw5yesgmrwsift9sow.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738970/vinco_eventi_galleria/zhhw5yesgmrwsift9sow.jpg",
    category: "lightshow",
    featured: false
  },
  {
    displayOrder: 13,
    titleIta: "Rosone Luminoso & Scenografia Sposi",
    titleEng: "Illuminated Rosette & Couple Scenery",
    subtitleIta: "Scenografia di luci d'autore e momento romantico al buio",
    subtitleEng: "Signature light architecture and romantic moment in the dark",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738910/vinco_eventi_galleria/d34yekgmypunr4au4xwv.jpg",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738910/vinco_eventi_galleria/d34yekgmypunr4au4xwv.jpg",
    category: "wedding",
    featured: false
  },
  {
    displayOrder: 14,
    titleIta: "Spettacolo Pirotecnico & Scenografia Sposi",
    titleEng: "Pyrotechnic Show & Wedding Scenery",
    subtitleIta: "La magia dell'evento con spettacoli pirotecnici sul lago",
    subtitleEng: "The magic of the event with fireworks by the lake",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738959/vinco_eventi_galleria/afrx0hb5jnevhbudiieo.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738959/vinco_eventi_galleria/afrx0hb5jnevhbudiieo.jpg",
    category: "effects",
    featured: true
  },
  {
    displayOrder: 15,
    titleIta: "Candlelight String Quartet Live",
    titleEng: "Candlelight String Quartet Live",
    subtitleIta: "Quartetto d'archi ed atmosfera romantica a lume di candela",
    subtitleEng: "String quartet and romantic candlelight atmosphere",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738945/vinco_eventi_galleria/etesqmzgylrapntrtrbf.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738945/vinco_eventi_galleria/etesqmzgylrapntrtrbf.jpg",
    category: "band",
    featured: false
  },
  {
    displayOrder: 16,
    titleIta: "Atmosphere & Voice Live",
    titleEng: "Atmosphere & Voice Live",
    subtitleIta: "Voce ed intrattenimento per un'atmosfera elegante",
    subtitleEng: "Voice and entertainment for an elegant atmosphere",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738935/vinco_eventi_galleria/vswvgslfquuykapxnr3d.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738935/vinco_eventi_galleria/vswvgslfquuykapxnr3d.jpg",
    category: "live",
    featured: true
  },
  {
    displayOrder: 17,
    titleIta: "Taglio Torta & Fontane Sparkular",
    titleEng: "Cake Cutting & Sparkular Fountains",
    subtitleIta: "Il culmine dei festeggiamenti con fontane di scintille a freddo",
    subtitleEng: "The climax of the celebrations with cold spark fountains",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738957/vinco_eventi_galleria/difwya2hiwgfwlsn6tc4.jpg",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738957/vinco_eventi_galleria/difwya2hiwgfwlsn6tc4.jpg",
    category: "wedding",
    featured: false
  },
  {
    displayOrder: 18,
    titleIta: "Fumogeni & Party Night",
    titleEng: "Smoke Effects & Party Night",
    subtitleIta: "Effetti speciali fumogeni e luce stroboscopica per il party",
    subtitleEng: "Special smoke effects and strobe lighting for the party",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785739102/vinco_eventi_galleria/wdjpouelk0wgy8b7ayxb.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785739102/vinco_eventi_galleria/wdjpouelk0wgy8b7ayxb.jpg",
    category: "effects",
    featured: true
  },
  {
    displayOrder: 19,
    titleIta: "Party & Clubbing Night",
    titleEng: "Party & Clubbing Night",
    subtitleIta: "Pista piena e divertimento assicurato",
    subtitleEng: "Full dancefloor and guaranteed fun",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738895/vinco_eventi_galleria/owjxvhnylisvs0hiyxar.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738895/vinco_eventi_galleria/owjxvhnylisvs0hiyxar.jpg",
    category: "djset",
    featured: false
  },
  {
    displayOrder: 20,
    titleIta: "Fumogeni Colorati & Primo Bacio",
    titleEng: "Colored Smoke & First Kiss",
    subtitleIta: "Esplosione di colori scenografica al Maggiolino d'epoca",
    subtitleEng: "Spectacular burst of colors at the vintage Beetle car",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738998/vinco_eventi_galleria/eeaxtuj0fwjqzspt38fd.jpg",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738998/vinco_eventi_galleria/eeaxtuj0fwjqzspt38fd.jpg",
    category: "effects",
    featured: false
  },
  {
    displayOrder: 21,
    titleIta: "Brass & Street Band Entertainment",
    titleEng: "Brass & Street Band Entertainment",
    subtitleIta: "Coinvolgimento itinerante travolgente con megafono e fiati",
    subtitleEng: "Overwhelming roaming entertainment with brass and megaphone",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738827/vinco_eventi_galleria/slfbcr7zinspj5coflaa.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738827/vinco_eventi_galleria/slfbcr7zinspj5coflaa.jpg",
    category: "band",
    featured: false
  },
  {
    displayOrder: 22,
    titleIta: "Live Show & Coinvolgimento",
    titleEng: "Live Show & Engagement",
    subtitleIta: "Performance ed energia con la regia di VINCO EVENTI",
    subtitleEng: "Performance and energy directed by VINCO EVENTI",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738801/vinco_eventi_galleria/so2xar04vohxdsc0lulo.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738801/vinco_eventi_galleria/so2xar04vohxdsc0lulo.jpg",
    category: "live",
    featured: false
  },
  {
    displayOrder: 23,
    titleIta: "Voce & Performance Vocalist Live",
    titleEng: "Voice & Vocalist Live Performance",
    subtitleIta: "Voce ed intrattenimento sul palco live durante il party",
    subtitleEng: "Voice and stage entertainment live during the party",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738784/vinco_eventi_galleria/eb0ki9vvv83w4nlhybid.webp",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785738784/vinco_eventi_galleria/eb0ki9vvv83w4nlhybid.webp",
    category: "live",
    featured: false
  },
  {
    displayOrder: 24,
    titleIta: "Scenografia Teste Mobili & Light Show",
    titleEng: "Moving Heads & Light Show Scenery",
    subtitleIta: "Regia luci professionale con teste mobili e fasci luminosi",
    subtitleEng: "Professional light direction with moving heads and beams",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738787/vinco_eventi_galleria/uiqet8umjkjq3b4wej1c.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738787/vinco_eventi_galleria/uiqet8umjkjq3b4wej1c.jpg",
    category: "lightshow",
    featured: false
  },
  {
    displayOrder: 25,
    titleIta: "Live Show Chitarra & Cantante",
    titleEng: "Live Guitar & Singer Show",
    subtitleIta: "Chitarrista e voce dal vivo sul palco",
    subtitleEng: "Guitarist and live vocals on stage",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738745/vinco_eventi_galleria/flg3kduqpo9yoq79fjom.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738745/vinco_eventi_galleria/flg3kduqpo9yoq79fjom.jpg",
    category: "band",
    featured: false
  },
  {
    displayOrder: 26,
    titleIta: "Show dal Vivo in Pista",
    titleEng: "Live Performance Show",
    subtitleIta: "Coinvolgimento e spettacolo per tutti gli ospiti",
    subtitleEng: "Engagement and show for all guests",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738600/vinco_eventi_galleria/ynbarymzdd1lu9cvycfu.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738600/vinco_eventi_galleria/ynbarymzdd1lu9cvycfu.jpg",
    category: "live",
    featured: false
  },
  {
    displayOrder: 27,
    titleIta: "Live Band Show in Sala Storica",
    titleEng: "Live Band Show in Historic Hall",
    subtitleIta: "Spettacolo musicale dal vivo completo e scenografia luci",
    subtitleEng: "Full live music show and light production",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739100/vinco_eventi_galleria/pdz6t0sfegbelnr12wb3.png",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739100/vinco_eventi_galleria/pdz6t0sfegbelnr12wb3.png",
    category: "band",
    featured: false
  },
  {
    displayOrder: 28,
    titleIta: "Pista Aperta & Party Night",
    titleEng: "Open Dancefloor & Party Night",
    subtitleIta: "Pista piena e divertimento assicurato",
    subtitleEng: "Full dancefloor and guaranteed fun",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738661/vinco_eventi_galleria/uwi6mmwruee6037hbsuo.mp4",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738661/vinco_eventi_galleria/uwi6mmwruee6037hbsuo.jpg",
    category: "djset",
    featured: false
  },
  {
    displayOrder: 29,
    titleIta: "Band Acustica in Giardino",
    titleEng: "Acoustic Band in the Garden",
    subtitleIta: "Sonorità itineranti ed eleganza acustica tra il verde",
    subtitleEng: "Itinerant sound and acoustic elegance among the greenery",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739047/vinco_eventi_galleria/txbfapyv9ujglspk13eo.jpg",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739047/vinco_eventi_galleria/txbfapyv9ujglspk13eo.jpg",
    category: "band",
    featured: false
  },
  {
    displayOrder: 30,
    titleIta: "Live Session & Band Acustica Aperitivo",
    titleEng: "Live Session & Acoustic Band Cocktail",
    subtitleIta: "Musica e passione al servizio del tuo evento",
    subtitleEng: "Music and passion at the service of your event",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738637/vinco_eventi_galleria/jlqctoerysynttow2lpf.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738637/vinco_eventi_galleria/jlqctoerysynttow2lpf.jpg",
    category: "band",
    featured: false
  },
  {
    displayOrder: 31,
    titleIta: "Brass & Street Band in Action",
    titleEng: "Brass & Street Band in Action",
    subtitleIta: "Coinvolgimento itinerante travolgente con megafono e fiati",
    subtitleEng: "Overwhelming roaming entertainment with brass and megaphone",
    type: "image",
    src: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739108/vinco_eventi_galleria/ftaaf6e3ry3wykbvdxdn.webp",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739108/vinco_eventi_galleria/ftaaf6e3ry3wykbvdxdn.webp",
    category: "band",
    featured: false
  },
  {
    displayOrder: 32,
    titleIta: "International Voice & Live Show",
    titleEng: "International Voice & Live Show",
    subtitleIta: "Spettacolo internazionale con la regia musicale di Enzo Colaluca",
    subtitleEng: "International show with music direction by Enzo Colaluca",
    type: "video",
    src: "https://res.cloudinary.com/ytjdxerb/video/upload/v1785738801/vinco_eventi_galleria/so2xar04vohxdsc0lulo.mov",
    posterUrl: "https://res.cloudinary.com/ytjdxerb/video/upload/f_jpg,q_auto,w_720,so_2/v1785738801/vinco_eventi_galleria/so2xar04vohxdsc0lulo.jpg",
    category: "live",
    featured: false
  }
];

async function getAuthToken(baseUrl) {
  console.log(`🔒 Login admin su ${baseUrl}...`);
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login fallito (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const token = data.token || data.accessToken || data.jwt;
  console.log("  ✅ Token JWT ottenuto con successo.");
  return token;
}

async function fetchLocalQuotes() {
  console.log("📦 Lettura preventivi da PostgreSQL locale...");
  const client = new Client(localPgConfig);
  try {
    await client.connect();
    const res = await client.query("SELECT * FROM quote_requests ORDER BY data_richiesta ASC");
    console.log(`  -> Trovati ${res.rows.length} preventivi nel DB locale.`);
    await client.end();
    return res.rows;
  } catch (err) {
    console.warn("  ⚠️ Impossibile connettersi a PostgreSQL locale:", err.message);
    return [];
  }
}

async function main() {
  console.log("=".repeat(65));
  console.log("  🚀 VINCO EVENTI - MIGRAZIONE PREVENTIVI & SYNCHRO GALLERIA");
  console.log("=".repeat(65) + "\n");

  const localQuotes = await fetchLocalQuotes();

  console.log(`\nConnessione al backend target (${BACKEND_URL})...`);
  try {
    const token = await getAuthToken(BACKEND_URL);

    if (localQuotes.length > 0) {
      console.log("\n📋 Migrazione preventivi locali verso il DB Target...");
      let migrated = 0;
      for (const q of localQuotes) {
        const payload = {
          nome: q.nome,
          cognome: q.cognome,
          email: q.email,
          telefono: q.telefono,
          dataEvento: q.data_evento ? new Date(q.data_evento).toISOString().split("T")[0] : null,
          tipoEvento: q.tipo_evento,
          location: q.location,
          numeroOspiti: q.numero_ospiti,
          orarioGiornata: q.orario_giornata,
          tipoCerimonia: q.tipo_cerimonia,
          messaggio: q.messaggio,
          budget: q.budget,
          lingua: q.lingua || "it",
          stato: q.stato || "PENDING",
        };

        try {
          const postRes = await fetch(`${BACKEND_URL}/api/quotes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (postRes.ok) {
            migrated++;
            console.log(`  ✅ Migrato: ${q.nome} ${q.cognome} (${q.tipo_evento})`);
          } else {
            console.warn(`  ⚠️ Impossibile inserire preventivo ${q.nome}: ${await postRes.text()}`);
          }
        } catch (err) {
          console.error(`  ❌ Errore durante invio preventivo:`, err.message);
        }
      }
      console.log(`\n  🎉 Preventivi migrati con successo: ${migrated}/${localQuotes.length}`);
    }

    console.log("\n🎬 Sincronizzazione ed allineamento della Galleria...");
    const galleryRes = await fetch(`${BACKEND_URL}/api/gallery`);
    if (galleryRes.ok) {
      const liveItems = await galleryRes.json();
      console.log(`Trovati ${liveItems.length} elementi della galleria a DB.`);

      let updatedCount = 0;
      for (const newItem of ALIGNED_GALLERY_ITEMS) {
        const existing = liveItems.find((e) => e.displayOrder === newItem.displayOrder);
        if (existing) {
          const updatePayload = {
            ...newItem,
            id: existing.id,
          };
          const putRes = await fetch(`${BACKEND_URL}/api/admin/gallery/${existing.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatePayload),
          });
          if (putRes.ok) {
            updatedCount++;
          }
        } else {
          const postRes = await fetch(`${BACKEND_URL}/api/admin/gallery`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newItem),
          });
          if (postRes.ok) updatedCount++;
        }
      }
      console.log(`  ✅ Galleria aggiornata ed allineata: ${updatedCount}/${ALIGNED_GALLERY_ITEMS.length} media.`);
    }

  } catch (err) {
    console.warn(`  ⚠️ Backend ${BACKEND_URL} non raggiungibile al momento:`, err.message);
  }

  console.log("\n" + "=".repeat(65));
  console.log("  ✨ ESECUZIONE COMPLETATA!");
  console.log("=" .repeat(65));
}

main().catch(console.error);
