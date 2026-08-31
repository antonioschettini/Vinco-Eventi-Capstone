import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  togglePlay,
  nextTrack,
  prevTrack,
  setVolume,
  toggleMute,
  toggleModal,
} from "../../redux/slices/audioSlice";
import { toggleAudioSync, setAudioGain } from "../../utils/audioService";
import tracks from "../../data/tracksData";
import "./MobileBottomPlayer.css";

function MobileBottomPlayer() {
  const dispatch = useDispatch();
  const { isPlaying, volume, currentTrackIndex, isMuted } = useSelector(
    (state) => state.audio
  );

  const currentTrack = tracks[currentTrackIndex] || tracks[0];
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const volumePopoverRef = useRef(null);

  const handleVolumeChange = (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    dispatch(setVolume(clamped));
    setAudioGain(clamped);
  };

  const handleStepDown = () => {
    const current = isMuted ? 0 : volume;
    handleVolumeChange(Math.max(0, Math.round((current - 0.1) * 100) / 100));
  };

  const handleStepUp = () => {
    const current = isMuted ? 0 : volume;
    handleVolumeChange(Math.min(1, Math.round((current + 0.1) * 100) / 100));
  };

  // Chiude il popover se si clicca all'esterno di esso
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        volumePopoverRef.current &&
        !volumePopoverRef.current.contains(event.target)
      ) {
        setShowVolumePopover(false);
      }
    }
    if (showVolumePopover) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showVolumePopover]);

  return (
    <div className="mobile-bottom-player align-items-center justify-content-between px-3">
      {/* Info Traccia Cliccabile che apre il Modale Info */}
      <button
        onClick={() => dispatch(toggleModal())}
        className="mobile-track-info"
        title="Apri dettagli traccia"
      >
        <img
          src={currentTrack.cover}
          alt={currentTrack.title}
          className="player-cover-thumb rounded-circle"
        />
        <span className="track-marquee-wrapper">
          <span key={currentTrackIndex} className="track-marquee-text">
            {currentTrack.artist} - {currentTrack.title}
          </span>
        </span>
      </button>

      {/* Controlli Compatti Play/Pause, Prev, Next, Mute & Popover Volume */}
      <div className="mobile-controls d-flex align-items-center gap-1">
        <button
          onClick={() => dispatch(prevTrack(tracks.length))}
          className="top-player-btn"
          title="Traccia precedente"
          aria-label="Traccia precedente"
        >
          <i className="bi bi-skip-start-fill"></i>
        </button>

        <button
          onClick={() => {
            toggleAudioSync(isPlaying);
            dispatch(togglePlay());
          }}
          className="top-player-btn play-btn"
          title={isPlaying ? "Pausa" : "Riproduci"}
          aria-label={isPlaying ? "Pausa" : "Riproduci"}
        >
          <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`}></i>
        </button>

        <button
          onClick={() => dispatch(nextTrack(tracks.length))}
          className="top-player-btn"
          title="Traccia successiva"
          aria-label="Traccia successiva"
        >
          <i className="bi bi-skip-end-fill"></i>
        </button>

        {/* Contenitore e Popover Volume Mobile */}
        <div className="mobile-volume-wrapper position-relative" ref={volumePopoverRef}>
          <button
            onClick={() => setShowVolumePopover(!showVolumePopover)}
            className={`top-player-btn volume-btn ms-1 ${
              showVolumePopover ? "active" : ""
            }`}
            title="Regola Volume Audio"
            aria-label="Regola Volume Audio"
          >
            <i
              className={`bi ${
                isMuted || volume === 0
                  ? "bi-volume-mute-fill text-danger"
                  : volume < 0.5
                  ? "bi-volume-down-fill"
                  : "bi-volume-up-fill"
              }`}
            ></i>
          </button>

          {/* Popover Slider Volume Mobile con pulsanti Up/Down reattivi */}
          {showVolumePopover && (
            <div className="mobile-volume-popover p-2 shadow-lg rounded-3 d-flex align-items-center gap-1.5">
              <button
                onClick={() => dispatch(toggleMute())}
                className="btn btn-sm p-1 text-body border-0 flex-shrink-0"
                title={isMuted || volume === 0 ? "Attiva audio" : "Muto"}
                aria-label="Muto o Attiva Audio"
              >
                <i
                  className={`bi ${
                    isMuted || volume === 0
                      ? "bi-volume-mute-fill text-danger"
                      : "bi-volume-up-fill text-success"
                  }`}
                ></i>
              </button>
              <button
                type="button"
                onClick={handleStepDown}
                className="btn btn-sm p-1 text-body border-0 flex-shrink-0 mobile-vol-step-btn"
                title="Abbassa volume"
                aria-label="Abbassa volume"
              >
                <i className="bi bi-dash-lg"></i>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="mobile-volume-slider flex-grow-1"
                aria-label="Regola volume audio"
                aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
              <button
                type="button"
                onClick={handleStepUp}
                className="btn btn-sm p-1 text-body border-0 flex-shrink-0 mobile-vol-step-btn"
                title="Alza volume"
                aria-label="Alza volume"
              >
                <i className="bi bi-plus-lg"></i>
              </button>
              <span className="mobile-volume-text extra-small fw-bold flex-shrink-0">
                {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileBottomPlayer;
