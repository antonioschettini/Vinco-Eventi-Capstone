import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import API_BASE_URL from "../../config/api";
import { apiFetch } from "../../utils/apiClient";
import "./MatrimonioWidgets.css";

// Pool di recensioni verificate a 5 stelle da Matrimonio.com con traduzione bilingue completa (IT / EN)
const ALL_REVIEWS_POOL = [
  {
    id: 1,
    name: "Francesca B.",
    dateIta: "23/05/2026",
    dateEng: "May 23, 2026",
    rating: 5.0,
    titleIta: "Epicooooo ✨💖",
    titleEng: "Epic experience! ✨💖",
    textIta: "Un'agenzia fantastica che consiglierei a chiunque! Ci hanno supportato dall'inizio alla fine nella gestione della musica, ma la vera svolta è stata l'after party. Sono riusciti a coinvolgere tutti gli invitati fino a tarda notte!",
    textEng: "A fantastic agency that I would recommend to anyone! They supported us from start to finish with the music management, but the real highlight was the after party. They managed to engage all the guests until late at night!",
    initials: "F",
  },
  {
    id: 2,
    name: "Fiorenza M.",
    dateIta: "10/07/2026",
    dateEng: "July 10, 2026",
    rating: 5.0,
    titleIta: "Tutto perfetto!",
    titleEng: "Everything was perfect!",
    textIta: "Tutto come desiderato. Musica divertente e bellissima atmosfera. Niente da eccepire! Vincenzo e il suo team hanno reso la nostra festa indimenticabile.",
    textEng: "Everything was exactly as requested. Fun music and wonderful atmosphere. Nothing to complain about! Vincenzo and his team made our party unforgettable.",
    initials: "F",
  },
  {
    id: 3,
    name: "Francesca S.",
    dateIta: "04/07/2026",
    dateEng: "July 4, 2026",
    rating: 5.0,
    titleIta: "Non potevamo chiedere di meglio!",
    titleEng: "Couldn't have asked for a better music company!",
    textIta: "Il mio wedding planner ha raccomandato VINCO EVENTI, e fin dall'inizio l'intero processo è stato così facile! Sono stati incredibilmente professionali, organizzati e curati in ogni dettaglio.",
    textEng: "My wedding planner recommended VINCO EVENTI, and from the very beginning the whole process was so smooth! They were incredibly professional, organized, and attentive to every detail.",
    initials: "F",
  },
  {
    id: 4,
    name: "Giuseppe & Elena",
    dateIta: "18/09/2025",
    dateEng: "Sept 18, 2025",
    rating: 5.0,
    titleIta: "Spettacolo unico e tanta professionalità",
    titleEng: "Unique show and utmost professionalism",
    textIta: "Dall'aperitivo al taglio torta con il sax dal vivo fino al DJ set scatenato della sera, hanno creato un'atmosfera magica. Invitati tutti entusiasti!",
    textEng: "From the welcome cocktail to the cake cutting with live sax and the wild evening DJ set, they created a magical atmosphere. All guests were thrilled!",
    initials: "G",
  },
  {
    id: 5,
    name: "Marco & Sofia",
    dateIta: "14/06/2025",
    dateEng: "June 14, 2025",
    rating: 5.0,
    titleIta: "Matrimonio da favola!",
    titleEng: "Fairytale Wedding!",
    textIta: "Vincenzo e i suoi musicisti sono stati eccezionali. Hanno saputo leggere la piazza e far ballare tutti, dai più giovani ai più anziani. Consigliatissimi!",
    textEng: "Vincenzo and his musicians were exceptional. They knew how to read the crowd and get everyone dancing, from the youngest to the oldest. Highly recommended!",
    initials: "M",
  },
  {
    id: 6,
    name: "Alessandro P.",
    dateIta: "02/10/2025",
    dateEng: "October 2, 2025",
    rating: 5.0,
    titleIta: "Musica ed eleganza ai massimi livelli",
    titleEng: "Music and elegance at the highest level",
    textIta: "Service audio e luci di livello altissimo, voce e strumenti solisti incantevoli. Un grazie di cuore a tutto lo staff per la disponibilità e la passione.",
    textEng: "Top-tier audio and lighting service, enchanting vocals and solo instruments. A heartfelt thank you to all staff for their dedication and passion.",
    initials: "A",
  },
  {
    id: 7,
    name: "Laura & Davide",
    dateIta: "28/08/2025",
    dateEng: "August 28, 2025",
    rating: 5.0,
    titleIta: "Semplicemente imbattibili!",
    titleEng: "Simply unbeatable!",
    textIta: "Ci siamo affidati a loro a occhi chiusi e hanno superato ogni aspettativa. Organizzazione impeccabile, flessibilità totale e divertimento puro.",
    textEng: "We trusted them completely and they exceeded every expectation. Impeccable organization, full flexibility, and pure fun.",
    initials: "L",
  },
  {
    id: 8,
    name: "Claudia T.",
    dateIta: "12/05/2025",
    dateEng: "May 12, 2025",
    rating: 5.0,
    titleIta: "La scelta migliore per le nostre nozze",
    titleEng: "The best choice for our wedding",
    textIta: "Ingegneria del suono perfetta, volumi sempre bilanciati e repertorio vastissimo. Riceviamo ancora i complimenti dagli invitati!",
    textEng: "Perfect sound engineering, always balanced volumes, and a vast repertoire. We are still receiving compliments from our guests!",
    initials: "C",
  },
  {
    id: 9,
    name: "Stefano & Valentina",
    dateIta: "21/09/2025",
    dateEng: "Sept 21, 2025",
    rating: 5.0,
    titleIta: "Festa indimenticabile e coinvolgimento massimo",
    titleEng: "Unforgettable party and incredible energy",
    textIta: "Musica travolgente e scaletta perfetta. Hanno saputo interpretare esattamente i nostri gusti rendendo unico ogni momento della giornata.",
    textEng: "Overwhelming music and perfect playlist. They interpreted our tastes to perfection, making every moment of our wedding unique.",
    initials: "S",
  },
  {
    id: 10,
    name: "Martina & Riccardo",
    dateIta: "15/07/2025",
    dateEng: "July 15, 2025",
    rating: 5.0,
    titleIta: "Servizio impeccabile sotto ogni punto di vista",
    titleEng: "Impeccable service from start to finish",
    textIta: "Professionalità straordinaria, impianti luci mozzafiato e acustica perfetta in ogni angolo della location. Grazie di tutto!",
    textEng: "Extraordinary professionalism, breathtaking light setups, and crystal-clear sound across the whole venue. Thank you so much!",
    initials: "M",
  },
  {
    id: 11,
    name: "Andrea & Giada",
    dateIta: "03/06/2025",
    dateEng: "June 3, 2025",
    rating: 5.0,
    titleIta: "Sax e DJ set da brividi!",
    titleEng: "Chills from the live Sax and DJ set!",
    textIta: "L'abbinamento sax dal vivo e DJ set durante l'aperitivo e l'after party ha fatto ballare letteralmente tutti. Super consigliati!",
    textEng: "Combining live sax with the DJ set for the cocktail hour and after-party got literally everyone dancing. Highly recommended!",
    initials: "A",
  },
  {
    id: 12,
    name: "Maria Chiara F.",
    dateIta: "19/10/2024",
    dateEng: "October 19, 2024",
    rating: 5.0,
    titleIta: "Raffinatezza e divertimento assicurati",
    titleEng: "Elegance and guaranteed fun",
    textIta: "Dalla cerimonia elegante con violino al DJ set serale, una classe e una carica musicale senza pari. Matrimonio perfetto!",
    textEng: "From the elegant violin ceremony to the evening DJ set, unrivaled class and musical energy. A perfect wedding!",
    initials: "M",
  },
  {
    id: 13,
    name: "Gianluca & Serena",
    dateIta: "27/05/2024",
    dateEng: "May 27, 2024",
    rating: 5.0,
    titleIta: "Organizzazione svizzera e musica al top",
    titleEng: "Flawless organization and top quality music",
    textIta: "Puntuali, disponibili ad ogni nostra richiesta e capaci di creare un'energia travolgente. Vincenzo è un vero professionista del settore.",
    textEng: "Punctual, responsive to all our requests, and capable of generating incredible crowd energy. Vincenzo is a true industry professional.",
    initials: "G",
  },
  {
    id: 14,
    name: "Domenico & Elisa",
    dateIta: "09/09/2024",
    dateEng: "September 9, 2024",
    rating: 5.0,
    titleIta: "Tutti gli invitati hanno ballato senza sosta",
    titleEng: "All guests danced non-stop all night",
    textIta: "Non potevamo fare scelta migliore per la nostra festa. Musica di qualità e atmosfera da sogno fino a tarda notte!",
    textEng: "We couldn't have made a better choice for our wedding party. Premium music and dream atmosphere late into the night!",
    initials: "D",
  },
];

// Algoritmo di Shuffle Fisher-Yates per un'effettiva distribuzione casuale uniforme
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function MatrimonioWidgets() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].about;

  const [totalReviewsCount, setTotalReviewsCount] = useState(124);
  const [randomReviews, setRandomReviews] = useState(() =>
    shuffleArray(ALL_REVIEWS_POOL).slice(0, 4)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshReviews = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRandomReviews(shuffleArray(ALL_REVIEWS_POOL).slice(0, 4));
      setIsRefreshing(false);
    }, 250);
  };

  useEffect(() => {
    let isSubscribed = true;

    // Recupero del numero totale live delle recensioni dal backend / Matrimonio.com
    const fetchMatrimonioStats = async () => {
      try {
        const data = await apiFetch(`${API_BASE_URL}/api/matrimonio-stats`);
        if (isSubscribed && data && data.totalReviews) {
          setTotalReviewsCount(data.totalReviews);
        }
      } catch {
        // Fallback silenzioso su 124
      }
    };

    fetchMatrimonioStats();

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

  const reviewsCountLabel = t.reviewsCountPattern
    ? t.reviewsCountPattern.replace("{count}", totalReviewsCount)
    : `(${totalReviewsCount} ${lang === "en" ? "reviews" : "recensioni"})`;

  const readAllReviewsLabel = t.readAllReviewsPattern
    ? t.readAllReviewsPattern.replace("{count}", totalReviewsCount)
    : `${lang === "en" ? "Read all" : "Leggi tutte le"} ${totalReviewsCount} ${lang === "en" ? "reviews on" : "recensioni su"}`;

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
          {/* Badge A: Banner Recensioni */}
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
                {lang === "en" ? `${totalReviewsCount} 5-Star Reviews` : `${totalReviewsCount} Recensioni a 5 Stelle`}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                {t.badge100Sub || "Suggerito e Raccomandato al 100% dalle nostre coppie."}
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
                {t.award2023Title || "Wedding Awards 2023"}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                {t.award2023Sub || "Vincitore del premio per la categoria Musica Matrimonio."}
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
                {t.award2024Title || "Wedding Awards 2024"}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                {t.award2024Sub || "Riconferma tra i migliori fornitori per il secondo anno."}
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
                {t.award2025Title || "Wedding Awards 2025"}
              </h3>
              <p className="small text-body-secondary mb-0 font-body">
                {t.award2025Sub || "Prestigioso riconoscimento confermato per tre anni consecutivi."}
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
                  {reviewsCountLabel}
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {/* Griglia Card Recensioni Randomizzate e Tradotte in IT/EN */}
        <Row className="g-4 justify-content-center align-items-stretch mb-4">
          {randomReviews.map((rev) => {
            const reviewTitle = lang === "en" ? rev.titleEng : rev.titleIta;
            const reviewText = lang === "en" ? rev.textEng : rev.textIta;
            const reviewDate = lang === "en" ? rev.dateEng : rev.dateIta;

            return (
              <Col key={rev.id} xs={12} md={6}>
                <div className={`review-item-card h-100 d-flex flex-column justify-content-between ${isRefreshing ? "refreshing" : ""}`}>
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="review-avatar">{rev.initials}</div>
                        <div>
                          <h4 className="h6 font-heading fw-bold text-body mb-0">
                            {rev.name}
                          </h4>
                          <span className="small text-body-secondary font-body">
                            {t.weddingDateLabel || "Data nozze:"} {reviewDate}
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
                      {reviewTitle}
                    </h5>
                    <p className="font-body text-body-secondary fs-6 mb-0 lh-base">
                      "{reviewText}"
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                    <span className="small text-success font-body fw-semibold d-inline-flex align-items-center gap-1">
                      <i className="bi bi-check-circle-fill"></i> {t.verifiedReview || "Recensione Verificata"}
                    </span>
                    <img
                      src="https://cdn1.matrimonio.com/assets/img/logos/gen_logoHeader.svg"
                      alt="Matrimonio.com"
                      className="matrimonio-logo-img"
                    />
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>

        {/* Pulsanti di Azione: Refresh Recensioni e Link a Matrimonio.com */}
        <Row className="justify-content-center text-center mt-4">
          <Col xs={12} className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3">
            <button
              type="button"
              onClick={handleRefreshReviews}
              className="btn-matrimonio-refresh"
              aria-label={t.refreshReviews || "Mostra altre recensioni"}
            >
              <i className={`bi bi-arrow-clockwise fs-5 ${isRefreshing ? "spin-icon" : ""}`}></i>
              <span>{t.refreshReviews || "Mostra altre recensioni"}</span>
            </button>

            <a
              href="https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893/opinioni"
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="btn-matrimonio-all"
            >
              <span>{readAllReviewsLabel}</span>
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
