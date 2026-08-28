/**
 * Audio Service Singleton
 * Gestore centralizzato e sincrono della riproduzione audio per garantire
 * la compatibilità al 100% con le policy di autoplay restrittive di Apple (iOS Safari, iPadOS, macOS Safari).
 * 
 * Su Apple WebKit, .play() DEVE essere invocato sincronicamente all'interno dell'evento di click/touch dell'utente,
 * altrimenti l'esecuzione asincrona differita da useEffect/Redux viene rigettata con NotAllowedError.
 */

let globalAudioElement = null;

export function registerAudioElement(el) {
  globalAudioElement = el;
}

export function getAudioElement() {
  if (!globalAudioElement) {
    globalAudioElement = document.getElementById("vinco-global-audio");
  }
  return globalAudioElement;
}

export function playAudioSync() {
  const audio = getAudioElement();
  if (audio) {
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[iOS Audio Sync] Riproduzione in attesa di sblocco:", err);
        });
      }
    } catch (e) {
      console.warn("[iOS Audio Sync] Errore sync play:", e);
    }
  }
}

export function pauseAudioSync() {
  const audio = getAudioElement();
  if (audio && !audio.paused) {
    try {
      audio.pause();
    } catch (e) {
      console.warn("[iOS Audio Sync] Errore sync pause:", e);
    }
  }
}

export function toggleAudioSync(isPlaying) {
  if (isPlaying) {
    pauseAudioSync();
  } else {
    playAudioSync();
  }
}
