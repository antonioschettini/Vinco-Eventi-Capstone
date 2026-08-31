import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import API_BASE_URL from "../config/api";
import { authApiFetch } from "../utils/apiClient";
import { setGlobalError } from "../redux/slices/uiSlice";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import AdminSubnav from "../components/Admin/AdminSubnav";
import "./AdminAudit.css";

// ─────────────────────────────────────────────────────
// Utility (pure functions — no hooks)
// ─────────────────────────────────────────────────────

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length < 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

function getStatusClass(status) {
  if (!status) return "s4xx";
  if (status < 300) return "s2xx";
  if (status < 400) return "s3xx";
  if (status < 500) return "s4xx";
  return "s5xx";
}

function getBarFillClass(status) {
  if (!status) return "status-other";
  const s = parseInt(status, 10);
  if (s < 300) return "status-2xx";
  if (s < 400) return "status-3xx";
  if (s < 500) return "status-4xx";
  if (s < 600) return "status-5xx";
  return "status-other";
}

/** Calcola i punti SVG di una polyline a partire da dati {date, count}[] */
function buildPolylinePoints(data, width, height, padding = 14) {
  if (!data || data.length < 2) return { points: "", dots: [] };
  const counts = data.map((d) => d.count);
  const maxVal = Math.max(...counts, 1);
  const w = width - padding * 2;
  const h = height - padding * 2;

  const pts = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * w;
    const y = padding + h - (d.count / maxVal) * h;
    return { x, y, count: d.count, date: d.date };
  });

  const points = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  return { points, dots: pts };
}

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─────────────────────────────────────────────────────
// Sotto-componenti stateless
// ─────────────────────────────────────────────────────

function KpiCard({ icon, iconClass, value, label }) {
  return (
    <div className="audit-kpi-card">
      <div className={`audit-kpi-icon ${iconClass}`}>
        <i className={`bi ${icon}`} aria-hidden="true"></i>
      </div>
      <div className="min-w-0 flex-grow-1">
        <div className="audit-kpi-value">{value ?? "—"}</div>
        <div className="audit-kpi-label">{label}</div>
      </div>
    </div>
  );
}

/** Grafico a barre orizzontale per errori per status code */
function ErrorBarChart({ errorsByStatus }) {
  const entries = Object.entries(errorsByStatus || {});
  if (entries.length === 0) {
    return (
      <div className="audit-empty">
        <i className="bi bi-bar-chart" aria-hidden="true"></i>
        <p className="small mb-0">Nessun errore nel periodo selezionato</p>
      </div>
    );
  }

  const maxCount = Math.max(...entries.map(([, c]) => c), 1);

  return (
    <div className="audit-bar-chart" role="list" aria-label="Errori per status code">
      {entries.map(([status, count]) => (
        <div key={status} className="audit-bar-row" role="listitem">
          <span className="audit-bar-label">
            <span className={`audit-status-badge ${getStatusClass(parseInt(status, 10))}`}>
              {status}
            </span>
          </span>
          <div
            className="audit-bar-track"
            title={`${count} errori con status ${status}`}
            aria-label={`Status ${status}: ${count} errori`}
          >
            <div
              className={`audit-bar-fill ${getBarFillClass(status)}`}
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="audit-bar-count" aria-hidden="true">{count}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Grafico a linea SVG per visite/errori nel tempo.
 *
 * IMPORTANTE: tutti gli hook sono dichiarati PRIMA di qualsiasi return
 * per rispettare le React Rules of Hooks.
 */
function LineChart({ data, colorFrom, gradientId, ariaLabel }) {
  const wrapperRef = useRef(null);
  const [width, setWidth] = useState(600);
  const HEIGHT = 140;

  // ResizeObserver per grafici reattivi alla larghezza del container
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.max(Math.floor(entry.contentRect.width), 280));
    });
    ro.observe(el);
    // Misura immediata al mount
    setWidth(Math.max(Math.floor(el.getBoundingClientRect().width), 280));
    return () => ro.disconnect();
  }, []);

  const hasData = data && data.length >= 2;
  const { points, dots } = hasData
    ? buildPolylinePoints(data, width, HEIGHT)
    : { points: "", dots: [] };

  // Etichette asse X: massimo 7 label
  const step = hasData ? Math.max(1, Math.floor(data.length / 7)) : 1;
  const xLabels = hasData
    ? data.filter((_, i) => i % step === 0 || i === data.length - 1)
    : [];

  return (
    <div ref={wrapperRef} className="audit-line-chart-wrapper">
      {!hasData ? (
        <div className="audit-empty">
          <i className="bi bi-graph-up" aria-hidden="true"></i>
          <p className="small mb-0">Nessun dato nel periodo selezionato</p>
        </div>
      ) : (
        <>
          <svg
            className="audit-line-chart-svg"
            viewBox={`0 0 ${width} ${HEIGHT}`}
            aria-label={ariaLabel || "Grafico nel tempo"}
            role="img"
            focusable="false"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorFrom} stopOpacity="0.22" />
                <stop offset="100%" stopColor={colorFrom} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines leggere */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={14}
                y1={14 + (1 - f) * (HEIGHT - 28)}
                x2={width - 14}
                y2={14 + (1 - f) * (HEIGHT - 28)}
                stroke="currentColor"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
            ))}

            {/* Area fill */}
            <polygon
              points={`${dots[0].x.toFixed(2)},${HEIGHT} ${points} ${dots[dots.length - 1].x.toFixed(2)},${HEIGHT}`}
              fill={`url(#${gradientId})`}
            />

            {/* Linea */}
            <polyline
              points={points}
              fill="none"
              stroke={colorFrom}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Punti — solo se non troppi dati (max 60 punti) */}
            {dots.length <= 60 &&
              dots.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x.toFixed(2)}
                  cy={pt.y.toFixed(2)}
                  r="3.5"
                  fill="var(--bs-body-bg, #fff)"
                  stroke={colorFrom}
                  strokeWidth="2"
                >
                  <title>
                    {formatDate(pt.date)}: {pt.count}
                  </title>
                </circle>
              ))}
          </svg>

          {/* Etichette asse X */}
          <div className="audit-chart-x-labels" aria-hidden="true">
            {xLabels.map((d, i) => (
              <span key={i} className="audit-chart-x-label">
                {formatDate(d.date)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Top pages list */
function TopPagesChart({ topPages }) {
  if (!topPages || topPages.length === 0) {
    return (
      <div className="audit-empty">
        <i className="bi bi-link-45deg" aria-hidden="true"></i>
        <p className="small mb-0">Nessuna visita registrata nel periodo</p>
      </div>
    );
  }

  const maxCount = Math.max(...topPages.map((p) => p.count), 1);

  return (
    <div className="audit-top-pages" role="list" aria-label="Pagine più visitate">
      {topPages.map((page, i) => (
        <div key={i} className="audit-top-page-row" role="listitem">
          <span className="audit-top-page-uri" title={page.uri}>
            <span className="audit-rank-badge">{i + 1}</span>
            {page.uri}
          </span>
          <div className="audit-top-page-bar" aria-hidden="true">
            <div
              className="audit-top-page-bar-fill"
              style={{ width: `${(page.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="audit-top-page-count">{page.count}</span>
        </div>
      ))}
    </div>
  );
}

/** Tabella errori con paginazione */
function ErrorsTable({ errors, totalPages, currentPage, onPageChange }) {
  if (!errors || errors.length === 0) {
    return (
      <div className="audit-empty">
        <i className="bi bi-check-circle" aria-hidden="true"></i>
        <p className="small mb-0">Nessun errore registrato</p>
      </div>
    );
  }

  // Finestra di paginazione: max 5 bottoni visibili
  const windowSize = Math.min(totalPages, 5);
  let windowStart = 0;
  if (totalPages > 5) {
    if (currentPage <= 2) windowStart = 0;
    else if (currentPage >= totalPages - 3) windowStart = totalPages - 5;
    else windowStart = currentPage - 2;
  }
  const pageButtons = Array.from({ length: windowSize }, (_, i) => windowStart + i);

  return (
    <>
      <div className="audit-table-wrapper">
        <table className="audit-table" aria-label="Log errori API">
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Metodo</th>
              <th scope="col">URI</th>
              <th scope="col" className="d-none d-md-table-cell">Tipo Errore</th>
              <th scope="col">Messaggio</th>
              <th scope="col" className="d-none d-sm-table-cell">Quando</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err) => (
              <tr key={err.id}>
                <td>
                  <span className={`audit-status-badge ${getStatusClass(err.httpStatus)}`}>
                    {err.httpStatus ?? "?"}
                  </span>
                </td>
                <td>
                  <span className={`audit-method-badge ${err.httpMethod || "GET"}`}>
                    {err.httpMethod || "?"}
                  </span>
                </td>
                <td>
                  <span className="audit-uri" title={err.requestUri}>
                    {err.requestUri || "—"}
                  </span>
                </td>
                <td className="d-none d-md-table-cell">
                  <span className="small text-muted">{err.errorType || "—"}</span>
                </td>
                <td>
                  <span className="audit-error-msg" title={err.errorMessage}>
                    {err.errorMessage || "—"}
                  </span>
                </td>
                <td className="d-none d-sm-table-cell">
                  <span className="audit-timestamp">
                    {formatDateTime(err.occurredAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="audit-pagination" aria-label="Paginazione log errori">
          <button
            id="audit-page-prev"
            className="audit-page-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Pagina precedente"
          >
            <i className="bi bi-chevron-left" aria-hidden="true"></i>
          </button>

          {pageButtons.map((pageNum) => (
            <button
              key={pageNum}
              id={`audit-page-${pageNum}`}
              className={`audit-page-btn${currentPage === pageNum ? " active" : ""}`}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Pagina ${pageNum + 1}`}
              aria-current={currentPage === pageNum ? "page" : undefined}
            >
              {pageNum + 1}
            </button>
          ))}

          <button
            id="audit-page-next"
            className="audit-page-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            aria-label="Pagina successiva"
          >
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </nav>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────

const RANGE_PRESETS = [
  { label: "7 gg", days: 7 },
  { label: "30 gg", days: 30 },
  { label: "90 gg", days: 90 },
];

export default function AdminAudit() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  // ── Range date ──
  const [activeDays, setActiveDays] = useState(30);
  const [dateFrom, setDateFrom] = useState(() =>
    toIsoDate(new Date(Date.now() - 30 * 86400 * 1000))
  );
  const [dateTo, setDateTo] = useState(() => toIsoDate(new Date()));

  // ── Stato dati ──
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState([]);
  const [errorsTotalPages, setErrorsTotalPages] = useState(0);
  const [errorsPage, setErrorsPage] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState(true);

  // SEO: aggiorna il document title dinamicamente
  useEffect(() => {
    const prev = document.title;
    document.title = "Audit & Statistiche | Vinco Eventi";
    return () => { document.title = prev; };
  }, []);

  // ─────────────────────────────────────────
  // Fetch statistiche
  // ─────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await authApiFetch(
        `${API_BASE_URL}/api/admin/audit/stats?from=${dateFrom}&to=${dateTo}`,
        {},
        token,
        dispatch
      );
      setStats(data);
    } catch (err) {
      dispatch(
        setGlobalError({
          message: err.message || "Errore nel caricamento delle statistiche di audit.",
          type: "danger",
          autoDismissMs: 5000,
        })
      );
    } finally {
      setLoadingStats(false);
    }
  }, [dateFrom, dateTo, token, dispatch]);

  // ─────────────────────────────────────────
  // Fetch errori paginati
  // ─────────────────────────────────────────
  const fetchErrors = useCallback(async () => {
    setLoadingErrors(true);
    try {
      const data = await authApiFetch(
        `${API_BASE_URL}/api/admin/audit/errors?page=${errorsPage}&size=20`,
        {},
        token,
        dispatch
      );
      setErrors(data?.content || []);
      setErrorsTotalPages(data?.totalPages || 0);
    } catch (err) {
      dispatch(
        setGlobalError({
          message: err.message || "Errore nel caricamento del log errori.",
          type: "danger",
          autoDismissMs: 5000,
        })
      );
    } finally {
      setLoadingErrors(false);
    }
  }, [errorsPage, token, dispatch]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchErrors(); }, [fetchErrors]);

  // ─────────────────────────────────────────
  // Handler filtri
  // ─────────────────────────────────────────
  const applyPreset = useCallback((days) => {
    const now = new Date();
    setActiveDays(days);
    setDateTo(toIsoDate(now));
    setDateFrom(toIsoDate(new Date(now.getTime() - days * 86400 * 1000)));
    setErrorsPage(0);
  }, []);

  // ─────────────────────────────────────────
  // Esportazione Log Errori Audit in CSV
  // ─────────────────────────────────────────
  const handleExportAuditCsv = () => {
    if (!errors || errors.length === 0) {
      dispatch(
        setGlobalError({
          message: "Nessun log errori disponibile per il periodo selezionato.",
          type: "info",
          autoDismissMs: 4000,
        })
      );
      return;
    }

    const headers = ["Data e Ora", "Status Code", "Metodo HTTP", "Endpoint", "Messaggio Errore", "IP Client"];
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = errors.map((err) => [
      escapeCsv(formatDateTime(err.timestamp || err.createdAt)),
      escapeCsv(err.status || err.statusCode || ""),
      escapeCsv(err.method || ""),
      escapeCsv(err.path || err.endpoint || ""),
      escapeCsv(err.message || err.error || ""),
      escapeCsv(err.ipAddress || err.clientIp || "—")
    ].join(";"));

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VincoEventi_Audit_Errors_${activeDays}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    dispatch(
      setGlobalError({
        message: "Log audit errori esportato con successo in formato CSV!",
        type: "success",
        autoDismissMs: 4000,
      })
    );
  };

  // ─────────────────────────────────────────
  // Metriche derivate
  // ─────────────────────────────────────────
  const totalVisits = stats?.totalVisits ?? 0;
  const totalErrors = stats?.totalErrors ?? 0;
  const errorsBy5xx = Object.entries(stats?.errorsByStatus || {})
    .filter(([s]) => parseInt(s, 10) >= 500)
    .reduce((acc, [, c]) => acc + Number(c), 0);
  const errorsBy4xx = Object.entries(stats?.errorsByStatus || {})
    .filter(([s]) => { const n = parseInt(s, 10); return n >= 400 && n < 500; })
    .reduce((acc, [, c]) => acc + Number(c), 0);

  return (
    <>
      {/* SEO title gestito con useEffect */}
      <div className="admin-audit-page">
        <div className="container-fluid container-lg">

          {/* ── Sub-nav Admin ── */}
          <AdminSubnav activeTab="audit" />

          {/* ── Header + filtri ── */}
          <div className="d-flex align-items-start align-items-sm-center justify-content-between gap-3 mb-4 flex-column flex-sm-row">
            <div>
              <h1 className="fw-bold fs-4 mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-success" aria-hidden="true"></i>
                Audit &amp; Statistiche
              </h1>
              <p className="text-muted small mb-0 mt-1">
                Monitoraggio errori API, visite e metriche di sistema
              </p>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="audit-filter-bar" role="group" aria-label="Filtro periodo">
                {RANGE_PRESETS.map((p) => (
                  <button
                    key={p.days}
                    id={`audit-range-${p.days}`}
                    className={`audit-filter-btn${activeDays === p.days ? " active" : ""}`}
                    onClick={() => applyPreset(p.days)}
                    aria-pressed={activeDays === p.days}
                    type="button"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportAuditCsv}
                className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                title="Esporta log errori in formato CSV"
              >
                <i className="bi bi-file-earmark-excel-fill text-success"></i>
                <span>Esporta CSV</span>
              </button>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <KpiCard
                icon="bi-eye-fill"
                iconClass="visits"
                value={loadingStats ? "…" : totalVisits.toLocaleString("it-IT")}
                label="Visite nel periodo"
              />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard
                icon="bi-exclamation-triangle-fill"
                iconClass="errors"
                value={loadingStats ? "…" : totalErrors.toLocaleString("it-IT")}
                label="Errori totali"
              />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard
                icon="bi-x-octagon-fill"
                iconClass="errors"
                value={loadingStats ? "…" : errorsBy5xx.toLocaleString("it-IT")}
                label="Errori 5xx"
              />
            </div>
            <div className="col-6 col-md-3">
              <KpiCard
                icon="bi-question-circle-fill"
                iconClass="warnings"
                value={loadingStats ? "…" : errorsBy4xx.toLocaleString("it-IT")}
                label="Errori 4xx"
              />
            </div>
          </div>

          {/* ── Grafici riga 1 ── */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-7">
              <div className="audit-panel h-100">
                <div className="audit-panel-header">
                  <h2 className="audit-panel-title">
                    <i className="bi bi-graph-up text-success" aria-hidden="true"></i>
                    Visite nel Tempo
                  </h2>
                  <span className="audit-date-range-badge">
                    {dateFrom} → {dateTo}
                  </span>
                </div>
                {loadingStats ? (
                  <div className="audit-loading-center"><LoadingSpinner /></div>
                ) : (
                  <LineChart
                    data={stats?.visitsByDay || []}
                    colorFrom="#198754"
                    gradientId="visits-gradient"
                    ariaLabel="Grafico visite giornaliere nel periodo selezionato"
                  />
                )}
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="audit-panel h-100">
                <div className="audit-panel-header">
                  <h2 className="audit-panel-title">
                    <i className="bi bi-bar-chart-fill text-danger" aria-hidden="true"></i>
                    Errori per Status
                  </h2>
                </div>
                {loadingStats ? (
                  <div className="audit-loading-center"><LoadingSpinner /></div>
                ) : (
                  <ErrorBarChart errorsByStatus={stats?.errorsByStatus || {}} />
                )}
              </div>
            </div>
          </div>

          {/* ── Grafici riga 2 ── */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-7">
              <div className="audit-panel">
                <div className="audit-panel-header">
                  <h2 className="audit-panel-title">
                    <i className="bi bi-graph-down text-danger" aria-hidden="true"></i>
                    Errori nel Tempo
                  </h2>
                </div>
                {loadingStats ? (
                  <div className="audit-loading-center"><LoadingSpinner /></div>
                ) : (
                  <LineChart
                    data={stats?.errorsByDay || []}
                    colorFrom="#dc3545"
                    gradientId="errors-gradient"
                    ariaLabel="Grafico errori API giornalieri nel periodo selezionato"
                  />
                )}
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="audit-panel">
                <div className="audit-panel-header">
                  <h2 className="audit-panel-title">
                    <i className="bi bi-link-45deg text-primary" aria-hidden="true"></i>
                    Top 10 Pagine
                  </h2>
                </div>
                {loadingStats ? (
                  <div className="audit-loading-center"><LoadingSpinner /></div>
                ) : (
                  <TopPagesChart topPages={stats?.topPages || []} />
                )}
              </div>
            </div>
          </div>

          {/* ── Tabella errori ── */}
          <div className="audit-panel">
            <div className="audit-panel-header">
              <h2 className="audit-panel-title">
                <i className="bi bi-table text-warning" aria-hidden="true"></i>
                Log Errori API
                {errors.length > 0 && !loadingErrors && (
                  <span className="badge bg-danger bg-opacity-10 text-danger ms-2 fw-semibold small">
                    {errors.length} / pagina
                  </span>
                )}
              </h2>
              <button
                id="audit-refresh-errors"
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={fetchErrors}
                disabled={loadingErrors}
                aria-label="Ricarica log errori"
              >
                <i className={`bi bi-arrow-clockwise${loadingErrors ? " audit-spin" : ""}`} aria-hidden="true"></i>
                <span className="d-none d-sm-inline">Aggiorna</span>
              </button>
            </div>

            {loadingErrors ? (
              <div className="audit-loading-center"><LoadingSpinner /></div>
            ) : (
              <ErrorsTable
                errors={errors}
                totalPages={errorsTotalPages}
                currentPage={errorsPage}
                onPageChange={(p) => setErrorsPage(p)}
              />
            )}
          </div>

        </div>
      </div>
    </>
  );
}
