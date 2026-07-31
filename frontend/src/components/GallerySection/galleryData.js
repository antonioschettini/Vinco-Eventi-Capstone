// Import Video Assets
import djsetEnzo1 from "../../assets/galleria/DjsetEnzo.mp4";
import djsetEnzo2 from "../../assets/galleria/djsetEnzo2.mp4";
import djsetEnzo3 from "../../assets/galleria/vdjsetenzo3.mp4";
import videoLuciLed from "../../assets/galleria/video luci led console.mp4";
import videoBandGiorno from "../../assets/galleria/videobandgiorno.mp4";
import videoBandSera from "../../assets/galleria/videobandsera.mp4";
import videoBandSera2 from "../../assets/galleria/videobandsera2.mp4";
import videoFumogeniPromessa from "../../assets/galleria/videofumogenipromessa.mp4";

// Import Photo Assets (Allowed images from src/assets/home/)
import fumogeniColor2 from "../../assets/home/14. fumogeni color 2.jpg";
import cieloStellato from "../../assets/home/cielo stellato.jpg";
import fotoBacioSposi from "../../assets/home/foto bacio sposi.jpg";
import fotoBandAperitivo from "../../assets/home/foto band aperitivo.jpg";
import fotoBandPng from "../../assets/home/foto band.png";
import fotoBrindisiTorta from "../../assets/home/foto brindisi torta.jpg";
import fotoCantanteSera from "../../assets/home/foto cantante sera.webp";
import fotoEnzoDjSet from "../../assets/home/foto enzo dj set.jpeg";
import fotoMusicaAperitivo from "../../assets/home/foto musica aperitivo.jpg";
import fotoBandAperitivoWebp from "../../assets/home/fotoband aperitivo.webp";

export const galleryItems = [
  // Featured / Highlights & Mixed items
  {
    id: "v1",
    type: "video",
    src: djsetEnzo1,
    title: "DJ Set Exclusive Live",
    subtitle: "Carica ed energia per eventi unici",
    category: "djset",
    featured: true,
  },
  {
    id: "p1",
    type: "image",
    src: fotoEnzoDjSet,
    title: "Console DJ Set",
    subtitle: "Musica e regia per la serata",
    category: "djset",
    featured: true,
  },
  {
    id: "v2",
    type: "video",
    src: videoBandSera,
    title: "Live Band Night Performance",
    subtitle: "Spettacolo e musica dal vivo",
    category: "band",
    featured: true,
  },
  {
    id: "p2",
    type: "image",
    src: fotoCantanteSera,
    title: "Esibizione Vocalist & Cantante",
    subtitle: "Emozione pura durante il party",
    category: "band",
    featured: true,
  },
  {
    id: "v3",
    type: "video",
    src: videoLuciLed,
    title: "Luci LED & Console Show",
    subtitle: "Scenografie luminose e sound system",
    category: "lightshow",
    featured: false,
  },
  {
    id: "p3",
    type: "image",
    src: cieloStellato,
    title: "Illuminazione Cielo Stellato",
    subtitle: "Atmosfera magica per la cena all'aperto",
    category: "decor",
    featured: false,
  },
  {
    id: "v4",
    type: "video",
    src: djsetEnzo2,
    title: "Party & Clubbing Vibe",
    subtitle: "Pista piena e divertimento assicurato",
    category: "djset",
    featured: false,
  },
  {
    id: "p4",
    type: "image",
    src: fotoBacioSposi,
    title: "Il Primo Bacio degli Sposi",
    subtitle: "Momento romantico accompagnato dalla musica",
    category: "wedding",
    featured: false,
  },
  {
    id: "v5",
    type: "video",
    src: videoBandGiorno,
    title: "Live Acoustics Aperitivo",
    subtitle: "Musica dal vivo elegante durante il cocktail",
    category: "band",
    featured: false,
  },
  {
    id: "p5",
    type: "image",
    src: fotoBrindisiTorta,
    title: "Brindisi & Taglio Torta",
    subtitle: "Il culmine dei festeggiamenti",
    category: "wedding",
    featured: false,
  },
  {
    id: "v6",
    type: "video",
    src: videoFumogeniPromessa,
    title: "Fumogeni & Effetti Scenografici",
    subtitle: "Effetti speciali per ingressi e momenti clou",
    category: "effects",
    featured: false,
  },
  {
    id: "p6",
    type: "image",
    src: fumogeniColor2,
    title: "Fumogeni Colorati Sposi",
    subtitle: "Esplosione di colori per un ricordo indimenticabile",
    category: "effects",
    featured: false,
  },
  {
    id: "v7",
    type: "video",
    src: djsetEnzo3,
    title: "DJ Set & Live Mix",
    subtitle: "Selezione musicale personalizzata",
    category: "djset",
    featured: false,
  },
  {
    id: "p7",
    type: "image",
    src: fotoBandAperitivo,
    title: "Band Live Aperitivo",
    subtitle: "Ritmi lounge e pop acustico",
    category: "band",
    featured: false,
  },
  {
    id: "v8",
    type: "video",
    src: videoBandSera2,
    title: "Live Show Finale",
    subtitle: "Gran finale con la band al completo",
    category: "band",
    featured: false,
  },
  {
    id: "p8",
    type: "image",
    src: fotoMusicaAperitivo,
    title: "Cocktail & Sax Vibe",
    subtitle: "Eleganza e sonorità moderne",
    category: "band",
    featured: false,
  },
  {
    id: "p9",
    type: "image",
    src: fotoBandPng,
    title: "I Nostri Musicisti",
    subtitle: "Professionisti al servizio del tuo evento",
    category: "band",
    featured: false,
  },
  {
    id: "p10",
    type: "image",
    src: fotoBandAperitivoWebp,
    title: "Accoglienza Ospiti in Musica",
    subtitle: "L'atmosfera ideale fin dai primi minuti",
    category: "band",
    featured: false,
  },
];
