import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const metaConfig = {
  it: {
    "/": {
      title: "VINCO EVENTI | DJ Set, Service Audio Luci & Allestimenti Eventi Bari Puglia",
      description: "VINCO EVENTI: Wedding Music Designer, DJ set per matrimoni e feste private a Bari e in Puglia. Service audio e luci professionale, fontane fredde Sparkular ed allestimenti per eventi esclusivi."
    },
    "/servizi": {
      title: "Servizi DJ Set & Effetti Speciali Bari Puglia | VINCO EVENTI",
      description: "Scopri i pacchetti DJ set, service audio e luci architetturale, fontane luminose fredde Sparkular ed effetti speciali per il tuo matrimonio o festa privata in Puglia."
    },
    "/galleria": {
      title: "Galleria Foto e Video Eventi Musicali Puglia | VINCO EVENTI",
      description: "Esplora i momenti più emozionanti dei nostri DJ set, matrimoni, concerti e feste private a Bari e in Puglia nella nostra galleria in alta definizione."
    },
    "/chi-siamo": {
      title: "Chi Siamo - Organizzazione Musicale Bari Puglia | VINCO EVENTI",
      description: "Scopri la storia e l'esperienza di Vincenzo Colaluca e VINCO EVENTI nell'organizzazione musicale sartoriale ed allestimenti scenografici in Puglia e in tutta Italia."
    },
    "/admin": {
      title: "Accesso Area Riservata | VINCO EVENTI",
      description: "Area di autenticazione riservata agli amministratori di VINCO EVENTI."
    },
    "/admin/preventivi": {
      title: "Gestione Preventivi Admin | VINCO EVENTI",
      description: "Pannello di controllo per la gestione ed il tracciamento delle richieste di preventivo ricevute."
    }
  },
  en: {
    "/": {
      title: "VINCO EVENTI | DJ Sets, Audio Light Service & Event Setups Bari Puglia",
      description: "VINCO EVENTI: Wedding Music Designer and exclusive DJ sets for weddings and private parties in Bari and Puglia. Professional audio/lighting service, Sparkular cold fountains & event setups."
    },
    "/servizi": {
      title: "DJ Set & Special Effects Services Bari Puglia | VINCO EVENTI",
      description: "Explore our DJ set packages, architectural lighting service, Sparkular cold spark fountains, and special effects for your luxury wedding or private event in Puglia."
    },
    "/galleria": {
      title: "Photo & Video Event Gallery Puglia | VINCO EVENTI",
      description: "Explore exciting highlights from our live DJ sets, weddings, concerts, and private parties in Bari and Puglia through our high-definition media gallery."
    },
    "/chi-siamo": {
      title: "About Us - Musical Organization Bari Puglia | VINCO EVENTI",
      description: "Discover the history and experience of Vincenzo Colaluca and VINCO EVENTI in custom musical direction and scenic setups across Puglia and Italy."
    },
    "/admin": {
      title: "Admin Reserved Login | VINCO EVENTI",
      description: "Authentication login area reserved for VINCO EVENTI administrators."
    },
    "/admin/preventivi": {
      title: "Admin Quote Management | VINCO EVENTI",
      description: "Control panel for managing and tracking received quote requests."
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

      // Aggiorna Canonical Link
      let canonicalTag = document.querySelector('link[rel="canonical"]');
      if (canonicalTag) {
        canonicalTag.setAttribute("href", `https://www.vincoeventi.it${location.pathname}`);
      }
    }
  }, [location.pathname, lang]);
}
