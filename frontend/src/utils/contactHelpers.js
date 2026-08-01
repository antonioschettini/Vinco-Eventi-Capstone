/**
 * Utility per la gestione universale dei link email e dei numeri di telefono su Desktop e Mobile.
 */

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
 * - Su Mobile: scatena il mailto: nativo aprendo l'app di posta di sistema.
 * - Su Desktop: apre la schermata di composizione di Gmail Web in una nuova scheda,
 *   permettendo l'invio immediato anche a chi non ha un client desktop (es. Outlook) configurato.
 */
export const handleEmailClick = (e, email = "vincoeventi@gmail.com") => {
  const isMobile = isMobileDevice();

  if (!isMobile) {
    if (e && e.preventDefault) e.preventDefault();
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        email
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
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
