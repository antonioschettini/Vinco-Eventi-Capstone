import { useSelector } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";
import { translations } from "../utils/translations";
import bioBgImage from "../assets/home/foto per sfondo bio.jpeg";

import cerimoniaImg from "../assets/home/14. fumogeni color.jpg";
import aperitivoImg from "../assets/home/foto intrattenimento aperitivo.jpeg";
import pranzoCenaImg from "../assets/home/foto band sera.jpg";
import afterPartyImg from "../assets/home/dancefloor.webp";

import InstagramMockup from "../components/InstagramMockup/InstagramMockup";
import ContactForm from "../components/ContactForm/ContactForm";

function Home() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].home;

  const cardImages = {
    cerimonia: cerimoniaImg,
    aperitivo: aperitivoImg,
    pranzoCena: pranzoCenaImg,
    afterParty: afterPartyImg,
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

      {/* Intrattenimento su Misura e Artisti Section */}
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
              return (
                <div key={key} className="col-12 col-sm-6 col-xxl-3 d-flex">
                  <div className="entertainment-card card border-0 rounded-4 w-100 d-flex flex-column">
                    <div className={`entertainment-img-wrapper entertainment-img-wrapper--${key}`}>
                      <img
                        src={image}
                        alt={card.title}
                        className={`entertainment-card-img entertainment-card-img--${key}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="card-body p-3 p-xl-4 d-flex flex-column flex-grow-1">
                      <h3 className="h4 font-heading fw-bold text-body mb-2 mb-xl-3">
                        {card.title}
                      </h3>
                      <p className="font-body text-body-secondary fs-6 mb-0 lh-base flex-grow-1">
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
            {/* Colonna Sinistra: Instagram Smartphone Mockup */}
            <Col xs={12} lg={5} xl={5} className="d-flex justify-content-center">
              <InstagramMockup />
            </Col>

            {/* Colonna Destra: Form di Contatto */}
            <Col xs={12} lg={7} xl={7}>
              <ContactForm />
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default Home;


