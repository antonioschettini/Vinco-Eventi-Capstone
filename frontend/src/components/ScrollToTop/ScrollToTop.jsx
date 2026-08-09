import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import "./ScrollToTop.css";

function ScrollToTop() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.contactForm || translations.it.contactForm;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const buttonText = t.scrollToTop || (lang === "en" ? "Back to top" : "Torna in alto");
  const ariaText = t.scrollToTopAria || (lang === "en" ? "Back to top of the page" : "Torna in alto nella pagina");

  return (
    <button
      type="button"
      className={`scroll-to-top-btn ${isVisible ? "visible" : ""}`}
      onClick={scrollToTop}
      aria-label={ariaText}
      title={buttonText}
    >
      <i className="bi bi-chevron-up scroll-top-icon"></i>
      <span className="scroll-top-text">{buttonText}</span>
    </button>
  );
}

export default ScrollToTop;
