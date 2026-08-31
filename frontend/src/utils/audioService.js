/**
 * Audio Service Singleton
 * Gestore centralizzato e sincrono della riproduzione audio per garantire
 * la compatibilità al 100% con le policy di autoplay e controllo del volume
 * su tutte le piattaforme (iOS Safari, iPadOS, Android Chrome, macOS, Windows).
 * 
 * Su Apple WebKit (iOS/iPadOS):
 * 1) .play() DEVE essere invocato sincronicamente durante l'evento utente (click/touch).
 * 2) HTMLMediaElement.volume è bloccato dal sistema operativo a 1.0 (read-only).
 *    Per permettere la regolazione reale del volume (volume up, volume down, slider, mute)
 *    utilizziamo la Web Audio API con un GainNode interposto tra sorgente e destinazione.
 */

let globalAudioElement = null;
let audioCtx = null;
let gainNode = null;
let sourceNode = null;
let currentGainVolume = 0.50;
let userHasInteracted = false;

// Sblocca la Web Audio API e l'AudioContext al primo tocco o click dell'utente
if (typeof window !== "undefined") {
  const unlockAudioContext = () => {
    userHasInteracted = true;
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener("click", unlockAudioContext);
    window.removeEventListener("touchstart", unlockAudioContext);
    window.removeEventListener("keydown", unlockAudioContext);
  };

  window.addEventListener("click", unlockAudioContext, { passive: true });
  window.addEventListener("touchstart", unlockAudioContext, { passive: true });
  window.addEventListener("keydown", unlockAudioContext, { passive: true });
}

export function registerAudioElement(el) {
  globalAudioElement = el;
}

export function getAudioElement() {
  if (!globalAudioElement) {
    globalAudioElement = document.getElementById("vinco-global-audio");
  }
  return globalAudioElement;
}

export function getAudioContext(forceCreate = false) {
  // Crea l'AudioContext solo dopo la prima interazione utente (o se forzato da un'azione esplicita come play/slider)
  // per rispettare le policy di autoplay di Chrome/Safari ed evitare avvisi in console.
  if (!audioCtx && (userHasInteracted || forceCreate)) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
      } catch (_) {
        // Ignora se non supportato
      }
    }
  }
  return audioCtx;
}

export function initAudioGain(audioElement, isUserAction = false) {
  const el = audioElement || getAudioElement();
  if (!el) return;
  try {
    const ctx = getAudioContext(isUserAction);
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (!sourceNode) {
      sourceNode = ctx.createMediaElementSource(el);
      gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(currentGainVolume, ctx.currentTime);
      sourceNode.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
  } catch (_) {
    // Se già collegato o inizializzazione differita, gestisce silenziosamente
  }
}

export function setAudioGain(volume, isUserAction = false) {
  const safeVol = Math.max(0, Math.min(1, typeof volume === "number" ? volume : 0.50));
  currentGainVolume = safeVol;

  // 1. Aggiorna volume standard HTML5 per desktop e browser Android
  const audio = getAudioElement();
  if (audio) {
    try {
      audio.volume = safeVol;
    } catch {
      // Ignora restrizioni di volume sui browser mobile non supportati
    }
  }

  // 2. Aggiorna GainNode Web Audio API per iOS Safari e mobile
  const ctx = getAudioContext(isUserAction);
  if (ctx && gainNode) {
    try {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      gainNode.gain.setValueAtTime(safeVol, ctx.currentTime);
    } catch (_) {
      // Fallback silenzioso
    }
  }
}

export function playAudioSync() {
  const audio = getAudioElement();
  if (audio) {
    initAudioGain(audio, true);
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Ignora AbortError fisiologico (es. cambio rapido traccia o navigazione)
          if (err && err.name !== "AbortError" && err.name !== "NotAllowedError") {
            console.info("[Audio] Riproduzione in attesa:", err.message || err);
          }
        });
      }
    } catch (_) {
      // Fallback sincrono silenzioso
    }
  }
}

export function pauseAudioSync() {
  const audio = getAudioElement();
  if (audio && !audio.paused) {
    try {
      audio.pause();
    } catch (_) {
      // Fallback silenzioso
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
