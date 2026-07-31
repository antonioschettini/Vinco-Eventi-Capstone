import { useSelector, useDispatch } from "react-redux";
import {
  togglePlay,
  nextTrack,
  prevTrack,
  toggleMute,
  toggleModal,
} from "../../redux/slices/audioSlice";
import tracks from "../../data/tracksData";
import "./MobileBottomPlayer.css";

function MobileBottomPlayer() {
  const dispatch = useDispatch();
  const { isPlaying, volume, currentTrackIndex, isMuted } = useSelector(
    (state) => state.audio
  );

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

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

      {/* Controlli Compatti Play/Pause, Prev, Next, Mute */}
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
          onClick={() => dispatch(togglePlay())}
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

        <button
          onClick={() => dispatch(toggleMute())}
          className="top-player-btn volume-btn ms-1"
          title={isMuted || volume === 0 ? "Attiva audio" : "Muto"}
          aria-label="Volume audio"
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
      </div>
    </div>
  );
}

export default MobileBottomPlayer;
