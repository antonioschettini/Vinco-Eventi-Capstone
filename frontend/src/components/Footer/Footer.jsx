import { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { translations } from "../../utils/translations";
import footerBgImage from "../../assets/Vinco Eventi assets/assets immagini/Consolle e cuffia.webp";
import useScrollReveal from "../../utils/useScrollReveal";
import "./Footer.css";

import { handleEmailClick, handlePhoneClick } from "../../utils/contactHelpers";

function Footer() {
  useScrollReveal(".footer-section, .footer-glass-card");
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.footer || translations.it.footer;
  
  const footerRef = useRef(null);
  const [isIlluminated, setIsIlluminated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          setIsIlluminated(true);
        } else {
          setIsIlluminated(false);
        }
      },
      { threshold: [0.05, 0.1, 0.3] }
    );

    const node = footerRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) {
        observer.unobserve(node);
      }
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      className={`footer-section py-5 mt-auto position-relative ${isIlluminated ? "illuminated" : ""}`}
      style={{ backgroundImage: `url("${footerBgImage}")` }}
    >
      <div className="footer-overlay"></div>
      <Container className="footer-content text-center position-relative">
        <Row className="justify-content-center text-center">
          <Col xs={12} md={9} lg={7} xl={6}>
            <div className="footer-glass-card">
              {/* Nome Azienda */}
              <h2 className="footer-title mb-4 font-heading">VINCO EVENTI</h2>

              {/* Dati Aziendali */}
              <div className="company-info mb-4 d-flex flex-column gap-2">
                <p className="mb-0">
                  <i className="bi bi-geo-alt-fill me-2 text-forest"></i>
                  {t.address}
                </p>
                <p className="mb-0">
                  <i className="bi bi-file-earmark-text-fill me-2 text-forest"></i>
                  {t.piva}
                </p>
                <p className="mb-0">
                  <i className="bi bi-telephone-fill me-2 text-forest"></i>
                  <a
                    href={`tel:${t.phone.replace(/[^\d+]/g, "")}`}
                    onClick={(e) => handlePhoneClick(e, t.phone)}
                    className="info-link"
                  >
                    {t.phone}
                  </a>
                </p>
                <p className="mb-0">
                  <i className="bi bi-envelope-fill me-2 text-forest"></i>
                  <a
                    href={`mailto:${t.email}`}
                    onClick={(e) => handleEmailClick(e, t.email, dispatch)}
                    className="info-link"
                  >
                    {t.email}
                  </a>
                </p>
              </div>

              {/* Icone Social con Deep Linking Nattivo App iOS/Android & Desktop */}
              <div className="social-icons-wrapper d-flex justify-content-center align-items-center gap-3 mb-4">
                {/* Spotify */}
                <a
                  href="https://open.spotify.com/intl-it/artist/1QoaebxELudkw4ga0DH9YI?si=T6l1kxj9SwWHSoGXsbIvxA&dl_branch=1&nd=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn spotify text-decoration-none"
                  aria-label="Spotify"
                  title="Spotify"
                >
                  <i className="bi bi-spotify"></i>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/vincoeventi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn instagram text-decoration-none"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <i className="bi bi-instagram"></i>
                </a>

                {/* Matrimonio.com */}
                <a
                  href="https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn matrimonio text-decoration-none"
                  aria-label="Matrimonio.com"
                  title="Matrimonio.com"
                >
                  <i className="bi bi-heart-fill"></i>
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@vincoeventi?_r=1&_t=ZN-98OJ7oPdBVG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn tiktok text-decoration-none"
                  aria-label="TikTok"
                  title="TikTok"
                >
                  <i className="bi bi-tiktok"></i>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/393492949669"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn whatsapp text-decoration-none"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <i className="bi bi-whatsapp"></i>
                </a>

                {/* Mixcloud */}
                <a
                  href="https://www.mixcloud.com/djcolaluca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn mixcloud text-decoration-none"
                  aria-label="Mixcloud"
                  title="Mixcloud"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 512"
                    className="mixcloud-svg"
                    fill="currentColor"
                    width="16"
                    height="16"
                  >
                    <path d="M212.98 346.566H179.789V195.114L185.973 173.47H175.262L137.127 346.566H76.1069L37.7323 173.47H27.276L33.1913 195.114V346.566H0V165H65.6506L102.248 338.096H110.747L147.329 165H212.98L212.98 346.566ZM544.459 283.589L458.434 345.655V307.534L531.329 255.776L458.434 204.017V165.896L544.459 228.231H553.721L640 165.896V204.017L566.866 255.776L640 307.549V345.655L553.721 283.589H544.459ZM430.157 272.311H248.113V239.255H430.157V272.311Z" />
                  </svg>
                </a>
              </div>

              {/* Diritti Riservati */}
              <div className="copyright footer-copyright-divider pt-4 mt-2">
                <p className="footer-copyright-text small mb-0">{t.rights}</p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
