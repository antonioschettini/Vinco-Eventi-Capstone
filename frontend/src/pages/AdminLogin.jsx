import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import API_BASE_URL from "../config/api";
import { apiFetch } from "../utils/apiClient";
import ErrorBanner from "../components/ErrorBanner/ErrorBanner";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../redux/slices/authSlice";

function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Reindirizza automaticamente se già autenticato come Admin
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/preventivi", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Gestione del timer di cooldown (se troppi tentativi falliti in locale)
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setLoginError("");
    dispatch(loginStart());

    try {
      const data = await apiFetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      dispatch(loginSuccess(data));
      setEmail("");
      setPassword("");
      setFailedAttempts(0);
      navigate("/admin/preventivi");
    } catch (err) {
      const msg = err.message || "Credenziali non valide! Verifica e riprova.";
      setLoginError(msg);
      dispatch(loginFailure(msg));

      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 3) {
        setCooldown(30);
        setFailedAttempts(0);
      }
    }
  };

  return (
    <div className="container py-5 my-md-5 d-flex justify-content-center align-items-center flex-grow-1">
      <div
        className="card border-0 shadow-lg p-4 p-md-5 rounded-4 position-relative"
        style={{
          maxWidth: "460px",
          width: "100%",
          background: "var(--bs-body-bg)",
          borderTop: "4px solid #198754",
        }}
      >
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mb-3"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="bi bi-shield-lock-fill fs-2"></i>
          </div>
          <h2 className="fw-bold mb-1 fs-3">Accesso Riservato</h2>
          <p className="text-muted small mb-0">
            Pannello di Amministrazione VINCO EVENTI
          </p>
        </div>

        {loginError && (
          <ErrorBanner
            message={loginError}
            type="danger"
            className="mb-4"
            onDismiss={() => setLoginError("")}
          />
        )}

        {cooldown > 0 && (
          <ErrorBanner
            message={`Troppi tentativi errati. Attendi ${cooldown}s prima di riprovare.`}
            type="warning"
            icon="bi-hourglass-split"
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-uppercase tracking-wider">
              Email Amministratore
            </label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-envelope text-muted"></i>
              </span>
              <input
                type="email"
                className="form-control border-start-0 ps-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vincoeventi@gmail.com"
                required
                disabled={cooldown > 0}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-uppercase tracking-wider">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control border-start-0 ps-0"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={cooldown > 0}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-3"
            disabled={loading || cooldown > 0}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                ></span>
                <span>Autenticazione in corso...</span>
              </>
            ) : cooldown > 0 ? (
              <span>Bloccato ({cooldown}s)</span>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Accedi all'Area Amministrativa</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top">
          <Link
            to="/"
            className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1 hover-underline"
          >
            <i className="bi bi-arrow-left"></i> Torna al Sito Pubblico
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
