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

  const { isPlaying, volume, currentTrackIndex } = useSelector(
    (state) => state.audio
  );

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Inizializzazione al montaggio: per rispettare la policy del browser, l'audio non parte finché l'utente non interagisce
  useEffect(() => {
    dispatch(setAutoplayBlocked(true));
  }, [dispatch]);

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
  }, [currentTrackIndex, currentTrack.src, isPlaying]);

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
