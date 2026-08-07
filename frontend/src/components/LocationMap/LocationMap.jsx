import { Container, Row, Col } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { translations } from "../../utils/translations";
import { handleEmailClick, handlePhoneClick } from "../../utils/contactHelpers";
import "./LocationMap.css";

function LocationMap() {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].about;

  const mapAddress = "Via Ospedale Di Venere 132/A, Bari, BA 70131, Italy";
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapAddress
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    mapAddress
  )}`;

  return (
    <section className="location-map-section py-5 position-relative">
      <Container className="py-2">
        {/* Titolo Sezione */}
        <Row className="justify-content-center text-center mb-4 mb-md-5">
          <Col xs={12} lg={9} xl={8}>
            <h2 className="display-5 font-heading text-body fw-bold mb-3">
              <i className="bi bi-geo-alt me-2 text-forest"></i>
              {t.mapSectionTitle}
            </h2>
            <p className="font-body text-body-secondary fs-5 lead mb-0">
              {t.mapSectionSub}
            </p>
          </Col>
        </Row>

        {/* Card Mappa + Info */}
        <div className="map-card-wrapper p-3 p-md-4">
          <Row className="g-4 align-items-stretch">
            {/* Colonna Mappa Google Embed */}
            <Col xs={12} lg={7} xl={8}>
              <div className="map-iframe-container">
                <iframe
                  title="VINCO EVENTI Location Map"
                  src={embedUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </Col>

            {/* Colonna Dettagli & Indicazioni Stradali */}
            <Col xs={12} lg={5} xl={4}>
              <div className="map-info-card">
                <div>
                  <h3 className="h4 font-heading text-body fw-bold mb-4 pb-2 border-bottom border-secondary border-opacity-25">
                    VINCO EVENTI HQ
                  </h3>

                  <div className="d-flex flex-column gap-4">
                    {/* Indirizzo */}
                    <div className="d-flex align-items-start gap-3">
                      <div className="info-item-icon">
                        <i className="bi bi-pin-map-fill"></i>
                      </div>
                      <div>
                        <span className="small text-body-secondary d-block text-uppercase fw-semibold tracking-wider">
                          {t.addressLabel}
                        </span>
                        <span className="fw-medium text-body font-body fs-6">
                          {t.addressValue}
                        </span>
                      </div>
                    </div>

                    {/* Telefono */}
                    <div className="d-flex align-items-start gap-3">
                      <div className="info-item-icon">
                        <i className="bi bi-telephone-fill"></i>
                      </div>
                      <div>
                        <span className="small text-body-secondary d-block text-uppercase fw-semibold tracking-wider">
                          {t.phoneLabel}
                        </span>
                        <a
                          href={`tel:${t.phoneValue.replace(/[^\d+]/g, "")}`}
                          onClick={(e) => handlePhoneClick(e, t.phoneValue)}
                          className="fw-medium text-body text-decoration-none font-body fs-6 map-contact-link"
                        >
                          {t.phoneValue}
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="d-flex align-items-start gap-3">
                      <div className="info-item-icon">
                        <i className="bi bi-envelope-fill"></i>
                      </div>
                      <div>
                        <span className="small text-body-secondary d-block text-uppercase fw-semibold tracking-wider">
                          {t.emailLabel}
                        </span>
                        <a
                          href={`mailto:${t.emailValue}`}
                          onClick={(e) => handleEmailClick(e, t.emailValue, dispatch)}
                          className="fw-medium text-body text-decoration-none font-body fs-6 map-contact-link"
                        >
                          {t.emailValue}
                        </a>
                      </div>
                    </div>

                    {/* Disponibilità */}
                    <div className="d-flex align-items-start gap-3">
                      <div className="info-item-icon">
                        <i className="bi bi-clock-fill"></i>
                      </div>
                      <div>
                        <span className="small text-body-secondary d-block text-uppercase fw-semibold tracking-wider">
                          {t.hoursLabel}
                        </span>
                        <span className="fw-medium text-body font-body fs-6">
                          {t.hoursValue}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pulsante Indicazioni Stradali Diretto (Universal Link) */}
                <div className="mt-4 pt-3 border-top border-secondary border-opacity-10">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-directions w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                    <span>{t.directionsBtn}</span>
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
}

export default LocationMap;
