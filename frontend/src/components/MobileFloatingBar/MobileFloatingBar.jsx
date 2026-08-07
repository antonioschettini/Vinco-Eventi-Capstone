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
        setUserDismissed(false); // Reset dello stato di chiusura al ritorno in cima
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeVisible = isVisible && !userDismissed;

  // Gestione Gesture Swipe-Down per nascondere la barra
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

  if (!activeVisible) return null;

  return (
    <div
      className="mobile-floating-bar d-flex d-md-none flex-column p-2 shadow-lg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag Handle & Close Button */}
      <div className="floating-bar-header d-flex justify-content-between align-items-center px-1 mb-1">
        <div className="swipe-drag-handle"></div>
        <button
          onClick={handleDismiss}
          className="btn-close-floating p-0 border-0 background-none text-body-secondary"
          aria-label="Chiudi barra rapida"
          title="Chiudi"
        >
          <i className="bi bi-x-lg fs-7"></i>
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
