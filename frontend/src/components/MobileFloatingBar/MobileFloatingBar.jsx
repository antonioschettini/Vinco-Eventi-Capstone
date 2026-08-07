import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import { handlePhoneClick } from "../../utils/contactHelpers";
import { triggerHapticFeedback } from "../../utils/vibration";
import "./MobileFloatingBar.css";

function MobileFloatingBar() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.footer || translations.it.footer;
  const [isVisible, setIsVisible] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  const touchStartY = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Mostra la barra mobile soltanto dopo aver scorretto 180px verso il basso
      if (window.scrollY > 180) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setUserDismissed(false); // Reset dello stato di chiusura manuale al ritorno in cima
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeVisible = isVisible && !userDismissed;

  // Sincronizza la classe .has-floating-bar sul body per traslare in alto il player audio
  useEffect(() => {
    if (activeVisible) {
      document.body.classList.add("has-floating-bar");
    } else {
      document.body.classList.remove("has-floating-bar");
    }

    return () => {
      document.body.classList.remove("has-floating-bar");
    };
  }, [activeVisible]);

  // Gestione Gesture Swipe-Down per nascondere rapidamente la barra
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartY.current || !e.changedTouches || e.changedTouches.length === 0) return;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    if (diffY > 30) {
      triggerHapticFeedback(15);
      setUserDismissed(true);
    }
    touchStartY.current = null;
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    triggerHapticFeedback(12);
    setUserDismissed(true);
  };

  // Se l'utente l'ha chiusa manualmente mentre si trova a metà pagina, mostra un piccolo badge di riapertura rapida
  if (isVisible && userDismissed) {
    return (
      <button
        onClick={() => {
          triggerHapticFeedback(12);
          setUserDismissed(false);
        }}
        className="btn-reopen-floating-bar d-flex d-md-none align-items-center justify-content-center"
        aria-label="Apri opzioni di contatto rapido"
        title="Contatto Rapido"
      >
        <i className="bi bi-chat-dots-fill"></i>
      </button>
    );
  }

  if (!activeVisible) return null;

  return (
    <div
      className="mobile-floating-bar d-flex d-md-none flex-column p-2 shadow-lg border-top"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Down Handle & Dismiss Button */}
      <div className="floating-bar-header d-flex justify-content-between align-items-center px-1 mb-1">
        <div className="swipe-drag-handle"></div>
        <button
          onClick={handleDismiss}
          className="btn-close-floating p-0 border-0 background-none text-body-secondary"
          aria-label="Riduci barra rapida"
          title="Riduci"
        >
          <i className="bi bi-chevron-down fs-7"></i>
        </button>
      </div>

      <div className="d-flex justify-content-between align-items-center gap-2">
        {/* Pulsante WhatsApp Diretto */}
        <a
          href="https://wa.me/393492949669"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHapticFeedback(15)}
          className="btn btn-floating-bar btn-whatsapp-floating flex-grow-1 d-flex align-items-center justify-content-center gap-2 rounded-pill font-body fw-bold py-2 px-3 text-white text-decoration-none"
        >
          <i className="bi bi-whatsapp fs-5"></i>
          <span>WhatsApp</span>
        </a>

        {/* Pulsante Chiama Ora */}
        <a
          href="tel:+393492949669"
          onClick={(e) => {
            triggerHapticFeedback(15);
            handlePhoneClick(e, "+393492949669");
          }}
          className="btn btn-floating-bar btn-phone-floating flex-grow-1 d-flex align-items-center justify-content-center gap-2 rounded-pill font-body fw-bold py-2 px-3 text-white text-decoration-none"
        >
          <i className="bi bi-telephone-fill fs-6"></i>
          <span>{t.callNow || "Chiama Ora"}</span>
        </a>
      </div>
    </div>
  );
}

export default MobileFloatingBar;
