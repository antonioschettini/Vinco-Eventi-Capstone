import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme, setLanguage } from "../../redux/slices/uiSlice";
import { translations } from "../../utils/translations";
import "./Navbar.css";

// SVG Bandiera Italiana
const ItalyFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 3 2"
    width="20"
    height="14"
    className="flag-icon-svg"
  >
    <rect width="1" height="2" fill="#009246" />
    <rect x="1" width="1" height="2" fill="#F1F2F1" />
    <rect x="2" width="1" height="2" fill="#CE2B37" />
  </svg>
);

// SVG Bandiera Regno Unito (UK)
const UKFlag = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 30"
    width="20"
    height="14"
    className="flag-icon-svg"
  >
    <clipPath id="uj-clip">
      <rect width="60" height="30" />
    </clipPath>
    <g clipPath="url(#uj-clip)">
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#00247D" stroke-width="60" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" stroke-width="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#CF142B" stroke-width="4" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFFFFF" stroke-width="10" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#CF142B" stroke-width="6" />
    </g>
  </svg>
);

function Navbar() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].nav;

  // Stati per il popover di Login Admin
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const popoverRef = useRef(null);

  // Chiude il popover se si clicca all'esterno di esso
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowLogin(false);
      }
    }
    if (showLogin) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogin]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // Placeholder logico per il login admin (verrà implementato in seguito)
    console.log("Login Admin inviato:", { email, password });
    setEmail("");
    setPassword("");
    setShowLogin(false);
  };

  return (
    <header className="navbar-container">
      {/* 1. Fascia Superiore */}
      <div className="top-banner d-flex justify-content-between align-items-center px-4 py-2 border-bottom border-secondary border-opacity-10">
        <div className="top-left d-flex align-items-center gap-3">
          {/* Switch Lingua con Bandiere */}
          <div className="language-selector d-flex align-items-center gap-2">
            <button
              onClick={() => dispatch(setLanguage("it"))}
              className={`flag-btn-wrapper ${lang === "it" ? "active" : ""}`}
              aria-label="Lingua Italiana"
              title="Italiano"
            >
              <ItalyFlag />
            </button>
            <span className="divider">|</span>
            <button
              onClick={() => dispatch(setLanguage("en"))}
              className={`flag-btn-wrapper ${lang === "en" ? "active" : ""}`}
              aria-label="English Language"
              title="English"
            >
              <UKFlag />
            </button>
          </div>

          {/* Switch Light/Dark Mode */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="theme-toggle-btn d-flex align-items-center justify-content-center"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <i className="bi bi-sun-fill fs-5 text-warning"></i>
            ) : (
              <i className="bi bi-moon-stars-fill fs-5 text-secondary"></i>
            )}
          </button>
        </div>

        {/* Area Privata con Modale/Popover a comparsa */}
        <div className="top-right position-relative" ref={popoverRef}>
          <button
            onClick={() => setShowLogin(!showLogin)}
            className={`admin-login-btn-toggle d-flex align-items-center gap-2 ${
              showLogin ? "active" : ""
            }`}
            aria-expanded={showLogin}
          >
            <i className="bi bi-lock-fill"></i>
            <span>{t.adminLogin}</span>
          </button>

          {/* Modale Login Dropdown Popover */}
          {showLogin && (
            <div className="login-dropdown-popover p-3 shadow-lg rounded">
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-2 text-start">
                  <label className="form-label small mb-1 fw-semibold">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control form-control-sm input-custom"
                    required
                    placeholder="name@example.com"
                  />
                </div>
                <div className="mb-3 text-start">
                  <label className="form-label small mb-1 fw-semibold">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control form-control-sm input-custom"
                    required
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" className="btn btn-forest-submit btn-sm w-100 fw-bold">
                  {t.loginBtn}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 2. Fascia Centrale - Logo */}
      <div className="logo-section d-flex justify-content-center align-items-center py-3">
        <Link to="/" className="logo-wrapper">
          <img
            src="/logoVincoEventi.jpeg"
            alt="Vinco Eventi Logo"
            className="logo-img"
          />
        </Link>
      </div>

      {/* 3. Fascia Inferiore - Navigazione */}
      <nav className="navigation-section navbar navbar-expand-md navbar-dark py-2">
        <div className="container-fluid justify-content-center">
          <button
            className="navbar-toggler mb-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
            <ul className="navbar-nav gap-lg-4 text-center">
              <li className="nav-item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                >
                  {t.home}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/servizi"
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                >
                  {t.services}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/galleria"
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                >
                  {t.gallery}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/chi-siamo"
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                >
                  {t.about}
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
