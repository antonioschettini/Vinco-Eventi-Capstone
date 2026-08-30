import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { translations } from "../utils/translations";
import bioBgImage from "../assets/Vinco Eventi assets/assets immagini/Biografia HeroSection Dj colaluca bn.webp";

import cerimoniaImg from "../assets/Vinco Eventi assets/assets immagini/fumogeni cerimonia.webp";
import aperitivoImg from "../assets/Vinco Eventi assets/assets immagini/aperitivo swing band.webp";
import pranzoCenaImg from "../assets/Vinco Eventi assets/assets immagini/violino & sax led show.webp";
import afterPartyImg from "../assets/Vinco Eventi assets/assets immagini/dancefloor 3d.webp";

import InstagramMockup from "../components/InstagramMockup/InstagramMockup";
import ContactForm from "../components/ContactForm/ContactForm";
import useScrollReveal from "../utils/useScrollReveal";

function Home() {
  useScrollReveal();
  const location = useLocation();
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].home;

  useEffect(() => {
    if (location.state?.scrollToForm) {
      const timer = setTimeout(() => {
        const formElement = document.querySelector(".contact-form-wrapper");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const cardImages = {
    cerimonia: cerimoniaImg,
    aperitivo: aperitivoImg,
    pranzoCena: pranzoCenaImg,
    afterParty: afterPartyImg,
  };

  const cardMetadata = {
    cerimonia: { step: "01", icon: "bi-suit-heart-fill" },
    aperitivo: { step: "02", icon: "bi-cup-straw" },
    pranzoCena: { step: "03", icon: "bi-music-note-beamed" },
    afterParty: { step: "04", icon: "bi-stars" },
  };

  const cardKeys = ["cerimonia", "aperitivo", "pranzoCena", "afterParty"];

  return (
    <div className="homepage">
      {/* Hero Section Biografia (Testo Sovrapposto Direttamente allo Sfondo) */}
      <section
        className="hero-gallery-section hero-home-section py-5 position-relative"
        style={{ backgroundImage: `url("${bioBgImage}")` }}
      >
        <div className="hero-gallery-overlay"></div>

        <Container className="hero-gallery-content text-center py-4 py-md-5">
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={9}>
              <h1 className="display-3 fw-bold mb-4 font-heading text-body hero-gallery-title">
                {t.title}
              </h1>
              <div className="fs-5 lh-lg font-body text-body-secondary hero-gallery-subtitle max-w-800 mx-auto">
                <p className="mb-4 lead fw-normal text-body">{t.bioParagraph1}</p>
                <p className="mb-4">{t.bioParagraph2}</p>
                <p className="mb-0">{t.bioParagraph3}</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Intrattenimento su Misura e Artisti Section (Opzione A: Editorial Poster Full-Bleed) */}
      <section className="entertainment-section py-5">
        <div className="container py-3">
          <div className="row justify-content-center mb-5">
            <div className="col-12 col-lg-10 text-center">
              <h2 className="display-5 font-heading text-body fw-bold mb-4 entertainment-title">
                {t.entertainmentTitle}
              </h2>
              <div className="fs-5 font-body text-body-secondary mt-3">
                <p className="mb-3 lead text-body fw-medium">{t.entertainmentIntro1}</p>
                <p className="mb-0">{t.entertainmentIntro2}</p>
              </div>
            </div>
          </div>

          <div className="row g-4 g-xl-3 align-items-stretch">
            {cardKeys.map((key) => {
              const card = t.cards[key];
              const image = cardImages[key];
              const meta = cardMetadata[key];
              return (
                <div key={key} className="col-12 col-md-6 col-xxl-3 d-flex">
                  <div className="entertainment-card luxury-card card border-0 rounded-4 w-100 d-flex flex-column overflow-hidden">
                    <div className={`entertainment-img-wrapper entertainment-img-wrapper--${key} position-relative overflow-hidden`}>
                      <img
                        src={image}
                        alt={card.title}
                        className={`entertainment-card-img entertainment-card-img--${key}`}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="poster-card-top-badge">
                        <span className="poster-step-pill">
                          <i className={`bi ${meta.icon} me-1`}></i>
                          <span>{meta.step}</span>
                        </span>
                      </div>
                    </div>
                    <div className="luxury-card-body p-3 p-xl-4 d-flex flex-column flex-grow-1">
                      <h3 className="luxury-card-title font-heading fw-bold mb-2">
                        {card.title}
                      </h3>
                      <div className="luxury-title-divider mb-3"></div>
                      <p className="luxury-card-text font-body mb-0 lh-base flex-grow-1">
                        {card.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sezione Instagram Mockup + Form di Contatto */}
      <section className="contact-instagram-section py-5">
        <Container className="py-3 py-md-4">
          <Row className="g-4 g-lg-5 align-items-center">
            {/* Colonna Smartphone Mockup (Sinistra su desktop, Sotto al form su mobile) */}
            <Col xs={12} lg={5} xl={5} className="d-flex justify-content-center order-2 order-lg-1">
              <InstagramMockup />
            </Col>

            {/* Colonna Form di Contatto (Destra su desktop, Sopra allo smartphone su mobile) */}
            <Col xs={12} lg={7} xl={7} className="order-1 order-lg-2">
              <ContactForm />
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default Home;


