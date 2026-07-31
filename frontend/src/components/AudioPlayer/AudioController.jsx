import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setIsPlaying,
  nextTrack,
  setAutoplayBlocked,
} from "../../redux/slices/audioSlice";
import tracks from "../../data/tracksData";
import AudioConsentToast from "./AudioConsentToast";

function AudioController() {
  const dispatch = useDispatch();
  const audioRef = useRef(null);

  const { isPlaying, volume, currentTrackIndex, autoplayBlocked } = useSelector(
    (state) => state.audio
  );

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Inizializzazione al montaggio e tentato Autoplay con gestione della policy del browser
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    // Tentativo di autoplay al montaggio
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          dispatch(setIsPlaying(true));
          dispatch(setAutoplayBlocked(false));
        })
        .catch((error) => {
          // Autoplay bloccato dalla policy di interazione del browser
          console.warn("Autoplay audio bloccato dalle policy del browser:", error);
          dispatch(setIsPlaying(false));
          dispatch(setAutoplayBlocked(true));
        });
    }
  }, []);

  // Gestore per avviare il play al primo click/tocco dell'utente se l'autoplay è stato bloccato
  useEffect(() => {
    if (!autoplayBlocked) return;

    const handleFirstUserInteraction = () => {
      const audio = audioRef.current;
      if (audio) {
        audio
          .play()
          .then(() => {
            dispatch(setIsPlaying(true));
            dispatch(setAutoplayBlocked(false));
          })
          .catch((err) => {
            console.error("Errore nel riprodurre l'audio dopo l'interazione:", err);
          });
      }
    };

    window.addEventListener("pointerdown", handleFirstUserInteraction, {
      once: true,
    });
    window.addEventListener("click", handleFirstUserInteraction, {
      once: true,
    });
    window.addEventListener("touchstart", handleFirstUserInteraction, {
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", handleFirstUserInteraction);
      window.removeEventListener("click", handleFirstUserInteraction);
      window.removeEventListener("touchstart", handleFirstUserInteraction);
    };
  }, [autoplayBlocked, dispatch]);

  // Sincronizza stato isPlaying di Redux con l'elemento Audio HTML5
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.paused) {
        audio.play().catch((err) => {
          console.warn("Riproduzione interrotta o bloccata:", err);
          dispatch(setIsPlaying(false));
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, dispatch]);

  // Sincronizza il volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Sincronizza cambio traccia
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = currentTrack.src;
    if (isPlaying) {
      audio.play().catch((err) => console.warn("Errore cambio traccia:", err));
    }
  }, [currentTrackIndex]);

  // Evento di fine traccia -> Passa automaticamente alla traccia successiva
  const handleEnded = () => {
    dispatch(nextTrack(tracks.length));
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="auto"
        onEnded={handleEnded}
      />
      <AudioConsentToast />
    </>
  );
}

export default AudioController;
