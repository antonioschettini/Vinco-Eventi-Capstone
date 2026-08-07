import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { closeEmailModal } from "../../redux/slices/uiSlice";
import { translations } from "../../utils/translations";
import "./EmailChoiceModal.css";

export default function EmailChoiceModal() {
  const dispatch = useDispatch();
  const modalDialogRef = useRef(null);
  const { isOpen, email } = useSelector((state) => state.ui.emailModal);
  const language = useSelector((state) => state.ui.language);
  const t = translations[language]?.emailModal || translations.it.emailModal;

  const [copied, setCopied] = useState(false);

  // Reset del feedback "Copiato" quando il modale si chiude
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setCopied(false);
    }
  }

  // Gestione tasto ESC e Focus Trap per il modale
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        dispatch(closeEmailModal());
      } else if (e.key === "Tab" && modalDialogRef.current) {
        const focusables = modalDialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error("Impossibile copiare negli appunti:", err);
    }
  };

  const handleClose = () => {
    dispatch(closeEmailModal());
  };

  return (
    <div
      className="modal fade show d-block email-modal-backdrop"
      tabIndex={-1}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emailChoiceModalTitle"
    >
      <div
        ref={modalDialogRef}
        className="modal-dialog modal-dialog-centered email-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg email-modal-content">
          {/* Header */}
          <div className="modal-header border-0 pb-0 d-flex align-items-start justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div className="email-modal-icon-badge rounded-circle d-flex align-items-center justify-content-center">
                <i className="bi bi-envelope-heart-fill fs-4 text-gold"></i>
              </div>
              <div>
                <h5 className="modal-title font-heading fw-bold mb-0" id="emailChoiceModalTitle">
                  {t.title}
                </h5>
                <span className="badge bg-gold-subtle text-gold mt-1 font-monospace px-2 py-1 border border-gold-subtle">
                  {email}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-custom"
              aria-label={t.close}
              onClick={handleClose}
            ></button>
          </div>

          {/* Subtitle */}
          <div className="modal-body pt-3 pb-4">
            <p className="text-secondary small mb-3">{t.subtitle}</p>

            {/* Banner notifica copia negli appunti */}
            {copied && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-3 fade show border-0 shadow-sm rounded-3">
                <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                <span className="small fw-semibold">{t.copiedSuccess}</span>
              </div>
            )}

            {/* Griglia / Lista Opzioni Email */}
            <div className="d-flex flex-column gap-2">
              {/* Opzione 1: Gmail Web (Logo Ufficiale Google 4 Colori) */}
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="email-option-card d-flex align-items-center p-3 rounded-3 text-decoration-none transition-all"
                onClick={handleClose}
              >
                <div className="option-icon-wrapper rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: "42px", height: "42px", minWidth: "42px" }}>
                  <svg width="22" height="22" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.60l6.9-6.9C35.9 2.38 30.47 0 24 0 14.66 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.42 17.6 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59C9.97 26.91 9.97 25.09 10.53 23.41l-7.98-6.19C1.01 19.83 0 21.85 0 24c0 2 .15 4.17.75 6.18l7.98-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.4 0-11.57-3.92-13.47-9.31l-7.98 6.19C6.51 42.62 14.66 48 24 48z"/>
                  </svg>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-body d-flex align-items-center gap-2">
                    {t.gmailWeb}
                    <i className="bi bi-box-arrow-up-right small text-muted"></i>
                  </div>
                  <div className="text-muted extra-small">{t.gmailWebSub}</div>
                </div>
              </a>

              {/* Opzione 2: App Email Predefinita (Apple Mail su Mac/iOS, Outlook su Windows, Gmail app su Android) */}
              <a
                href={`mailto:${email}`}
                className="email-option-card d-flex align-items-center p-3 rounded-3 text-decoration-none transition-all"
                onClick={handleClose}
              >
                <div className="option-icon-wrapper rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center me-3" style={{ width: "42px", height: "42px", minWidth: "42px" }}>
                  <i className="bi bi-envelope-fill fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-body d-flex align-items-center gap-2">
                    {t.defaultApp}
                    <i className="bi bi-box-arrow-up-right small text-muted"></i>
                  </div>
                  <div className="text-muted extra-small">{t.defaultAppSub}</div>
                </div>
              </a>

              <a
                href={`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="email-option-card d-flex align-items-center p-3 rounded-3 text-decoration-none transition-all"
                onClick={handleClose}
              >
                <div className="option-icon-wrapper rounded-circle bg-light shadow-sm d-flex align-items-center justify-content-center me-3" style={{ width: "42px", height: "42px", minWidth: "42px" }}>
                  <svg width="20" height="20" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-body d-flex align-items-center gap-2">
                    {t.outlookWeb}
                    <i className="bi bi-box-arrow-up-right small text-muted"></i>
                  </div>
                  <div className="text-muted extra-small">{t.outlookWebSub}</div>
                </div>
              </a>

              {/* Opzione 3: Copia Indirizzo Email */}
              <button
                type="button"
                className={`email-option-card w-100 text-start border-0 d-flex align-items-center p-3 rounded-3 transition-all ${
                  copied ? "active-copied" : ""
                }`}
                onClick={handleCopyEmail}
              >
                <div className="option-icon-wrapper rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center me-3" style={{ width: "42px", height: "42px", minWidth: "42px" }}>
                  <i className={`bi ${copied ? "bi-check-lg" : "bi-clipboard-fill"} fs-4`}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-body d-flex align-items-center gap-2">
                    {t.copyEmail}
                    {copied && <span className="badge bg-success ms-auto fs-7">{t.copiedBadge || "Copiato!"}</span>}
                  </div>
                  <div className="text-muted extra-small">{t.copyEmailSub}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer del Modale */}
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill px-4"
              onClick={handleClose}
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
