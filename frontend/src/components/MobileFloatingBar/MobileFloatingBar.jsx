import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import { handlePhoneClick } from "../../utils/contactHelpers";
import { triggerHapticFeedback } from "../../utils/vibration";
import "./MobileFloatingBar.css";

function MobileFloatingBar() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.footer || translations.it.footer;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostra la barra mobile soltanto dopo aver scorretto 180px verso il basso
      if (window.scrollY > 180) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="mobile-floating-bar d-flex d-md-none justify-content-between align-items-center gap-2 p-2 shadow-lg border-top">
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
        <span>{t.callNow || "Chiama"}</span>
      </a>
    </div>
  );
}

export default MobileFloatingBar;
