import { useSelector } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { translations } from "../utils/translations";
import LocationMap from "../components/LocationMap/LocationMap";
import MatrimonioWidgets from "../components/MatrimonioWidgets/MatrimonioWidgets";
const heroBgImage = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786265144/vinco_eventi_assets/jgj8b2jhbeaervxidek4.jpg";
const storyImage = "https://res.cloudinary.com/oe1bztwb/image/upload/v1786265143/vinco_eventi_assets/jduafvl0hcqgjhcyzoxb.jpg";
import useScrollReveal from "../utils/useScrollReveal";
import "./About.css";

function About() {
  useScrollReveal(".stat-card, .pillar-card, .hero-gallery-section, .about-quote-wrapper");
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].about;
  const navigate = useNavigate();

  const handleCtaClick = () => {
    navigate("/", { state: { scrollToForm: true } });
  };

  return (
    <div className="about-page">
      {/* 1. 🖼️ HERO SECTION (Stessa UI/UX della Galleria: Testo Sovrapposto Direttamente allo Sfondo, Sfondo foto enzo dj set.jpeg) */}
      <section
        className="hero-gallery-section py-5 position-relative"
        style={{ backgroundImage: `url("${heroBgImage}")` }}
      >
        <div className="hero-gallery-overlay"></div>

        <Container className="hero-gallery-content text-center py-4 py-md-5">
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={9}>
              <h1 className="display-3 fw-bold mb-4 font-heading text-body hero-gallery-title">
                {t.title}
              </h1>
              <p className="lead fs-4 font-body text-body-secondary mb-0 hero-gallery-subtitle max-w-700 mx-auto">
                {t.subtitle}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 2. SEZIONE STORIA & VISIONE AZIENDALE */}
      <section className="about-story-section py-5 my-3 my-md-4">
        <Container className="py-2">
          <Row className="g-4 g-lg-5 align-items-center mb-5">
            {/* Foto Vincenzo Colaluca / VINCO EVENTI */}
            <Col xs={12} lg={6}>
              <div className="story-img-wrapper">
                <img
                  src={storyImage}
                  alt="Vincenzo Colaluca - VINCO EVENTI"
                  loading="lazy"
                />
              </div>
            </Col>

            {/* Testo Descrittivo */}
            <Col xs={12} lg={6}>
              <div className="story-content">
                <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill font-body fw-semibold text-uppercase tracking-wider mb-2">
                  <i className="bi bi-patch-check-fill me-1"></i> VINCO EVENTI Story
                </span>
                <h2 className="display-5 font-heading text-body fw-bold mb-4">
                  {t.storyTitle}
                </h2>
                <p className="lead font-body text-body fw-medium mb-4">
                  {t.storySub}
                </p>
                <div className="font-body text-body-secondary fs-6 lh-lg d-flex flex-column gap-3 mb-0">
                  <p className="mb-0">{t.storyP1}</p>
                  <p className="mb-0">{t.storyP2}</p>
                  <p className="mb-0">{t.storyP3}</p>
                </div>
              </div>
            </Col>
          </Row>

          {/* Griglia Contatori & Statistiche Chiave */}
          <Row className="g-3 g-md-4 justify-content-center align-items-stretch mt-3">
            <Col xs={6} lg={3}>
              <div className="stat-card">
                <div className="stat-number mb-2">{t.stats.years}</div>
                <div className="stat-label small font-body text-body-secondary fw-semibold text-uppercase">
                  {t.stats.yearsLabel}
                </div>
              </div>
            </Col>
            <Col xs={6} lg={3}>
              <div className="stat-card">
                <div className="stat-number mb-2">{t.stats.reviews}</div>
                <div className="stat-label small font-body text-body-secondary fw-semibold text-uppercase">
                  {t.stats.reviewsLabel}
                </div>
              </div>
            </Col>
            <Col xs={6} lg={3}>
              <div className="stat-card">
                <div className="stat-number mb-2">{t.stats.events}</div>
                <div className="stat-label small font-body text-body-secondary fw-semibold text-uppercase">
                  {t.stats.eventsLabel}
                </div>
              </div>
            </Col>
            <Col xs={6} lg={3}>
              <div className="stat-card">
                <div className="stat-number mb-2">{t.stats.artists}</div>
                <div className="stat-label small font-body text-body-secondary fw-semibold text-uppercase">
                  {t.stats.artistsLabel}
                </div>
              </div>
            </Col>
          </Row>

          {/* Citazione Ezio Bosso */}
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={9}>
              <div className="about-quote-wrapper">
                <i className="bi bi-quote about-quote-icon"></i>
                <blockquote className="about-quote-text">
                  {t.quoteText}
                </blockquote>
                <cite className="about-quote-author">
                  {t.quoteAuthor}
                </cite>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 3. SEZIONE I NOSTRI PILASTRI FONDAMENTALI */}
      <section className="about-pillars-section py-5 bg-body-tertiary border-top border-bottom">
        <Container className="py-2">
          <Row className="justify-content-center text-center mb-4 mb-md-5">
            <Col xs={12} lg={9} xl={8}>
              <h2 className="display-5 font-heading text-body fw-bold mb-3">
                {t.pillarsTitle}
              </h2>
              <p className="font-body text-body-secondary fs-5 lead mb-0">
                {t.pillarsSub}
              </p>
            </Col>
          </Row>

          <Row className="g-4 align-items-stretch">
            {/* Pilastro 1 */}
            <Col xs={12} md={6} lg={3}>
              <div className="pillar-card">
                <div className="pillar-icon-box">
                  <i className="bi bi-music-note-beamed"></i>
                </div>
                <h3 className="h5 font-heading text-body fw-bold mb-3">
                  {t.pillars.p1Title}
                </h3>
                <p className="font-body text-body-secondary fs-6 mb-0 lh-base">
                  {t.pillars.p1Desc}
                </p>
              </div>
            </Col>

            {/* Pilastro 2 */}
            <Col xs={12} md={6} lg={3}>
              <div className="pillar-card">
                <div className="pillar-icon-box">
                  <i className="bi bi-people-fill"></i>
                </div>
                <h3 className="h5 font-heading text-body fw-bold mb-3">
                  {t.pillars.p2Title}
                </h3>
                <p className="font-body text-body-secondary fs-6 mb-0 lh-base">
                  {t.pillars.p2Desc}
                </p>
              </div>
            </Col>

            {/* Pilastro 3 */}
            <Col xs={12} md={6} lg={3}>
              <div className="pillar-card">
                <div className="pillar-icon-box">
                  <i className="bi bi-sliders"></i>
                </div>
                <h3 className="h5 font-heading text-body fw-bold mb-3">
                  {t.pillars.p3Title}
                </h3>
                <p className="font-body text-body-secondary fs-6 mb-0 lh-base">
                  {t.pillars.p3Desc}
                </p>
              </div>
            </Col>

            {/* Pilastro 4 */}
            <Col xs={12} md={6} lg={3}>
              <div className="pillar-card">
                <div className="pillar-icon-box">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h3 className="h5 font-heading text-body fw-bold mb-3">
                  {t.pillars.p4Title}
                </h3>
                <p className="font-body text-body-secondary fs-6 mb-0 lh-base">
                  {t.pillars.p4Desc}
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 4. SEZIONE MAPPA E DOVE SIAMO */}
      <LocationMap />

      {/* 5. SEZIONE RIPROVA SOCIALE (RECENSIONI & BADGE MATRIMONIO.COM) SUBITO SOTTO LA MAPPA */}
      <MatrimonioWidgets />

      {/* 6. CALL TO ACTION SECTION */}
      <section className="about-cta-section py-5 my-4 my-md-5">
        <Container className="py-2">
          <Row className="justify-content-center text-center">
            <Col xs={12} lg={10} xl={9}>
              <div className="cta-banner">
                <h2 className="display-5 font-heading text-body fw-bold mb-3">
                  {t.ctaTitle}
                </h2>
                <p className="font-body text-body-secondary fs-5 lead mb-4 max-w-700 mx-auto">
                  {t.ctaSub}
                </p>
                <button
                  onClick={handleCtaClick}
                  className="btn-cta-quote"
                >
                  <i className="bi bi-envelope-check-fill"></i>
                  <span>{t.ctaBtn}</span>
                </button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default About;
