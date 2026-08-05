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
                    <svg width="20" height="20" viewBox="0 0 170 170" fill="currentColor">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.38-6.08-3.32-2.73-7.15-7.38-11.5-13.97-6.7-10.15-11.83-20.97-15.39-32.48-3.56-11.5-5.34-22.37-5.34-32.59 0-14.62 3.82-26.68 11.45-36.19 7.63-9.52 17.1-14.35 28.41-14.49 4.67 0 9.87 1.2 15.61 3.59 5.74 2.39 9.53 3.59 11.38 3.59 1.48 0 5.41-1.28 11.8-3.84 6.38-2.56 11.64-3.77 15.78-3.63 11.96.65 21.6 5.25 28.92 13.8-10.63 6.43-15.82 15.42-15.57 26.97.26 10.02 4.12 18.3 11.59 24.84 3.56 3.19 7.69 5.56 12.39 7.12-2.58 7.54-6.08 15.17-10.49 22.89zM119.22 31.08c0-6.85 2.45-13.43 7.35-19.74 4.9-6.31 10.98-10.3 18.25-11.97.16.89.24 1.76.24 2.61 0 6.94-2.54 13.62-7.62 20.03-5.08 6.41-11.16 10.37-18.22 11.87-.08-.73-.12-1.46-.12-2.18z"/>
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
