import { openEmailModal } from "../redux/slices/uiSlice";

export const isMobileDevice = () => {
  if (typeof window === "undefined" || !window.navigator) return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768
  );
};

/**
 * Gestisce il click sull'email.
 * - Su Mobile: scatena il mailto: nativo aprendo l'app di posta di sistema (Outlook, Mail, Gmail app).
 * - Su Desktop: apre un modale di scelta rapida (Outlook Desktop, Outlook Web, Gmail Web, Copia Email)
 *   per garantire zero blocchi e massima flessibilità d'uso.
 */
export const handleEmailClick = (e, email = "vincoeventi@gmail.com", dispatch = null) => {
  const isMobile = isMobileDevice();

  if (!isMobile) {
    if (e && e.preventDefault) e.preventDefault();
    if (dispatch) {
      dispatch(openEmailModal(email));
    } else {
      // Fallback nel caso in cui dispatch non sia passato
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
          email
        )}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }
};

/**
 * Gestisce il click sul numero di telefono (+39 349 294 9669).
 * - Su Mobile: scatena il protocollo tel: aprendo l'interfaccia nativa del tastierino/dialer telefonico.
 * - Su Desktop: apre la chat WhatsApp Web per consentire il contatto diretto immediato
 *   in assenza di un'app di telefonia desktop configurata.
 */
export const handlePhoneClick = (e, phone = "+393492949669") => {
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const isMobile = isMobileDevice();

  if (!isMobile) {
    if (e && e.preventDefault) e.preventDefault();
    const cleanNumOnly = cleanPhone.replace("+", "");
    window.open(
      `https://wa.me/${cleanNumOnly}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
};
