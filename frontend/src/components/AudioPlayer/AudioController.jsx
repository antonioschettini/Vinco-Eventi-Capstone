import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setIsPlaying,
  nextTrack,
  prevTrack,
  setAutoplayBlocked,
} from "../../redux/slices/audioSlice";
import tracks from "../../data/tracksData";
import AudioConsentToast from "./AudioConsentToast";
import {
  registerAudioElement,
  initAudioGain,
  setAudioGain,
} from "../../utils/audioService";

function AudioController() {
  const dispatch = useDispatch();
  const audioRef = useRef(null);

  const { isPlaying, volume, currentTrackIndex, isMuted } = useSelector(
    (state) => state.audio
  );

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Inizializzazione al montaggio: registra l'istanza globale per l'avvio sincrono e imposta stato autoplay
  useEffect(() => {
    if (audioRef.current) {
      registerAudioElement(audioRef.current);
      initAudioGain(audioRef.current);
    }
    dispatch(setAutoplayBlocked(true));
  }, [dispatch]);

  // Sincronizza stato isPlaying di Redux con l'elemento Audio HTML5
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[AudioController] Riproduzione in attesa di interazione utente (iOS):", err);
          });
        }
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      } catch {
        /* ignore legacy mediaSession playbackState error */
      }
    }
  }, [isPlaying]);

  // Sincronizza il volume cross-device con Web Audio GainNode & HTML5 volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      initAudioGain(audio);
      const effectiveVol = isMuted ? 0 : volume;
      setAudioGain(effectiveVol);
    }
  }, [volume, isMuted]);

  // Sincronizza cambio traccia e MediaSession API per controlli mobile / schermata di blocco
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = currentTrack.src;
    if (isPlaying) {
      audio.play().catch((err) => console.warn("Errore cambio traccia:", err));
    }

    // Integrazione Media Session API (Controlli mobile da schermata di blocco, tasti volume ed auto/bluetooth)
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || "Vincenzo Colaluca",
          album: "VINCO EVENTI",
          artwork: [
            {
              src: currentTrack.cover,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        });

        const setSafeHandler = (action, handler) => {
          try {
            navigator.mediaSession.setActionHandler(action, handler);
          } catch {
            /* ignore unsupported mediaSession action */
          }
        };

        setSafeHandler("play", () => dispatch(setIsPlaying(true)));
        setSafeHandler("pause", () => dispatch(setIsPlaying(false)));
        setSafeHandler("previoustrack", () => dispatch(prevTrack(tracks.length)));
        setSafeHandler("nexttrack", () => dispatch(nextTrack(tracks.length)));
        setSafeHandler("stop", () => dispatch(setIsPlaying(false)));
      } catch (e) {
        console.warn("[MediaSession] Setup notice:", e);
      }
    }
  }, [currentTrackIndex, currentTrack, isPlaying, dispatch]);

  // Evento di fine traccia -> Passa automaticamente alla traccia successiva
  const handleEnded = () => {
    dispatch(nextTrack(tracks.length));
  };

  return (
    <>
      <audio
        id="vinco-global-audio"
        ref={audioRef}
        src={currentTrack.src}
        preload="none"
        playsInline
        onEnded={handleEnded}
      />
      <AudioConsentToast />
    </>
  );
}

export default AudioController;
