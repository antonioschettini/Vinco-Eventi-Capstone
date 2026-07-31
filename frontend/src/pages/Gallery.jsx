import { useSelector } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";
import { translations } from "../utils/translations";
import heroBgImage from "../assets/home/foto sfondo banner enzo.jpeg";
import GallerySection from "../components/GallerySection/GallerySection";

function Gallery() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].gallery;

  return (
    <div className="gallery-page">
      {/* 🖼️ Hero Section Galleria (Testo Sovrapposto Direttamente allo Sfondo) */}
      <section
        className="hero-gallery-section py-5 position-relative"
        style={{ backgroundImage: `url("${heroBgImage}")` }}
      >
        <div className="hero-gallery-overlay"></div>

        <Container className="hero-gallery-content text-center py-4 py-md-5">
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={9}>
              <h1 className="display-3 fw-bold mb-4 font-heading text-body hero-gallery-title">
                {t.heroTitle}
              </h1>
              <p className="lead fs-4 font-body text-body-secondary mb-0 hero-gallery-subtitle max-w-700 mx-auto">
                {t.heroSubtitle}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 🎬 Sezione Caroselli e Griglia Multimediale */}
      <GallerySection />
    </div>
  );
}

export default Gallery;
