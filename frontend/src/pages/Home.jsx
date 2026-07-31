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
      {/* Hero Section Biografia */}
      <section
        className="hero-bio-section py-5 position-relative"
        style={{ backgroundImage: `url("${bioBgImage}")` }}
      >
        <div className="hero-bio-overlay"></div>

        <div className="container hero-bio-content py-3 py-md-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8 col-xl-7">
              <div className="hero-bio-card p-4 p-md-5 rounded-4">
                <h1 className="display-4 fw-bold mb-3 font-heading text-body border-bottom border-success border-opacity-25 pb-3">
                  {t.title}
                </h1>

                <div className="fs-5 lh-lg font-body text-body-secondary mt-4">
                  <p className="mb-4 lead fw-normal text-body">{t.bioParagraph1}</p>
                  <p className="mb-4">{t.bioParagraph2}</p>
                  <p className="mb-0">{t.bioParagraph3}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intrattenimento su Misura e Artisti Section */}
      <section className="entertainment-section py-5 my-3 my-md-4">
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

          <div className="row g-4 d-flex align-items-stretch">
            {cardKeys.map((key) => {
              const card = t.cards[key];
              const image = cardImages[key];
              return (
                <div key={key} className="col-12 col-md-6 col-lg-3 d-flex">
                  <div className="entertainment-card card border-0 rounded-4 w-100 d-flex flex-column">
                    <div className="entertainment-img-wrapper">
                      <img
                        src={image}
                        alt={card.title}
                        className="entertainment-card-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="card-body p-4 d-flex flex-column flex-grow-1">
                      <h3 className="h4 font-heading fw-bold text-body mb-3">
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
      <section className="contact-instagram-section py-5 bg-body-tertiary border-top border-bottom">
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


