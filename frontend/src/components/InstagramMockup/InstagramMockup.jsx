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
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(1482);
  const [isPaused, setIsPaused] = useState(false);

  // Scorrimento immagini automatico in loop
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideImages.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleLikeToggle = () => {
    setIsLiked((prev) => {
      setLikeCount((count) => (prev ? count - 1 : count + 1));
      return !prev;
    });
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked((prev) => !prev);
  };

  return (
    <div className="instagram-mockup-wrapper d-flex justify-content-center align-items-center">
      {/* Smartphone Chassis */}
      <div className="phone-chassis">
        {/* Top Notch & Status Bar */}
        <div className="phone-top-bar d-flex justify-content-between align-items-center px-4 pt-2">
          <span className="phone-clock font-body fw-bold fs-6">21:49</span>
          <div className="phone-notch">
            <span className="camera-lens"></span>
            <span className="speaker"></span>
          </div>
          <div className="phone-status-icons d-flex align-items-center gap-2">
            <i className="bi bi-reception-4 fs-6"></i>
            <i className="bi bi-wifi fs-6"></i>
            <i className="bi bi-battery-full fs-5"></i>
          </div>
        </div>

        {/* Screen Content */}
        <div className="phone-screen d-flex flex-column">
          {/* Instagram Top Header */}
          <div className="ig-header d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-10">
            <div className="d-flex align-items-center gap-2">
              <div className="ig-avatar-ring">
                <img
                  src={logoEnzo}
                  alt="vincoeventi"
                  className="ig-avatar-img"
                />
              </div>
              <div className="d-flex flex-column lh-1">
                <span className="ig-username fw-bold">vincoeventi</span>
                <span className="ig-location text-body-secondary">{t.location}</span>
              </div>
            </div>
            <button className="btn btn-link p-0 text-body" aria-label="Option menu">
              <i className="bi bi-three-dots fs-5"></i>
            </button>
          </div>

          {/* Central Image Carousel */}
          <div
            className="ig-carousel-container position-relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="ig-carousel-track d-flex transition-transform"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {slideImages.map((img) => (
                <div key={img.id} className="ig-carousel-slide flex-shrink-0 w-100">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="ig-post-img w-100 object-fit-cover"
                  />
                </div>
              ))}
            </div>

            {/* Pagination Indicators Dots */}
            <div className="ig-carousel-dots d-flex justify-content-center gap-1 position-absolute bottom-0 start-50 translate-middle-x mb-2">
              {slideImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`ig-dot-btn border-0 rounded-circle ${
                    idx === currentIndex ? "active" : ""
                  }`}
                  aria-label={`Vai alla slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Post Action Bar */}
          <div className="ig-action-bar d-flex justify-content-between align-items-center px-3 pt-2 pb-1">
            <div className="d-flex align-items-center gap-3">
              <button
                className={`btn btn-link p-0 ${isLiked ? "text-danger" : "text-body"}`}
                onClick={handleLikeToggle}
                aria-label="Like post"
              >
                <i className={`bi ${isLiked ? "bi-heart-fill" : "bi-heart"} fs-4`}></i>
              </button>
              <button className="btn btn-link p-0 text-body" aria-label="Comment">
                <i className="bi bi-chat fs-4"></i>
              </button>
              <button className="btn btn-link p-0 text-body" aria-label="Share">
                <i className="bi bi-send fs-4"></i>
              </button>
            </div>
            <button
              className={`btn btn-link p-0 ${isBookmarked ? "text-primary" : "text-body"}`}
              onClick={handleBookmarkToggle}
              aria-label="Bookmark post"
            >
              <i className={`bi ${isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"} fs-4`}></i>
            </button>
          </div>

          {/* Likes & Caption */}
          <div className="ig-caption-section px-3 pb-3">
            <div className="fw-bold mb-1 fs-7">
              Piace a <span className="fw-bold">vincoeventi</span> e a{" "}
              <span className="fw-bold">{likeCount.toLocaleString()} altri</span>
            </div>
            <div className="ig-caption-text fs-7">
              <span className="fw-bold me-1">vincoeventi</span>
              {t.caption}
            </div>
            <div className="ig-hashtags text-primary fw-medium mt-1 fs-7">
              {t.hashtags}
            </div>
          </div>

          {/* Bottom IG Navigation Bar */}
          <div className="ig-bottom-nav d-flex justify-content-around align-items-center p-2 mt-auto border-top border-secondary border-opacity-10">
            <button className="btn btn-link p-0 text-body" aria-label="Home">
              <i className="bi bi-house-door-fill fs-5"></i>
            </button>
            <button className="btn btn-link p-0 text-body" aria-label="Search">
              <i className="bi bi-search fs-5"></i>
            </button>
            <button className="btn btn-link p-0 text-body" aria-label="Add">
              <i className="bi bi-plus-square fs-5"></i>
            </button>
            <button className="btn btn-link p-0 text-body" aria-label="Reels">
              <i className="bi bi-play-btn fs-5"></i>
            </button>
            <button className="btn btn-link p-0 text-body" aria-label="Profile">
              <img
                src={logoEnzo}
                alt="Profile"
                className="rounded-circle"
                style={{ width: "24px", height: "24px", objectFit: "cover" }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstagramMockup;
