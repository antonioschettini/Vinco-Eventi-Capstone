import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  togglePlay,
  nextTrack,
  prevTrack,
  setVolume,
  toggleMute,
  setIsModalOpen,
  setModalPosition,
} from "../../redux/slices/audioSlice";
import { translations } from "../../utils/translations";
import tracks from "../../data/tracksData";
import "./TrackModal.css";

function TrackModal() {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.playerModal || translations.it.playerModal;

  const {
    isPlaying,
    volume,
    currentTrackIndex,
    isModalOpen,
    isMuted,
    modalPosition,
  } = useSelector((state) => state.audio);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Inizializza o recupera la posizione del modale (default: in alto a sinistra a specchio rispetto al modale di consenso)
  const [position, setPosition] = useState(() => {
    if (modalPosition) return modalPosition;
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 576;
    const defaultX = isMobile ? 12 : 20;
    const defaultY = isMobile ? 48 : 52;
    return { x: defaultX, y: defaultY };
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [prevModalPos, setPrevModalPos] = useState(modalPosition);
  if (modalPosition && modalPosition !== prevModalPos) {
    setPrevModalPos(modalPosition);
    setPosition(modalPosition);
  }

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const clampedX = Math.min(prev.x, Math.max(10, window.innerWidth - 260));
        const clampedY = Math.min(prev.y, Math.max(10, window.innerHeight - 340));
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isModalOpen) return null;

  // --- Gestione Drag con Pointer & Touch ---
  const startDrag = (clientX, clientY, target, pointerId = null) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };
    if (pointerId !== null && target.setPointerCapture) {
      try {
        target.setPointerCapture(pointerId);
      } catch {
        /* ignore pointer capture failure */
      }
    }
  };

  const moveDrag = (clientX, clientY) => {
    if (!isDraggingRef.current) return;
    const newX = clientX - dragStartRef.current.x;
    const newY = clientY - dragStartRef.current.y;
    const maxX = window.innerWidth - 250;
    const maxY = window.innerHeight - 320;
    const nextPos = {
      x: Math.max(8, Math.min(newX, maxX)),
      y: Math.max(8, Math.min(newY, maxY)),
    };
    setPosition(nextPos);
    dispatch(setModalPosition(nextPos));
  };

  const endDrag = (target, pointerId = null) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (pointerId !== null && target.releasePointerCapture) {
        try {
          target.releasePointerCapture(pointerId);
        } catch {
          /* ignore pointer release failure */
        }
      }
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    dispatch(setIsModalOpen(false));
  };

  return (
    <div
      className="track-modal-card shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header Modale Compatto con Drag Handle isolato */}
      <div className="track-modal-header d-flex justify-content-between align-items-center py-1 px-2">
        <div
          className="drag-handle d-flex align-items-center gap-1 flex-grow-1 py-1"
          onPointerDown={(e) => startDrag(e.clientX, e.clientY, e.currentTarget, e.pointerId)}
          onPointerMove={(e) => moveDrag(e.clientX, e.clientY)}
          onPointerUp={(e) => endDrag(e.currentTarget, e.pointerId)}
          onTouchStart={(e) => {
            if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1 && isDraggingRef.current) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={(e) => endDrag(e.currentTarget)}
        >
          <i className="bi bi-grip-horizontal text-secondary fs-6"></i>
          <span className="fw-semibold track-header-title">{t.title || "VINCO EVENTI Player"}</span>
        </div>

        {/* Pulsante Chiudi X con StopPropagation per risposta immediata */}
        <button
          onClick={handleClose}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="btn-close-modal"
          aria-label={t.close || "Chiudi"}
          title={t.close || "Chiudi"}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Body del Modale Compatto */}
      <div className="track-modal-body p-2 text-center">
        <div className="cover-wrapper mb-2 mx-auto">
          <img
            src={currentTrack.cover}
            alt={currentTrack.title}
            className="cover-img rounded shadow-sm"
          />
        </div>

        <h6 className="track-title mb-0 fw-bold text-truncate" title={currentTrack.title}>
          {currentTrack.title}
        </h6>
        <p className="track-artist mb-2 text-muted small text-truncate">
          {currentTrack.artist}
        </p>

        {/* Controlli di Riproduzione Compatti */}
        <div className="modal-controls d-flex justify-content-center align-items-center gap-2 mb-2">
          <button
            onClick={() => dispatch(prevTrack(tracks.length))}
            className="btn-modal-ctrl"
            title={t.prevTrack || "Traccia precedente"}
            aria-label={t.prevTrack || "Traccia precedente"}
          >
            <i className="bi bi-skip-start-fill fs-5"></i>
          </button>

          <button
            onClick={() => dispatch(togglePlay())}
            className="btn-modal-play shadow-sm"
            title={isPlaying ? (t.pause || "Pausa") : (t.play || "Riproduci")}
            aria-label={isPlaying ? (t.pause || "Pausa") : (t.play || "Riproduci")}
          >
            <i
              className={`bi ${
                isPlaying ? "bi-pause-fill" : "bi-play-fill"
              } fs-4`}
            ></i>
          </button>

          <button
            onClick={() => dispatch(nextTrack(tracks.length))}
            className="btn-modal-ctrl"
            title={t.nextTrack || "Traccia successiva"}
            aria-label={t.nextTrack || "Traccia successiva"}
          >
            <i className="bi bi-skip-end-fill fs-5"></i>
          </button>
        </div>

        {/* Controllo Volume Compatto */}
        <div className="modal-volume-control d-flex align-items-center gap-1 px-1">
          <button
            onClick={() => dispatch(toggleMute())}
            className="btn-volume-icon p-0 border-0 bg-transparent text-secondary"
            title={isMuted || volume === 0 ? (t.unmute || "Attiva audio") : (t.mute || "Muto")}
            aria-label={t.toggleAudio || "Disattiva/Attiva audio"}
          >
            <i
              className={`bi ${
                isMuted || volume === 0
                  ? "bi-volume-mute-fill text-danger"
                  : volume < 0.5
                  ? "bi-volume-down-fill"
                  : "bi-volume-up-fill"
              } fs-6`}
            ></i>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
            className="form-range volume-range flex-grow-1"
          />
          <span className="volume-percent extra-small fw-semibold text-muted">
            {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TrackModal;
