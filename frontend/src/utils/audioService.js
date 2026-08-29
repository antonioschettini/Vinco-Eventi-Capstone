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
let currentGainVolume = 0.20;

export function registerAudioElement(el) {
  globalAudioElement = el;
}

export function getAudioElement() {
  if (!globalAudioElement) {
    globalAudioElement = document.getElementById("vinco-global-audio");
  }
  return globalAudioElement;
}

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function initAudioGain(audioElement) {
  const el = audioElement || getAudioElement();
  if (!el) return;
  try {
    const ctx = getAudioContext();
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
  } catch (e) {
    // Se già collegato o non supportato, non bloccare
    console.warn("[WebAudio] GainNode setup notice:", e.message || e);
  }
}

export function setAudioGain(volume) {
  const safeVol = Math.max(0, Math.min(1, typeof volume === "number" ? volume : 0.20));
  currentGainVolume = safeVol;

  // 1. Aggiorna volume standard HTML5 per desktop e browser Android che lo supportano
  const audio = getAudioElement();
  if (audio) {
    try {
      audio.volume = safeVol;
    } catch (e) {}
  }

  // 2. Aggiorna GainNode Web Audio API per iOS Safari e mobile
  const ctx = getAudioContext();
  if (ctx && gainNode) {
    try {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      gainNode.gain.setValueAtTime(safeVol, ctx.currentTime);
    } catch (e) {
      console.warn("[WebAudio] Set gain error:", e);
    }
  }
}

export function playAudioSync() {
  const audio = getAudioElement();
  if (audio) {
    initAudioGain(audio);
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
