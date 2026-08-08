import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const metaConfig = {
  it: {
    "/": {
      title: "VINCO EVENTI | DJ Set, Service Audio Luci & Spettacoli Musicali Bari Puglia",
      description: "VINCO EVENTI: Wedding Music Designer & DJ Set d'eccellenza in Puglia. Service Audio-Luci scenografico, fontane fredde Sparkular ed allestimenti musicali per matrimoni ed eventi esclusivi a Bari."
    },
    "/servizi": {
      title: "Service Audio Luci, DJ Set & Effetti Speciali Puglia | VINCO EVENTI",
      description: "Scopri i pacchetti DJ set, service audio e illuminazione scenografica, fontane luminose fredde Sparkular ed allestimenti spettacoli per matrimoni e feste in Puglia."
    },
    "/galleria": {
      title: "Galleria Spettacoli Musicali & Service Eventi Puglia | VINCO EVENTI",
      description: "Esplora le foto ed i video dei nostri DJ set, service audio-luci scenografico e spettacoli per matrimoni ed eventi esclusivi in Puglia."
    },
    "/chi-siamo": {
      title: "Chi Siamo - Direzione Musicale & Service Spettacoli | VINCO EVENTI",
      description: "Scopri l'esperienza di Vincenzo Colaluca e VINCO EVENTI nella regia musicale sartoriale, service audio e luci scenografico in Puglia e in tutta Italia."
    },
    "/admin-enzo": {
      title: "Accesso Area Riservata | VINCO EVENTI",
      description: "Area di autenticazione riservata agli amministratori di VINCO EVENTI."
    },
    "/admin-enzo/preventivi": {
      title: "Gestione Preventivi Admin | VINCO EVENTI",
      description: "Pannello di controllo per la gestione ed il tracciamento delle richieste di preventivo ricevute."
    },
    "/admin-enzo/agenda": {
      title: "Agenda Contabile & Eventi Admin | VINCO EVENTI",
      description: "Pannello di controllo per la gestione del registro contabile, scadenze e calendario eventi."
    },
    "/admin-enzo/audit": {
      title: "Audit & Log di Sistema Admin | VINCO EVENTI",
      description: "Pannello di controllo per l'analisi dei log, visite, avvisi e tracciamento delle attività di sistema."
    }
  },
  en: {
    "/": {
      title: "VINCO EVENTI | DJ Sets, Audio Light Service & Musical Production Bari Puglia",
      description: "VINCO EVENTI: Wedding Music Designer & exclusive DJ sets in Puglia. Scenic Audio-Lighting service, Sparkular cold spark fountains & musical event setups in Bari."
    },
    "/servizi": {
      title: "Audio Lighting Service, DJ Sets & Special Effects | VINCO EVENTI",
      description: "Explore our DJ set packages, architectural lighting service, Sparkular cold spark fountains, and musical stage production for luxury weddings & events in Puglia."
    },
    "/galleria": {
      title: "Musical Show & Lighting Service Gallery | VINCO EVENTI",
      description: "Explore photos and videos from our live DJ sets, weddings, concerts, and scenic audio-lighting event setups in Bari and Puglia."
    },
    "/chi-siamo": {
      title: "About Us - Musical Direction & Event Production | VINCO EVENTI",
      description: "Discover Vincenzo Colaluca and VINCO EVENTI's experience in bespoke musical direction and stage audio-lighting setup across Puglia and Italy."
    },
    "/admin-enzo": {
      title: "Admin Reserved Login | VINCO EVENTI",
      description: "Authentication login area reserved for VINCO EVENTI administrators."
    },
    "/admin-enzo/preventivi": {
      title: "Admin Quote Management | VINCO EVENTI",
      description: "Control panel for managing and tracking received quote requests."
    },
    "/admin-enzo/agenda": {
      title: "Admin Accounting & Events Agenda | VINCO EVENTI",
      description: "Control panel for managing financial records, event calendar, and income reports."
    },
    "/admin-enzo/audit": {
      title: "Admin System Audit & Logs | VINCO EVENTI",
      description: "Control panel for monitoring system logs, visits, security warnings, and activity records."
    }
  }
};

export function useSEO() {
  const location = useLocation();
  const lang = useSelector((state) => state.ui.language) || "it";

  useEffect(() => {
    // 1. Aggiorna l'attributo lang del tag html per l'accessibilità WCAG / screen reader
    document.documentElement.setAttribute("lang", lang);

    // 2. Recupera i dati meta per la rotta ed il linguaggio corrente
    const pageMeta = metaConfig[lang]?.[location.pathname] || metaConfig[lang]?.["/"];

    if (pageMeta) {
      document.title = pageMeta.title;

      // Aggiorna meta description
      let descTag = document.querySelector('meta[name="description"]');
      if (descTag) {
        descTag.setAttribute("content", pageMeta.description);
      }

      // Aggiorna OpenGraph title e description
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute("content", pageMeta.title);
      }

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute("content", pageMeta.description);
      }

      // Aggiorna Twitter Title & Description
      let twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) {
        twTitle.setAttribute("content", pageMeta.title);
      }
      let twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) {
        twDesc.setAttribute("content", pageMeta.description);
      }

      let canonicalTag = document.querySelector('link[rel="canonical"]');
      if (canonicalTag) {
        canonicalTag.setAttribute("href", `https://www.vincoeventi.com${location.pathname}`);
      }
    }
  }, [location.pathname, lang]);
}
