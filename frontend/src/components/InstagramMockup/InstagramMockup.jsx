import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import "./InstagramMockup.css";

// Assets imports from src/assets/home/
import imgSposi from "../../assets/home/foto bacio sposi.jpg";
import imgAperitivo from "../../assets/home/foto band aperitivo.jpg";
import imgDancefloor from "../../assets/home/dancefloor.webp";
import imgFumogeni from "../../assets/home/14. fumogeni color.jpg";
import imgCielo from "../../assets/home/cielo stellato.jpg";
import logoEnzo from "../../assets/home/foto sfondo banner enzo.jpeg";

const slideImages = [
  { id: 1, src: imgSposi, alt: "Sposi Vinco Eventi" },
  { id: 2, src: imgAperitivo, alt: "Aperitivo con Band dal Vivo" },
  { id: 3, src: imgDancefloor, alt: "Dancefloor & DJ Set" },
  { id: 4, src: imgFumogeni, alt: "Effetti Spettacolari & Fumogeni" },
  { id: 5, src: imgCielo, alt: "Atmosfera Cielo Stellato" },
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

  // Scorrimento immagini automatico in loop
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideImages.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleLikeToggle = () => {
    setIsLiked((prev) => {
      setLikeCount((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  };

  const handleDoubleTap = () => {
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

  return (
    <div className="instagram-mockup-wrapper">
      {/* Smartphone Chassis */}
      <div className="phone-chassis">
        {/* Top Notch & Status Bar */}
        <div className="phone-top-bar d-flex justify-content-between align-items-center">
          <span className="phone-clock font-body fw-bold">21:49</span>
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
              <div className="ig-avatar-ring">
                <img
                  src={logoEnzo}
                  alt="vincoeventi"
                  className="ig-avatar-img"
                />
              </div>
              <div className="d-flex flex-column lh-1 overflow-hidden">
                <div className="d-flex align-items-center gap-1">
                  <span className="ig-username fw-bold text-truncate">vincoeventi</span>
                  <i className="bi bi-patch-check-fill text-primary fs-7" title="Account Verificato"></i>
                </div>
                <span className="ig-location text-body-secondary text-truncate">{t.location}</span>
              </div>
            </div>
            <button className="btn btn-link p-0 text-body" aria-label="Option menu">
              <i className="bi bi-three-dots fs-6"></i>
            </button>
          </div>

          {/* Central Image Carousel (Square 1:1 Aspect Ratio) */}
          <div
            className="ig-carousel-container"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onDoubleClick={handleDoubleTap}
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
              Piace a <span className="fw-bold">vincoeventi</span> altri{" "}
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
            <button className="btn btn-link p-0 text-body" aria-label="Profile">
              <img
                src={logoEnzo}
                alt="Profile"
                className="rounded-circle"
                style={{ width: "22px", height: "22px", objectFit: "cover" }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstagramMockup;
