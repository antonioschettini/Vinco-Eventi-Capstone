import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { closeEmailModal } from "../../redux/slices/uiSlice";
import { translations } from "../../utils/translations";
import "./EmailChoiceModal.css";

export default function EmailChoiceModal() {
  const dispatch = useDispatch();
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

  // Gestione tasto ESC per chiudere il modale
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        dispatch(closeEmailModal());
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
              {/* Opzione 1: App Nativa / Outlook Desktop */}
              <a
                href={`mailto:${email}`}
                className="email-option-card d-flex align-items-center p-3 rounded-3 text-decoration-none transition-all"
                onClick={handleClose}
              >
                <div className="option-icon-wrapper rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center me-3">
                  <i className="bi bi-pc-display fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-body d-flex align-items-center gap-2">
                    {t.defaultApp}
                    <i className="bi bi-box-arrow-up-right small text-muted"></i>
                  </div>
                  <div className="text-muted extra-small">{t.defaultAppSub}</div>
                </div>
              </a>

              {/* Opzione 2: Gmail Web */}
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="email-option-card d-flex align-items-center p-3 rounded-3 text-decoration-none transition-all"
                onClick={handleClose}
              >
                <div className="option-icon-wrapper rounded-circle gmail-icon-wrapper d-flex align-items-center justify-content-center me-3">
                  <i className="bi bi-google fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-body d-flex align-items-center gap-2">
                    {t.gmailWeb}
                    <i className="bi bi-box-arrow-up-right small text-muted"></i>
                  </div>
                  <div className="text-muted extra-small">{t.gmailWebSub}</div>
                </div>
              </a>

              {/* Opzione 3: Outlook.com / Office 365 Web */}
              <a
                href={`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="email-option-card d-flex align-items-center p-3 rounded-3 text-decoration-none transition-all"
                onClick={handleClose}
              >
                <div className="option-icon-wrapper rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center me-3">
                  <i className="bi bi-microsoft fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold text-body d-flex align-items-center gap-2">
                    {t.outlookWeb}
                    <i className="bi bi-box-arrow-up-right small text-muted"></i>
                  </div>
                  <div className="text-muted extra-small">{t.outlookWebSub}</div>
                </div>
              </a>

              {/* Opzione 4: Copia Indirizzo Email */}
              <button
                type="button"
                className={`email-option-card w-100 text-start border-0 d-flex align-items-center p-3 rounded-3 transition-all ${
                  copied ? "active-copied" : ""
                }`}
                onClick={handleCopyEmail}
              >
                <div className="option-icon-wrapper rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center me-3">
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
