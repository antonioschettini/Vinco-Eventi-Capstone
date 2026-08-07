import { Container, Row, Col } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { translations } from "../../utils/translations";
const footerBgImage = "https://res.cloudinary.com/ytjdxerb/image/upload/v1786087542/vinco_eventi_assets/grx32y3fmenjhcwk1god.webp";
import "./Footer.css";

import { handleEmailClick, handlePhoneClick } from "../../utils/contactHelpers";

function Footer() {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].footer;

  // Gestione del click per i social
  const handleSocialClick = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <footer
      className="footer-section py-5 mt-auto position-relative"
      style={{ backgroundImage: `url("${footerBgImage}")` }}
    >
      <div className="footer-overlay"></div>
      <Container className="footer-content text-center position-relative">
        <Row className="justify-content-center text-center">
          <Col xs={12} md={8} lg={6}>
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

            {/* Icone Social */}
            <div className="social-icons-wrapper d-flex justify-content-center align-items-center gap-3 mb-4">
              {/* Spotify */}
              <button
                onClick={() => handleSocialClick("https://open.spotify.com/intl-it/artist/1QoaebxELudkw4ga0DH9YI?si=T6l1kxj9SwWHSoGXsbIvxA&dl_branch=1&nd=1")}
                className="social-btn spotify"
                aria-label="Spotify"
                title="Spotify"
              >
                <i className="bi bi-spotify"></i>
              </button>

              {/* Instagram */}
              <button
                onClick={() => handleSocialClick("https://www.instagram.com/vincoeventi/")}
                className="social-btn instagram"
                aria-label="Instagram"
                title="Instagram"
              >
                <i className="bi bi-instagram"></i>
              </button>

              {/* Matrimonio.com */}
              <button
                onClick={() => handleSocialClick("https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893")}
                className="social-btn matrimonio"
                aria-label="Matrimonio.com"
                title="Matrimonio.com"
              >
                <i className="bi bi-heart-fill"></i>
              </button>

              {/* TikTok */}
              <button
                onClick={() => handleSocialClick("https://www.tiktok.com/@vincoeventi?_r=1&_t=ZN-98OJ7oPdBVG")}
                className="social-btn tiktok"
                aria-label="TikTok"
                title="TikTok"
              >
                <i className="bi bi-tiktok"></i>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleSocialClick("https://wa.me/393492949669")}
                className="social-btn whatsapp"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <i className="bi bi-whatsapp"></i>
              </button>

              {/* Mixcloud (SVG personalizzato per fedeltà al brand) */}
              <button
                onClick={() => handleSocialClick("https://www.mixcloud.com/djcolaluca/")}
                className="social-btn mixcloud"
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
                  <path d="M589.6 240c0-111.4-86.4-201.7-193-201.7-87.7 0-161.7 62-185 146.4-18.7-27-48.4-44.4-82-44.4-53.5 0-97.4 43.9-97.4 97.4s43.9 97.4 97.4 97.4c29.1 0 55-13.1 72.8-33.8 23 85.9 98.4 149.2 188.7 149.2 106.6 0 193-90.3 193-201.7 0-3.3-.2-6.6-.5-9.8zm-449.2 41c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zm184.6-26.6c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zm92.3 80c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zm92.3-80c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z" />
                </svg>
              </button>
            </div>

            {/* Diritti Riservati */}
            <div className="copyright border-top border-secondary border-opacity-10 pt-4 mt-2">
              <p className="text-muted small mb-0">{t.rights}</p>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
