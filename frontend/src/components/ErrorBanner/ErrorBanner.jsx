import PropTypes from "prop-types";
import { useEffect, useState, useCallback } from "react";
import "./ErrorBanner.css";

/**
 * ErrorBanner – Banner per la visualizzazione di errori (e messaggi di successo/warning).
 *
 * Props:
 * - message {string}         — Testo da mostrare. Se null/empty, il banner non viene renderizzato.
 * - type    {string}         — Bootstrap variant: 'danger' | 'warning' | 'info' | 'success'
 * - onDismiss {Function}     — Callback quando l'utente chiude il banner manualmente.
 * - autoDismissMs {number}   — Se > 0, chiude automaticamente il banner dopo N ms (default: 0 = mai).
 * - icon   {string}          — Override dell'icona Bootstrap Icons (es. 'bi-wifi-off').
 * - className {string}       — Classi aggiuntive per il wrapper.
 */
function ErrorBanner({
  message,
  type = "danger",
  onDismiss,
  autoDismissMs = 0,
  icon,
  className = "",
}) {
  const [prevMessage, setPrevMessage] = useState(message);
  const [exiting, setExiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (message !== prevMessage) {
    setPrevMessage(message);
    setExiting(false);
    setDismissed(false);
  }

  const dismiss = useCallback(() => {
    setExiting(true);
    const timer = setTimeout(() => {
      setDismissed(true);
      setExiting(false);
      if (onDismiss) onDismiss();
    }, 300);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Auto-dismiss
  useEffect(() => {
    if (!message || dismissed || autoDismissMs <= 0) return;
    const timer = setTimeout(dismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, dismissed, autoDismissMs, dismiss]);

  if (!message || dismissed) return null;

  const iconMap = {
    danger: "bi-exclamation-triangle-fill",
    warning: "bi-exclamation-circle-fill",
    info: "bi-info-circle-fill",
    success: "bi-check-circle-fill",
  };

  const resolvedIcon = icon || iconMap[type] || "bi-exclamation-triangle-fill";

  return (
    <div
      className={`error-banner alert alert-${type} d-flex align-items-start gap-3 shadow-sm border-0 ${exiting ? "error-banner--exit" : "error-banner--enter"} ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <i className={`bi ${resolvedIcon} fs-5 flex-shrink-0 mt-1`}></i>
      <div className="flex-grow-1">
        <span className="fw-semibold">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="btn-close flex-shrink-0"
          aria-label="Chiudi"
          onClick={dismiss}
        />
      )}
    </div>
  );
}

ErrorBanner.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(["danger", "warning", "info", "success"]),
  onDismiss: PropTypes.func,
  autoDismissMs: PropTypes.number,
  icon: PropTypes.string,
  className: PropTypes.string,
};

export default ErrorBanner;
