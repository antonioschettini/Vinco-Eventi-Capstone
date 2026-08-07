/**
 * Utility per il Feedback Aptico (Vibrazione Leggera su Dispositivi Mobile)
 * Scatena una brevissima vibrazione impercettibile di 12ms per dare la sensazione
 * di un'applicazione nativa iOS/Android ad ogni interazione chiave.
 */
export const triggerHapticFeedback = (pattern = 12) => {
  if (
    typeof window !== "undefined" &&
    "navigator" in window &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* Le API di vibrazione tacciono se il dispositivo non le supporta */
    }
  }
};
