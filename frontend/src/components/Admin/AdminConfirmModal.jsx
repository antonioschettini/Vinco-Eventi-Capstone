import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./AdminConfirmModal.css";

export default function AdminConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Conferma",
  cancelText = "Annulla",
  variant = "success", // "success" | "danger" | "warning" | "info"
  icon = "bi-check-circle-fill",
  onConfirm,
  onCancel,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onCancel) onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getButtonClass = () => {
    switch (variant) {
      case "danger":
        return "btn-danger";
      case "warning":
        return "btn-warning text-dark";
      case "info":
        return "btn-info text-white";
      case "success":
      default:
        return "btn-success";
    }
  };

  return (
    <div
      className="modal fade show d-block admin-confirm-backdrop"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        className="modal-dialog modal-dialog-centered admin-confirm-dialog px-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content admin-confirm-content border-0">
          <div className="modal-header admin-confirm-header border-0 pb-0">
            <div className="d-flex align-items-center gap-3">
              <div className={`admin-confirm-icon-badge ${variant}`}>
                <i className={`bi ${icon}`}></i>
              </div>
              <h5 className="modal-title fw-bold mb-0 text-body">
                {title || "Conferma Azione"}
              </h5>
            </div>
            <button
              type="button"
              className="btn-close shadow-none"
              onClick={onCancel}
              aria-label="Chiudi"
            ></button>
          </div>

          <div className="modal-body admin-confirm-body text-secondary">
            {message}
          </div>

          <div className="modal-footer admin-confirm-footer border-0">
            <button
              type="button"
              className="btn btn-light rounded-pill px-4"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${getButtonClass()} rounded-pill px-4 fw-bold`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

AdminConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.string,
  icon: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
