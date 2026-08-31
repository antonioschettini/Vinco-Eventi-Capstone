import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { translations } from "../../utils/translations";
import { handlePhoneClick } from "../../utils/contactHelpers";
import { triggerHapticFeedback } from "../../utils/vibration";
import "./MobileFloatingBar.css";

function MobileFloatingBar() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.footer || translations.it.footer;
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 180) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Chiude il menu radiale al click esterno
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    triggerHapticFeedback(15);
    setIsOpen((prev) => !prev);
  };

  const handleAction = () => {
    triggerHapticFeedback(15);
    setIsOpen(false);
  };

  if (isAdminRoute || !isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="mobile-speed-dial d-flex d-md-none position-fixed"
    >
      {/* Menu Azioni Diramate Verso l'Alto */}
      <div className={`speed-dial-actions d-flex flex-column gap-2 ${isOpen ? "open" : ""}`}>
        {/* Pulsante Chiama Ora */}
        <a
          href="tel:+393492949669"
          onClick={(e) => {
            handleAction();
            handlePhoneClick(e, "+393492949669");
          }}
          className="speed-dial-action-btn btn-phone"
          aria-label="Chiama Ora"
          title={t.callNow || "Chiama Ora"}
        >
          <i className="bi bi-telephone-fill"></i>
          <span className="action-tooltip">{t.callNow || "Chiama"}</span>
        </a>

        {/* Pulsante WhatsApp */}
        <a
          href="https://wa.me/393492949669"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAction}
          className="speed-dial-action-btn btn-whatsapp"
          aria-label="Contatta su WhatsApp"
          title="WhatsApp"
        >
          <i className="bi bi-whatsapp"></i>
          <span className="action-tooltip">WhatsApp</span>
        </a>
      </div>

      {/* Pulsante Principale Trigger (Bottom Left) */}
      <button
        onClick={handleToggle}
        className={`speed-dial-trigger-btn d-flex align-items-center justify-content-center shadow-lg ${
          isOpen ? "open" : ""
        }`}
        aria-label="Opzioni di contatto rapido"
        title="Contatto Rapido"
      >
        <i className={`bi ${isOpen ? "bi-x-lg" : "bi-chat-dots-fill"} trigger-icon`}></i>
      </button>
    </div>
  );
}

export default MobileFloatingBar;
