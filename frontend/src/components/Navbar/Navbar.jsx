import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme, setLanguage } from "../../redux/slices/uiSlice";
import {
  togglePlay,
  nextTrack,
  prevTrack,
  setVolume,
  toggleMute,
  toggleModal,
} from "../../redux/slices/audioSlice";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} from "../../redux/slices/authSlice";
import tracks from "../../data/tracksData";
import AudioController from "../AudioPlayer/AudioController";
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
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#00247D" strokeWidth="60" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#CF142B" strokeWidth="4" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#CF142B" strokeWidth="6" />
    </g>
  </svg>
);

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((state) => state.ui.theme);
  const lang = useSelector((state) => state.ui.language);
  const { isAuthenticated, user, loading, error: authError } = useSelector(
    (state) => state.auth
  );
  const t = translations[lang].nav;

  // Redux audio state
  const { isPlaying, volume, currentTrackIndex, isMuted } = useSelector(
    (state) => state.audio
  );

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Stati per il popover di Login Admin
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Stato per l'apertura/chiusura del menu mobile
  const [expanded, setExpanded] = useState(false);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    dispatch(loginStart());

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        const msg = errData.message || "Credenziali non valide!";
        setLoginError(msg);
        dispatch(loginFailure(msg));
        return;
      }

      const data = await response.json();
      dispatch(loginSuccess(data));
      setEmail("");
      setPassword("");
      setShowLogin(false);
      navigate("/admin/preventivi");
    } catch (err) {
      const msg = "Impossibile connettersi al server di autenticazione.";
      setLoginError(msg);
      dispatch(loginFailure(msg));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowLogin(false);
    navigate("/");
  };

  return (
    <header className="navbar-container">
      {/* Elemento Audio Globale Sincronizzato con Redux */}
      <AudioController />

      {/* 1. Fascia Superiore (Top Banner) */}
      <div className="top-banner d-flex justify-content-between align-items-center px-3 px-md-4 py-2 border-bottom border-secondary border-opacity-10">
        {/* Lato Sinistro: Lingua & Tema */}
        <div className="top-left d-flex align-items-center gap-2 gap-md-3">
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

        {/* CENTRO: CONTROLLI COMPATTI MINI PLAYER (Visibili solo da 820px in su) */}
        <div className="top-center-player align-items-center gap-2">
          {/* Pulsante Traccia Precedente */}
          <button
            onClick={() => dispatch(prevTrack(tracks.length))}
            className="top-player-btn"
            title="Traccia precedente (<<)"
            aria-label="Traccia precedente"
          >
            <i className="bi bi-skip-start-fill"></i>
          </button>

          {/* Pulsante Play / Pause */}
          <button
            onClick={() => dispatch(togglePlay())}
            className="top-player-btn play-btn"
            title={isPlaying ? "Pausa" : "Riproduci"}
            aria-label={isPlaying ? "Pausa" : "Riproduci"}
          >
            <i className={`bi ${isPlaying ? "bi-pause-fill" : "bi-play-fill"}`}></i>
          </button>

          {/* Pulsante Traccia Successiva */}
          <button
            onClick={() => dispatch(nextTrack(tracks.length))}
            className="top-player-btn"
            title="Traccia successiva (>>)"
            aria-label="Traccia successiva"
          >
            <i className="bi bi-skip-end-fill"></i>
          </button>

          {/* Titolo Brano Cliccabile con Immagine Cover che apre il Modale Info */}
          <button
            onClick={() => dispatch(toggleModal())}
            className="top-player-track-info d-flex align-items-center gap-2"
            title="Apri dettagli traccia"
          >
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="player-cover-thumb rounded-circle"
            />
            <i className={`bi bi-music-note-beamed track-note-icon ${isPlaying ? "playing" : ""}`}></i>
            <span className="track-marquee-wrapper">
              <span key={currentTrackIndex} className="track-marquee-text">
                {currentTrack.artist} - {currentTrack.title}
              </span>
            </span>
          </button>

          {/* Icona & Barra Volume */}
          <div className="top-player-volume d-flex align-items-center gap-1 ms-1">
            <button
              onClick={() => dispatch(toggleMute())}
              className="top-player-btn volume-btn"
              title={isMuted || volume === 0 ? "Attiva audio" : "Muto"}
              aria-label="Volume audio"
            >
              <i
                className={`bi ${
                  isMuted || volume === 0
                    ? "bi-volume-mute-fill text-danger"
                    : volume < 0.5
                    ? "bi-volume-down-fill"
                    : "bi-volume-up-fill"
                }`}
              ></i>
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
              className="top-volume-slider"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>

        {/* Lato Destro: Area Privata con Modale/Popover Login */}
        <div className="top-right position-relative" ref={popoverRef}>
          <button
            onClick={() => setShowLogin(!showLogin)}
            className={`admin-login-btn-toggle d-flex align-items-center gap-2 ${
              showLogin ? "active" : ""
            } ${isAuthenticated ? "border-success text-success" : ""}`}
            aria-expanded={showLogin}
          >
            <i className={`bi ${isAuthenticated ? "bi-shield-check" : "bi-lock-fill"}`}></i>
            <span>{isAuthenticated ? "Admin Panel" : t.adminLogin}</span>
          </button>

          {/* Modale Login / Admin Menu Dropdown Popover */}
          {showLogin && (
            <div className="login-dropdown-popover p-3 shadow-lg rounded">
              {isAuthenticated ? (
                <div className="text-start">
                  <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                    <i className="bi bi-person-circle fs-5 text-success"></i>
                    <div>
                      <div className="fw-bold small text-truncate" style={{ maxWidth: "160px" }}>
                        {user?.email}
                      </div>
                      <span className="badge bg-success text-uppercase style-badge small" style={{ fontSize: "0.65rem" }}>
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/admin/preventivi"
                    className="btn btn-outline-success btn-sm w-100 mb-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setShowLogin(false)}
                  >
                    <i className="bi bi-file-earmark-text"></i>
                    <span>Dashboard Preventivi</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-danger btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit}>
                  {loginError && (
                    <div className="alert alert-danger p-2 small mb-2 text-start" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      {loginError}
                    </div>
                  )}
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
                      placeholder="vincoeventi@gmail.com"
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
                  <button
                    type="submit"
                    className="btn btn-forest-submit btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right"></i>
                        <span>{t.loginBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Fascia Centrale - Logo con Animazione Ritmo Musicale */}
      <div className="logo-section d-flex justify-content-center align-items-center py-3">
        <Link
          to="/"
          className={`logo-container ${isPlaying ? "is-playing" : ""}`}
          aria-label="Vinco Eventi Home"
        >
          {/* Animazione del ritmo musicale attorno al logo */}
          <div className="musical-rhythm-wrapper" aria-hidden="true">
            {/* Onde sonore concentriche */}
            <span className="rhythm-ring ring-1"></span>
            <span className="rhythm-ring ring-2"></span>
            <span className="rhythm-ring ring-3"></span>

            {/* Barrette equalizzatore sinistro */}
            <div className="equalizer-bars left-eq">
              <span className="eq-bar bar-1"></span>
              <span className="eq-bar bar-2"></span>
              <span className="eq-bar bar-3"></span>
              <span className="eq-bar bar-4"></span>
              <span className="eq-bar bar-5"></span>
            </div>

            {/* Barrette equalizzatore destro */}
            <div className="equalizer-bars right-eq">
              <span className="eq-bar bar-5"></span>
              <span className="eq-bar bar-4"></span>
              <span className="eq-bar bar-3"></span>
              <span className="eq-bar bar-2"></span>
              <span className="eq-bar bar-1"></span>
            </div>
          </div>

          <div className="logo-wrapper">
            <img
              src="/logoVincoEventi.jpeg"
              alt="Vinco Eventi Logo"
              className="logo-img"
            />
          </div>
        </Link>
      </div>

      {/* 3. Fascia Inferiore - Navigazione */}
      <nav className="navigation-section navbar navbar-expand-md navbar-dark py-2">
        <div className="container-fluid justify-content-center">
          <button
            className="navbar-toggler mb-2"
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-controls="navbarNav"
            aria-expanded={expanded}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse justify-content-center ${expanded ? "show" : ""}`} id="navbarNav">
            <ul className="navbar-nav gap-lg-4 text-center">
              <li className="nav-item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setExpanded(false)}
                >
                  {t.home}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/servizi"
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setExpanded(false)}
                >
                  {t.services}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/galleria"
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setExpanded(false)}
                >
                  {t.gallery}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/chi-siamo"
                  className={({ isActive }) => `nav-link custom-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setExpanded(false)}
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
