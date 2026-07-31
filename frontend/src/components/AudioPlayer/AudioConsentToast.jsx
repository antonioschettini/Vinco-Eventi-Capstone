import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setIsPlaying, setAutoplayBlocked } from "../../redux/slices/audioSlice";
import "./AudioConsentToast.css";

function AudioConsentToast() {
  const dispatch = useDispatch();
  const { autoplayBlocked, isPlaying } = useSelector((state) => state.audio);
  const [dismissed, setDismissed] = useState(false);

  // Se l'audio sta già suonando o l'utente ha chiuso il toast, non mostrare
  if (!autoplayBlocked || isPlaying || dismissed) {
    return null;
  }

  const handleActivateAudio = () => {
    dispatch(setIsPlaying(true));
    dispatch(setAutoplayBlocked(false));
    setDismissed(true);
  };

  return (
    <div className="audio-consent-toast shadow-lg rounded-4 p-3 d-flex flex-column gap-2">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <div className="audio-toast-icon-wrapper">
            <i className="bi bi-music-note-beamed text-success fs-5"></i>
          </div>
          <span className="fw-bold small">Musica di Sottofondo</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="btn-close-toast"
          aria-label="Chiudi"
          title="Chiudi"
        >
          <i className="bi bi-x"></i>
        </button>
      </div>

      <p className="toast-description mb-1">
        Attiva l'audio per vivere l'esperienza musicale completa di <strong>Vinco Eventi</strong> durante la tua navigazione!
      </p>

      <div className="toast-legend-info d-flex align-items-center gap-1 small text-muted mb-2">
        <i className="bi bi-info-circle-fill text-success"></i>
        <span>
          Puoi controllare la musica in qualsiasi momento dal player in alto nella Navbar e dal modale fluttuante trascinabile.
        </span>
      </div>

      <button
        onClick={handleActivateAudio}
        className="btn btn-forest-activate btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2"
      >
        <i className="bi bi-play-fill fs-5"></i>
        <span>Attiva Musica Ora</span>
      </button>
    </div>
  );
}

export default AudioConsentToast;
