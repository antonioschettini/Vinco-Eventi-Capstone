import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./AdminSubnav.css";

export default function AdminSubnav({ activeTab }) {
  return (
    <nav className="admin-subnav-container mb-4" aria-label="Navigazione Area Riservata Admin">
      <div className="admin-subnav-track">
        <Link
          to="/admin-enzo/preventivi"
          className={`admin-subnav-link ${activeTab === "preventivi" ? "active" : ""}`}
          aria-selected={activeTab === "preventivi"}
          role="tab"
        >
          <i className="bi bi-file-earmark-text-fill subnav-icon"></i>
          <span>Richieste Preventivi</span>
        </Link>

        <Link
          to="/admin-enzo/agenda"
          className={`admin-subnav-link ${activeTab === "agenda" ? "active" : ""}`}
          aria-selected={activeTab === "agenda"}
          role="tab"
        >
          <i className="bi bi-calendar-check-fill subnav-icon"></i>
          <span>Agenda & Contabilità</span>
        </Link>

        <Link
          to="/admin-enzo/audit"
          className={`admin-subnav-link ${activeTab === "audit" ? "active" : ""}`}
          aria-selected={activeTab === "audit"}
          role="tab"
        >
          <i className="bi bi-shield-lock-fill subnav-icon"></i>
          <span>Audit & Log</span>
        </Link>
      </div>
    </nav>
  );
}

AdminSubnav.propTypes = {
  activeTab: PropTypes.oneOf(["preventivi", "agenda", "audit"]).isRequired,
};
