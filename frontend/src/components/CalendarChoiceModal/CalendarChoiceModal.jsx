import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  openAppleCalendar,
} from "../../utils/calendarHelpers";
import "./CalendarChoiceModal.css";

function CalendarChoiceModal({ quote, onClose }) {
  const modalRef = useRef(null);

  // Gestione tasto ESC e Focus Trap
  useEffect(() => {
    if (!quote) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
      } else if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
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
  }, [quote, onClose]);

  if (!quote) return null;

  const handleGoogleClick = () => {
    const url = generateGoogleCalendarUrl(quote);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    if (onClose) onClose();
  };

  const handleOutlookClick = () => {
    const url = generateOutlookCalendarUrl(quote);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    if (onClose) onClose();
  };

  const handleAppleIcsClick = () => {
    openAppleCalendar(quote);
    if (onClose) onClose();
  };

  const formattedDate = quote.dataEvento
    ? new Date(quote.dataEvento).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Data non specificata";

  return (
    <div
      className="modal fade show d-block calendar-choice-modal-backdrop"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendarModalTitle"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="modal-dialog modal-dialog-centered calendar-choice-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content calendar-choice-modal-content shadow-lg border-0">
          {/* Header Frosted Glass */}
          <div className="modal-header calendar-modal-header border-0 pb-2">
            <div className="d-flex align-items-center gap-3">
              <div className="calendar-modal-icon-badge">
                <i className="bi bi-calendar2-event-fill"></i>
              </div>
              <div>
                <h5 className="modal-title font-heading fw-bold mb-0 text-success-emphasis" id="calendarModalTitle">
                  Salva in Calendario
                </h5>
                <span className="small text-muted">
                  {quote.nome} {quote.cognome} • {formattedDate}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close shadow-none"
              onClick={onClose}
              aria-label="Chiudi"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 pt-3">
            <p className="small text-muted mb-3 text-center">
              Seleziona l'applicazione o il servizio di calendario su cui desideri salvare l'evento:
            </p>

            <div className="d-flex flex-column gap-3">
              {/* Option 1: Google Calendar */}
              <button
                onClick={handleGoogleClick}
                className="calendar-option-btn google-cal-btn d-flex align-items-center justify-content-between p-3 rounded-3 border-0 shadow-sm"
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="cal-option-icon bg-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                    <svg width="22" height="22" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.60l6.9-6.9C35.9 2.38 30.47 0 24 0 14.66 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.42 17.6 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.14-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59C9.97 26.91 9.97 25.09 10.53 23.41l-7.98-6.19C1.01 19.83 0 21.85 0 24c0 2 .15 4.17.75 6.18l7.98-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.4 0-11.57-3.92-13.47-9.31l-7.98 6.19C6.51 42.62 14.66 48 24 48z"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold text-dark lh-sm">Google Calendar</div>
                    <div className="small text-secondary">
                      Ideale per Android, Chrome e Account vincoeventi@gmail.com
                    </div>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </button>

              {/* Option 2: Apple Calendar */}
              <button
                onClick={handleAppleIcsClick}
                className="calendar-option-btn apple-cal-btn d-flex align-items-center justify-content-between p-3 rounded-3 border-0 shadow-sm"
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="cal-option-icon bg-dark text-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1 .04-2.19.67-2.88 1.47-.62.72-1.16 1.89-.99 3.01 1.11.09 2.22-.54 2.88-1.36z"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold text-dark lh-sm">Apple Calendario</div>
                    <div className="small text-secondary">
                      Apertura diretta su iPhone, iPad e Mac
                    </div>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </button>

              {/* Option 3: Outlook Web */}
              <button
                onClick={handleOutlookClick}
                className="calendar-option-btn outlook-cal-btn d-flex align-items-center justify-content-between p-3 rounded-3 border-0 shadow-sm"
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="cal-option-icon bg-light rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                    <svg width="20" height="20" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold text-dark lh-sm">Outlook Web</div>
                    <div className="small text-secondary">Aggiungi su Microsoft 365 / Outlook</div>
                  </div>
                </div>
                <i className="bi bi-chevron-right text-muted"></i>
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-0 bg-body-tertiary rounded-bottom-4 py-2 px-3 justify-content-between align-items-center">
            <span className="small text-muted">Formato All-Day RFC 5545</span>
            <button type="button" className="btn btn-secondary btn-sm rounded-3" onClick={onClose}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

CalendarChoiceModal.propTypes = {
  quote: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    email: PropTypes.string,
    telefono: PropTypes.string,
    dataEvento: PropTypes.string,
    tipoEvento: PropTypes.string,
    location: PropTypes.string,
    numeroOspiti: PropTypes.string,
    orarioGiornata: PropTypes.string,
    messaggio: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default CalendarChoiceModal;
