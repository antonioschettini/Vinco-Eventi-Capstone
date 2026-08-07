import { useState, useEffect, useRef } from "react";
import { Modal } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { setIsPlaying } from "../../redux/slices/audioSlice";
import { translations, getCategoryLabel } from "../../utils/translations";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";
import { triggerHapticFeedback } from "../../utils/vibration";
import "./MediaModal.css";

function MediaModal({ show, onHide, items, currentIndex, onNavigate }) {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const isAudioPlaying = useSelector((state) => state.audio.isPlaying);
  const t = translations[lang].gallery;

  const currentMedia = items && items[currentIndex] ? items[currentIndex] : null;

  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVideoError(false);
  }, [show, currentIndex]);

  const isAudioPlayingRef = useRef(isAudioPlaying);
  const wasAudioPlayingRef = useRef(false);

  // Touch Swipe Gesture Support per dispositivi Mobile
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);

  useEffect(() => {
    isAudioPlayingRef.current = isAudioPlaying;
  }, [isAudioPlaying]);

  // Gestione Mute/Pausa dell'audio di sottofondo alla riproduzione video nella gallery
  useEffect(() => {
    const isVideoModalOpen = show && currentMedia && currentMedia.type === "video";

    if (isVideoModalOpen) {
      if (isAudioPlayingRef.current) {
        wasAudioPlayingRef.current = true;
        dispatch(setIsPlaying(false));
      }
    } else {
      if (wasAudioPlayingRef.current) {
        wasAudioPlayingRef.current = false;
        dispatch(setIsPlaying(true));
      }
    }
  }, [show, currentMedia, dispatch]);

  useEffect(() => {
    if (!show || !items || items.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate((currentIndex - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate((currentIndex + 1) % items.length);
      } else if (e.key === "Escape") {
        onHide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, currentIndex, items, onNavigate, onHide]);

  // Pre-caricamento (prefetch) in background delle copertine/immagini adiacenti in JS per azzerare la latenza visiva ed evitare warning HTML <link rel="preload">
  const nextItem = items && items.length > 1 ? items[(currentIndex + 1) % items.length] : null;
  const prevItem = items && items.length > 1 ? items[(currentIndex - 1 + items.length) % items.length] : null;

  const nextPosterUrl = nextItem ? (nextItem.posterUrl || getOptimizedCloudinaryUrl(nextItem.src, { type: "poster" })) : null;
  const prevPosterUrl = prevItem ? (prevItem.posterUrl || getOptimizedCloudinaryUrl(prevItem.src, { type: "poster" })) : null;

  useEffect(() => {
    if (!show) return;

    if (nextPosterUrl) {
      const imgNext = new Image();
      imgNext.src = nextPosterUrl;
    }
    if (prevPosterUrl) {
      const imgPrev = new Image();
      imgPrev.src = prevPosterUrl;
    }
  }, [show, nextPosterUrl, prevPosterUrl]);

  if (!currentMedia) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    onNavigate((currentIndex - 1 + items.length) % items.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    onNavigate((currentIndex + 1) % items.length);
  };

  const modalMediaUrl = getOptimizedCloudinaryUrl(currentMedia.src, { type: "modal" });
  const posterUrl = currentMedia.posterUrl || getOptimizedCloudinaryUrl(currentMedia.src, { type: "poster" });

  const minSwipeDistance = 45;

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length === 1) {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // Se il movimento è prevalentemente verticale verso il basso (swipe down) -> Chiudi modale
    if (Math.abs(diffY) > Math.abs(diffX) && diffY < -65) {
      triggerHapticFeedback(15);
      onHide();
    } else if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance && items && items.length > 1) {
      // Movimento prevalentemente orizzontale -> Navigazione foto/video
      triggerHapticFeedback(12);
      if (diffX > 0) {
        onNavigate((currentIndex + 1) % items.length);
      } else {
        onNavigate((currentIndex - 1 + items.length) % items.length);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="xl"
      dialogClassName="media-modal-dialog"
      contentClassName="media-modal-content border-0 rounded-4 overflow-hidden"
      backdropClassName="media-modal-backdrop"
    >
      <div className="media-modal-header d-flex justify-content-between align-items-center p-3 p-md-4">
        <div className="media-modal-info">
          <span className="badge rounded-pill media-badge-type me-2 px-3 py-2">
            {currentMedia.type === "video" ? t.videoBadge : t.photoBadge}
          </span>
          {currentMedia.category && (
            <span className="badge rounded-pill media-badge-category me-2 px-3 py-2">
              <i className="bi bi-tag-fill me-1"></i>
              {getCategoryLabel(currentMedia.category, lang)}
            </span>
          )}
          <span className="media-modal-counter fs-6">
            {t.mediaCounter} {currentIndex + 1} {t.of} {items.length}
          </span>
          {currentMedia.title && (
            <h5 className="h5 font-heading media-modal-title mb-0 mt-1">
              {currentMedia.title}
            </h5>
          )}
        </div>
        <button
          type="button"
          className="btn-close media-modal-close-btn p-2"
          onClick={onHide}
          aria-label={t.modalClose}
        ></button>
      </div>

      <div
        className="media-modal-body position-relative d-flex justify-content-center align-items-center p-2 p-md-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
          {/* Navigation Arrow Left */}
          {items.length > 1 && (
            <button
              type="button"
              className="media-nav-btn media-nav-prev"
              onClick={handlePrev}
              aria-label={t.modalPrev}
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          )}

          {/* Media Container */}
          <div className="media-display-wrapper d-flex justify-content-center align-items-center w-100 h-100">
            {currentMedia.type === "video" && !videoError ? (
              <video
                ref={(el) => {
                  if (el) el.volume = 0.2;
                }}
                key={currentMedia.id || currentMedia.src}
                src={currentMedia.startTime ? `${modalMediaUrl}#t=${currentMedia.startTime}` : modalMediaUrl}
                poster={posterUrl}
                controls
                autoPlay
                loop
                preload="auto"
                playsInline
                onError={() => setVideoError(true)}
                className="media-player-element rounded-3"
              />
            ) : (
              <img
                src={currentMedia.type === "video" ? posterUrl : modalMediaUrl}
                alt={currentMedia.title || "Gallery image"}
                className="media-image-element rounded-3"
              />
            )}
          </div>

          {/* Navigation Arrow Right */}
          {items.length > 1 && (
            <button
              type="button"
              className="media-nav-btn media-nav-next"
              onClick={handleNext}
              aria-label={t.modalNext}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          )}
        </div>

        {currentMedia.subtitle && (
          <div className="media-modal-footer p-3 text-center fs-6">
            {currentMedia.subtitle}
          </div>
        )}
      </Modal>
  );
}

export default MediaModal;
