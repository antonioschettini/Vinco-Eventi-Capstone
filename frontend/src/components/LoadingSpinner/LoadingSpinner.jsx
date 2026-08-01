import PropTypes from "prop-types";
import "./LoadingSpinner.css";

/**
 * LoadingSpinner – Spinner di caricamento riutilizzabile.
 *
 * Varianti:
 * - fullPage: occupa l'intera viewport (per caricamenti di pagina iniziali)
 * - inline:   piccolo spinner inline nel flusso del documento
 * - overlay:  overlay semitrasparente sopra un container posizionato
 *
 * Props:
 * - variant    {string}  — 'fullPage' | 'inline' | 'overlay'  (default: 'inline')
 * - message    {string}  — Testo opzionale sotto lo spinner
 * - size       {string}  — 'sm' | 'md' | 'lg'               (default: 'md')
 * - color      {string}  — Classe Bootstrap text-* (default: 'text-success')
 */
function LoadingSpinner({
  variant = "inline",
  message = "",
  size = "md",
  color = "text-success",
}) {
  const sizeMap = { sm: "1.25rem", md: "2.5rem", lg: "4rem" };
  const spinnerStyle = { width: sizeMap[size], height: sizeMap[size] };

  const spinner = (
    <div
      className={`spinner-border ${color}`}
      role="status"
      style={spinnerStyle}
      aria-hidden="true"
    >
      <span className="visually-hidden">Caricamento...</span>
    </div>
  );

  if (variant === "fullPage") {
    return (
      <div className="loading-spinner--fullpage d-flex flex-column align-items-center justify-content-center gap-3">
        {spinner}
        {message && (
          <p className="text-muted mb-0 fw-semibold small loading-spinner__message">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="loading-spinner--overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-3">
        {spinner}
        {message && (
          <p className="text-muted mb-0 fw-semibold small loading-spinner__message">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default: inline
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3 py-5 my-3">
      {spinner}
      {message && (
        <p className="text-muted mb-0 fw-semibold small loading-spinner__message">
          {message}
        </p>
      )}
    </div>
  );
}

LoadingSpinner.propTypes = {
  variant: PropTypes.oneOf(["fullPage", "inline", "overlay"]),
  message: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  color: PropTypes.string,
};

export default LoadingSpinner;
