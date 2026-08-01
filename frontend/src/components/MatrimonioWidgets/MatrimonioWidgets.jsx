import { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import "./MatrimonioWidgets.css";

function MatrimonioWidgets() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].about;

  useEffect(() => {
    // Helper per caricare script dei badge Matrimonio.com in modo dinamico
    const loadScript = (src) => {
      return new Promise((resolve) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.body.appendChild(script);
      });
    };

    let isSubscribed = true;

    const runWidgetScripts = async () => {
      await loadScript("https://cdn1.matrimonio.com/_js/wp-rated.js?v=4");

      if (!isSubscribed) return;

      setTimeout(() => {
        try {
          if (typeof window.wpShowRatedv2 === "function") {
            window.wpShowRatedv2("283893");
          }
          if (typeof window.wpShowRatedWAv3 === "function") {
            window.wpShowRatedWAv3("283893", "2023");
            window.wpShowRatedWAv3("283893", "2024");
            window.wpShowRatedWAv3("283893", "2025");
          }
        } catch {
          // Fallback gestito via markup statico sottostante
        }
      }, 150);
    };

    runWidgetScripts();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Recensioni ufficiali verificate su Matrimonio.com per Vinco Eventi
  const reviewsData = [
    {
      id: 1,
      name: "Francesca B.",
      date: "23/05/2026",
      rating: 5.0,
      title: "Epicooooo ✨💖",
      text: "Un'agenzia fantastica che consiglierei a chiunque! Ci hanno supportato dall'inizio alla fine nella gestione della musica, ma la vera svolta è stata l'after party. Sono riusciti a coinvolgere tutti gli invitati fino a tarda notte!",
      initials: "F",
    },
    {
      id: 2,
      name: "Fiorenza M.",
      date: "10/07/2026",
      rating: 5.0,
      title: "Tutto perfetto!",
      text: "Tutto come desiderato. Musica divertente e bellissima atmosfera. Niente da eccepire! Vincenzo e il suo team hanno reso la nostra festa indimenticabile.",
      initials: "F",
    },
    {
      id: 3,
      name: "Francesca S.",
      date: "04/07/2026",
      rating: 5.0,
      title: "Couldn't have asked for a better music company!",
      text: "Il mio wedding planner ha raccomandato Vinco Eventi, e fin dall'inizio l'intero processo è stato così facile! Sono stati incredibilmente professionali, organizzati e curati in ogni dettaglio.",
      initials: "F",
    },
    {
      id: 4,
      name: "Giuseppe & Elena",
      date: "18/09/2025",
      rating: 5.0,
      title: "Spettacolo unico e tanta professionalità",
      text: "Dall'aperitivo al taglio torta con il sax dal vivo fino al DJ set scatenato della sera, hanno creato un'atmosfera magica. Invitati tutti entusiasti!",
      initials: "G",
    },
  ];

  return (
    <section className="matrimonio-section py-5 bg-body-tertiary border-top border-bottom">
      <Container className="py-2">
        {/* Intestazione Sezione Riprova Sociale */}
        <Row className="justify-content-center text-center mb-4 mb-md-5">
          <Col xs={12} lg={9} xl={8}>
            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill font-body fw-semibold text-uppercase tracking-wider mb-2">
              <i className="bi bi-award-fill me-1"></i> {t.reviewsBadgeTag}
            </span>
            <h2 className="display-5 font-heading text-body fw-bold mb-3">
              {t.reviewsSectionTitle}
            </h2>
            <p className="font-body text-body-secondary fs-5 lead mb-0">
              {t.reviewsSectionSub}
            </p>
          </Col>
        </Row>

        {/* Griglia 4 Badge Riconoscimenti (Awards) */}
        <Row className="g-3 g-md-4 justify-content-center align-items-stretch mb-5">
          {/* Badge A: Banner 100 Recensioni */}
          <Col xs={12} sm={6} lg={3}>
            <div className="matrimonio-badge-card">
              <div className="matrimonio-badge-img-wrapper mb-3">
                <div id="wp-rated">
                  <a
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    href="https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893"
                    title="Suggerito su www.matrimonio.com"
                  >
                    <img
                      alt="Consigliato da Matrimonio.com"
                      id="wp-rated-img"
                      src="https://cdn1.matrimonio.com/assets/img/badges/rated/badge-rated-100.png"
                    />
                  </a>
                </div>
              </div>
              <h3 className="h6 font-heading fw-bold text-body mb-1">
                {t.badge100Title}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                Suggerito e Raccomandato al 100% dalle nostre coppie.
              </p>
            </div>
          </Col>

          {/* Badge B: Wedding Awards 2023 */}
          <Col xs={12} sm={6} lg={3}>
            <div className="matrimonio-badge-card">
              <div className="matrimonio-badge-img-wrapper mb-3">
                <div id="wp-ratedWA-2023">
                  <a
                    target="_blank"
                    href="https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893"
                    rel="nofollow noopener noreferrer"
                    title="VINCO EVENTI, vincitore Wedding Awards 2023 Matrimonio.com"
                  >
                    <img
                      width="125"
                      height="125"
                      alt="VINCO EVENTI, vincitore Wedding Awards 2023 Matrimonio.com"
                      id="wp-ratedWA-img-2023"
                      src="https://cdn1.matrimonio.com/img/badges/2023/badge-weddingawards_it_IT.jpg"
                    />
                  </a>
                </div>
              </div>
              <h3 className="h6 font-heading fw-bold text-body mb-1">
                {t.award2023Title}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                Vincitore del premio per la categoria Musica Matrimonio.
              </p>
            </div>
          </Col>

          {/* Badge C: Wedding Awards 2024 */}
          <Col xs={12} sm={6} lg={3}>
            <div className="matrimonio-badge-card">
              <div className="matrimonio-badge-img-wrapper mb-3">
                <div id="wp-ratedWA-2024">
                  <a
                    target="_blank"
                    href="https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893"
                    rel="nofollow noopener noreferrer"
                    title="VINCO EVENTI, vincitore Wedding Awards 2024 Matrimonio.com"
                  >
                    <img
                      width="125"
                      height="125"
                      alt="VINCO EVENTI, vincitore Wedding Awards 2024 Matrimonio.com"
                      id="wp-ratedWA-img-2024"
                      src="https://cdn1.matrimonio.com/img/badges/2024/badge-weddingawards_it_IT.jpg"
                    />
                  </a>
                </div>
              </div>
              <h3 className="h6 font-heading fw-bold text-body mb-1">
                {t.award2024Title}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                Riconferma tra i migliori fornitori per il secondo anno.
              </p>
            </div>
          </Col>

          {/* Badge D: Wedding Awards 2025 */}
          <Col xs={12} sm={6} lg={3}>
            <div className="matrimonio-badge-card">
              <div className="matrimonio-badge-img-wrapper mb-3">
                <div id="wp-ratedWA-2025">
                  <a
                    target="_blank"
                    href="https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893"
                    rel="nofollow noopener noreferrer"
                    title="VINCO EVENTI, vincitore Wedding Awards 2025 Matrimonio.com"
                  >
                    <img
                      width="125"
                      height="125"
                      alt="VINCO EVENTI, vincitore Wedding Awards 2025 Matrimonio.com"
                      id="wp-ratedWA-img-2025"
                      src="https://cdn1.matrimonio.com/img/badges/2025/badge-weddingawards_it_IT.jpg"
                    />
                  </a>
                </div>
              </div>
              <h3 className="h6 font-heading fw-bold text-body mb-1">
                {t.award2025Title}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                Prestigioso riconoscimento confermato per tre anni consecutivi.
              </p>
            </div>
          </Col>
        </Row>

        {/* Intestazione Recensioni Verificate & Valutazione Complessiva */}
        <Row className="justify-content-center text-center mb-4">
          <Col xs={12} lg={10}>
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3 mb-2">
              <h3 className="h3 font-heading fw-bold text-body mb-0">
                <i className="bi bi-chat-quote-fill me-2 text-forest"></i>
                {t.reviewsWidgetTitle}
              </h3>
              <div className="d-flex align-items-center gap-2 bg-success bg-opacity-10 px-3 py-1.5 rounded-pill border border-success border-opacity-25">
                <span className="fw-bold text-success font-body fs-5">5.0</span>
                <div className="review-stars">
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <i className="bi bi-star-fill text-warning me-1"></i>
                  <i className="bi bi-star-fill text-warning"></i>
                </div>
                <span className="small text-body-secondary font-body ms-1">
                  (123 recensioni)
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Griglia Card Recensioni con Stessa UI/UX delle Badge Card */}
        <Row className="g-4 justify-content-center align-items-stretch mb-4">
          {reviewsData.map((rev) => (
            <Col key={rev.id} xs={12} md={6}>
              <div className="review-item-card">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="review-avatar">{rev.initials}</div>
                      <div>
                        <h4 className="h6 font-heading fw-bold text-body mb-0">
                          {rev.name}
                        </h4>
                        <span className="small text-body-secondary font-body">
                          Data nozze: {rev.date}
                        </span>
                      </div>
                    </div>
                    <div className="review-stars">
                      <i className="bi bi-star-fill text-warning"></i>
                      <i className="bi bi-star-fill text-warning"></i>
                      <i className="bi bi-star-fill text-warning"></i>
                      <i className="bi bi-star-fill text-warning"></i>
                      <i className="bi bi-star-fill text-warning"></i>
                    </div>
                  </div>

                  <h5 className="h6 font-body fw-bold text-body mb-2">
                    {rev.title}
                  </h5>
                  <p className="font-body text-body-secondary fs-6 mb-0 lh-base">
                    "{rev.text}"
                  </p>
                </div>

                <div className="mt-3 pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                  <span className="small text-success font-body fw-semibold d-inline-flex align-items-center gap-1">
                    <i className="bi bi-check-circle-fill"></i> Recensione Verificata
                  </span>
                  <img
                    src="https://cdn1.matrimonio.com/assets/img/logos/gen_logoHeader.svg"
                    alt="Matrimonio.com"
                    className="matrimonio-logo-img"
                  />
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Pulsante Diretto per tutte le 123 recensioni su Matrimonio.com */}
        <Row className="justify-content-center text-center mt-4">
          <Col xs={12}>
            <a
              href="https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893/opinioni"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="btn-matrimonio-all"
            >
              <span>Leggi tutte le 123 recensioni su</span>
              <img
                src="https://cdn1.matrimonio.com/assets/img/logos/gen_logoHeader.svg"
                alt="Matrimonio.com"
                className="matrimonio-logo-img"
              />
              <i className="bi bi-box-arrow-up-right ms-1"></i>
            </a>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default MatrimonioWidgets;
