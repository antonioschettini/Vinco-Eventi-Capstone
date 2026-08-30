import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import { translations } from "../../utils/translations";
import "./InstagramMockup.css";

import { triggerHapticFeedback } from "../../utils/vibration";

// Assets imports from src/assets/Vinco Eventi assets/assets immagini/
import imgCielo from "../../assets/Vinco Eventi assets/assets immagini/cielo stellato.webp";
import imgFontane from "../../assets/Vinco Eventi assets/assets immagini/fontane sparkular.webp";
import imgFumogeni from "../../assets/Vinco Eventi assets/assets immagini/fumogeni colorati.webp";
import imgTrolling from "../../assets/Vinco Eventi assets/assets immagini/trolling band.webp";
import imgSwing from "../../assets/Vinco Eventi assets/assets immagini/swing band aperitif.webp";

const slideImages = [
  { id: 1, src: imgCielo, alt: "Atmosfera Cielo Stellato" },
  { id: 2, src: imgFontane, alt: "Fontane Sparkular Scenografiche" },
  { id: 3, src: imgFumogeni, alt: "Effetti Fumogeni Colorati" },
  { id: 4, src: imgTrolling, alt: "Trolling Band Live Show" },
  { id: 5, src: imgSwing, alt: "Swing Band Aperitif" },
];

function InstagramMockup() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.instagramMockup || translations.it.instagramMockup;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [likeCount, setLikeCount] = useState(1483);
  const [isPaused, setIsPaused] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  // Orario reale dello smartphone aggiornato in tempo reale
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formatted = `${hours}:${minutes}`;
      setCurrentTime((prev) => (prev !== formatted ? formatted : prev));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scorrimento immagini automatico in loop
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideImages.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleLikeToggle = () => {
    triggerHapticFeedback(15);
    setIsLiked((prev) => {
      setLikeCount((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  };

  const handleDoubleTap = () => {
    triggerHapticFeedback([10, 30, 20]);
    if (!isLiked) {
      setIsLiked(true);
      setLikeCount((count) => count + 1);
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 800);
  };

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slideImages.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slideImages.length);
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked((prev) => !prev);
  };

  // Apertura modale di avviso verso profilo Instagram ufficiale
  const handleOpenInstagramModal = (e) => {
    if (e) e.stopPropagation();
    triggerHapticFeedback(15);
    setShowRedirectModal(true);
  };

  const handleCloseModal = () => {
    setShowRedirectModal(false);
  };

  const handleProceedToInstagram = () => {
    triggerHapticFeedback(20);
    setShowRedirectModal(false);
    window.open("https://www.instagram.com/vincoeventi/", "_blank", "noopener,noreferrer");
  };

  // Touch swipe state per l'esperienza da smartphone
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const minSwipeDistance = 40;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev + 1) % slideImages.length);
    } else if (isRightSwipe) {
      setCurrentIndex((prev) => (prev === 0 ? slideImages.length - 1 : prev - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="instagram-mockup-wrapper">
      {/* Smartphone Chassis */}
      <div className="phone-chassis">
        {/* Top Notch & Status Bar */}
        <div className="phone-top-bar d-flex justify-content-between align-items-center">
          <span className="phone-clock font-body fw-bold">{currentTime}</span>
          <div className="phone-notch">
            <span className="camera-lens"></span>
            <span className="speaker"></span>
          </div>
          <div className="phone-status-icons d-flex align-items-center gap-1">
            <i className="bi bi-reception-4 fs-7"></i>
            <i className="bi bi-wifi fs-7"></i>
            <i className="bi bi-battery-full fs-6"></i>
          </div>
        </div>

        {/* Screen Content */}
        <div className="phone-screen">
          {/* Instagram Top Header */}
          <div className="ig-header d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10">
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <button
                type="button"
                className="ig-avatar-ring-btn border-0 bg-transparent p-0 flex-shrink-0"
                onClick={handleOpenInstagramModal}
                title={t.storyTooltip || "Guarda le Storie e il profilo ufficiale su Instagram"}
                aria-label="Visualizza Storia e Profilo Instagram di VINCO EVENTI"
              >
                <div className="ig-avatar-ring">
                  <img
                    src="/logo tondo vinco eventi trasparente.png"
                    alt="VINCO EVENTI"
                    className="ig-avatar-img"
                  />
                </div>
              </button>
              <div
                className="d-flex flex-column lh-1 overflow-hidden cursor-pointer ig-user-header-text"
                onClick={handleOpenInstagramModal}
                title={t.storyTooltip || "Guarda le Storie e il profilo ufficiale su Instagram"}
              >
                <div className="d-flex align-items-center gap-1">
                  <span className="ig-username fw-bold text-truncate">vincoeventi</span>
                  <i className="bi bi-patch-check-fill text-primary fs-7" title="Account Verificato"></i>
                </div>
                <span className="ig-location text-body-secondary text-truncate">{t.location}</span>
              </div>
            </div>
            <button
              className="btn btn-link p-0 text-body"
              aria-label="Option menu"
              onClick={handleOpenInstagramModal}
              title={t.storyTooltip || "Guarda le Storie e il profilo ufficiale su Instagram"}
            >
              <i className="bi bi-three-dots fs-6"></i>
            </button>
          </div>

          {/* Central Image Carousel (Square 1:1 Aspect Ratio + Touch Swipe Support) */}
          <div
            className="ig-carousel-container"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onDoubleClick={handleDoubleTap}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Animated Double-Tap Heart */}
            {showHeartAnim && (
              <div className="ig-heart-overlay">
                <i className="bi bi-heart-fill"></i>
              </div>
            )}

            <div
              className="ig-carousel-track"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {slideImages.map((img) => (
                <div key={img.id} className="ig-carousel-slide">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="ig-post-img"
                  />
                </div>
              ))}
            </div>

            {/* Navigation Chevron Buttons */}
            <button
              className="ig-carousel-nav-btn prev"
              onClick={handlePrevSlide}
              aria-label="Immagine precedente"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              className="ig-carousel-nav-btn next"
              onClick={handleNextSlide}
              aria-label="Immagine successiva"
            >
              <i className="bi bi-chevron-right"></i>
            </button>

            {/* Pagination Dots */}
            <div className="ig-carousel-dots d-flex justify-content-center gap-1 position-absolute bottom-0 start-50 translate-middle-x mb-2 z-3">
              {slideImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`ig-dot-btn border-0 rounded-circle ${
                    idx === currentIndex ? "active" : ""
                  }`}
                  aria-label={`Vai alla slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Post Action Bar */}
          <div className="ig-action-bar d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <button
                className={`btn btn-link p-0 ${isLiked ? "text-danger" : "text-body"}`}
                onClick={handleLikeToggle}
                aria-label="Like post"
              >
                <i className={`bi ${isLiked ? "bi-heart-fill" : "bi-heart"}`}></i>
              </button>
              <button className="btn btn-link p-0 text-body" aria-label="Comment">
                <i className="bi bi-chat"></i>
              </button>
              <button className="btn btn-link p-0 text-body" aria-label="Share">
                <i className="bi bi-send"></i>
              </button>
            </div>
            <button
              className={`btn btn-link p-0 ${isBookmarked ? "text-primary" : "text-body"}`}
              onClick={handleBookmarkToggle}
              aria-label="Bookmark post"
            >
              <i className={`bi ${isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`}></i>
            </button>
          </div>

          {/* Likes & Caption Section (Fixed Fitted Height) */}
          <div className="ig-caption-section">
            <div className="fw-bold mb-1">
              {t.likedBy || "Piace a"} <span className="fw-bold">vincoeventi</span> e {t.andOthers || "altri"}{" "}
              <span className="fw-bold">{likeCount}</span>
            </div>
            <div className="ig-caption-text">
              <span className="fw-bold me-1">vincoeventi</span>
              {t.caption}
            </div>
            <div className="ig-hashtags text-primary fw-medium mt-1">
              {t.hashtags}
            </div>
          </div>

          {/* Bottom IG Navigation Bar */}
          <div className="ig-bottom-nav d-flex justify-content-around align-items-center border-top border-secondary border-opacity-10">
            <button className="btn btn-link p-0 text-body" aria-label="Home">
              <i className="bi bi-house-door-fill"></i>
            </button>
            <button className="btn btn-link p-0 text-body" aria-label="Search">
              <i className="bi bi-search"></i>
            </button>
            <button className="btn btn-link p-0 text-body" aria-label="Add">
              <i className="bi bi-plus-square"></i>
            </button>
            <button className="btn btn-link p-0 text-body" aria-label="Reels">
              <i className="bi bi-play-btn"></i>
            </button>
            <button
              className="btn btn-link p-0 text-body"
              aria-label="Profile"
              onClick={handleOpenInstagramModal}
              title={t.storyTooltip || "Guarda le Storie e il profilo ufficiale su Instagram"}
            >
              <img
                src="/logo tondo vinco eventi trasparente.png"
                alt="Profile VINCO EVENTI"
                className="rounded-circle"
                style={{ width: "22px", height: "22px", objectFit: "cover" }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Avviso Uscita verso Profilo Instagram Ufficiale */}
      <Modal
        show={showRedirectModal}
        onHide={handleCloseModal}
        centered
        className="ig-redirect-modal"
        dialogClassName="ig-modal-dialog modal-dialog-centered"
        contentClassName="ig-modal-content border-0 rounded-4 overflow-hidden shadow-lg"
      >
        <div className="ig-modal-header d-flex justify-content-between align-items-center p-3 p-md-4 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill ig-modal-badge px-3 py-2 d-inline-flex align-items-center gap-1">
              <i className="bi bi-instagram fs-6"></i>
              <span className="fw-bold">Instagram</span>
            </span>
          </div>
          <button
            type="button"
            className="btn-close ig-modal-close-btn p-2"
            onClick={handleCloseModal}
            aria-label="Chiudi modale"
          ></button>
        </div>

        <Modal.Body className="p-4 text-center">
          {/* Glowing Animated Profile Story Ring */}
          <div className="ig-modal-avatar-wrapper mx-auto mb-3 position-relative d-inline-block">
            <div className="ig-modal-avatar-ring">
              <img
                src="/logo tondo vinco eventi trasparente.png"
                alt="VINCO EVENTI"
                className="ig-modal-avatar-img"
              />
            </div>
            <div className="ig-modal-verified-badge position-absolute bottom-0 end-0">
              <i className="bi bi-patch-check-fill text-primary fs-5"></i>
            </div>
          </div>

          <h4 className="h5 font-heading fw-bold text-body mb-1">
            {t.modalProfileName || "VINCO EVENTI (@vincoeventi)"}
          </h4>
          <div className="mb-3">
            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 font-body small fw-semibold">
              <i className="bi bi-shield-check me-1"></i>
              {t.modalOfficialTag || "Account Ufficiale Verificato"}
            </span>
          </div>

          <h5 className="h6 font-heading text-body fw-bold mb-2">
            {t.modalTitle || "Stai per lasciare il sito"}
          </h5>
          <p className="font-body text-body-secondary small mb-0 px-2 max-w-400 mx-auto">
            {t.modalSubtitle || "Verrai reindirizzato al profilo ufficiale Instagram di VINCO EVENTI per visualizzare storie, reel e contenuti esclusivi."}
          </p>
        </Modal.Body>

        <Modal.Footer className="border-top p-3 d-flex flex-column flex-sm-row justify-content-between gap-2 bg-body-tertiary">
          <button
            type="button"
            className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold w-100 w-sm-auto order-2 order-sm-1"
            onClick={handleCloseModal}
          >
            {t.modalCancelBtn || "Rimani sul sito"}
          </button>
          <button
            type="button"
            className="btn ig-proceed-btn rounded-pill px-4 py-2 fw-bold text-white shadow-sm d-inline-flex align-items-center justify-content-center gap-2 w-100 w-sm-auto order-1 order-sm-2"
            onClick={handleProceedToInstagram}
          >
            <i className="bi bi-instagram fs-6"></i>
            <span>{t.modalProceedBtn || "Procedi su Instagram"}</span>
            <i className="bi bi-box-arrow-up-right fs-7 ms-1"></i>
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default InstagramMockup;
