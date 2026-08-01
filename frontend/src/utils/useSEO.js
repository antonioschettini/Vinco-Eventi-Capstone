import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const metaConfig = {
  it: {
    "/": {
      title: "VINCO EVENTI | DJ Set, Service Audio Luci & Allestimenti Eventi",
      description: "Vinco Eventi offre DJ set esclusivi, service audio e luci professionale, effetti speciali Sparkular, fontane fredde ed allestimenti per matrimoni, feste private ed eventi aziendali."
    },
    "/servizi": {
      title: "Servizi ed Effetti Speciali | VINCO EVENTI",
      description: "Scopri i nostri pacchetti DJ set, service audio e illuminazione architetturale, fontane fredde Sparkular, ed effetti speciali per il tuo evento."
    },
    "/galleria": {
      title: "Galleria Foto e Video Eventi | VINCO EVENTI",
      description: "Esplora i momenti più emozionanti dei nostri eventi, matrimoni e feste private attraverso la nostra galleria di foto e video in alta definizione."
    },
    "/chi-siamo": {
      title: "Chi Siamo | VINCO EVENTI",
      description: "Scopri la storia, la passione e la professionalità di Vinco Eventi nell'organizzazione di intrattenimento musicale ed allestimenti scenografici."
    },
    "/admin": {
      title: "Accesso Area Riservata | VINCO EVENTI",
      description: "Area di autenticazione riservata agli amministratori di Vinco Eventi."
    },
    "/admin/preventivi": {
      title: "Gestione Preventivi Admin | VINCO EVENTI",
      description: "Pannello di controllo per la gestione ed il tracciamento delle richieste di preventivo ricevute."
    }
  },
  en: {
    "/": {
      title: "VINCO EVENTI | DJ Sets, Audio Light Service & Event Setups",
      description: "Vinco Eventi offers exclusive DJ sets, professional audio and lighting service, Sparkular cold spark effects, and setups for weddings, private parties, and corporate events."
    },
    "/servizi": {
      title: "Services & Special Effects | VINCO EVENTI",
      description: "Explore our DJ set packages, audio & architectural lighting service, Sparkular cold fountains, and special effects for your event."
    },
    "/galleria": {
      title: "Photo & Video Event Gallery | VINCO EVENTI",
      description: "Explore the most exciting moments of our events, weddings, and private parties through our high-definition photo and video gallery."
    },
    "/chi-siamo": {
      title: "About Us | VINCO EVENTI",
      description: "Discover the history, passion, and professionalism of Vinco Eventi in musical entertainment and scenic event setups."
    },
    "/admin": {
      title: "Admin Reserved Login | VINCO EVENTI",
      description: "Authentication login area reserved for Vinco Eventi administrators."
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
