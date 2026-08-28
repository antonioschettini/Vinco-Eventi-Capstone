import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setIsPlaying, setAutoplayBlocked } from "../../redux/slices/audioSlice";
import { playAudioSync } from "../../utils/audioService";
import "./AudioConsentToast.css";

function AudioConsentToast() {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const { autoplayBlocked, isPlaying } = useSelector((state) => state.audio);
  const [dismissed, setDismissed] = useState(false);

  // Se l'audio sta già suonando o l'utente ha chiuso il toast, non mostrare
  if (!autoplayBlocked || isPlaying || dismissed) {
    return null;
  }

  const handleActivateAudio = () => {
    // Sblocco e avvio sincrono obbligatorio all'interno del gesto utente per iOS Safari / Apple WebKit
    playAudioSync();
    dispatch(setIsPlaying(true));
    dispatch(setAutoplayBlocked(false));
    setDismissed(true);
  };

  const isEn = lang === "en";

  return (
    <div className="audio-consent-toast shadow-lg rounded-4 p-3 d-flex flex-column gap-2">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div className="audio-toast-icon-wrapper">
            <i className="bi bi-music-note-beamed text-success fs-5"></i>
          </div>
          <span className="fw-bold small">
            {isEn ? "Background Music" : "Musica di Sottofondo"}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="btn-close-toast"
          aria-label={isEn ? "Close" : "Chiudi"}
          title={isEn ? "Close" : "Chiudi"}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>

      <p className="toast-description mb-1">
        {isEn ? (
          <>
            Enable audio to experience the complete musical atmosphere of{" "}
            <strong>VINCO EVENTI</strong> while browsing!
          </>
        ) : (
          <>
            Attiva l'audio per vivere l'esperienza musicale completa di{" "}
            <strong>VINCO EVENTI</strong> durante la tua navigazione!
          </>
        )}
      </p>

      <div className="toast-legend-info d-flex align-items-center gap-1 small text-muted mb-2">
        <i className="bi bi-info-circle-fill text-success"></i>
        <span>
          {isEn
            ? "You can control music anytime from the top player in the Navbar."
            : "Puoi controllare la musica in qualsiasi momento dal player in alto nella Navbar."}
        </span>
      </div>

      <button
        onClick={handleActivateAudio}
        className="btn btn-forest-activate btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2"
      >
        <i className="bi bi-play-fill fs-5"></i>
        <span>{isEn ? "Activate Music Now" : "Attiva Musica Ora"}</span>
      </button>
    </div>
  );
}

export default AudioConsentToast;

