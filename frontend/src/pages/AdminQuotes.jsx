import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import API_BASE_URL from "../config/api";
import { authApiFetch } from "../utils/apiClient";
import { handleEmailClick, handlePhoneClick } from "../utils/contactHelpers";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner/ErrorBanner";
import "./AdminQuotes.css";

const getEventTypeBadgeClass = (tipo) => {
  if (!tipo) return "event-badge-matrimonio";
  const normalized = tipo.toLowerCase().trim();
  if (normalized.includes("matrimonio") || normalized.includes("wedding")) {
    return "event-badge-matrimonio";
  }
  if (normalized.includes("aziendale") || normalized.includes("corporate")) {
    return "event-badge-aziendale";
  }
  if (normalized.includes("privato") || normalized.includes("private")) {
    return "event-badge-privato";
  }
  return "event-badge-altro";
};

function AdminQuotes() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [allQuotes, setAllQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [translatedText, setTranslatedText] = useState("");
  const [translating, setTranslating] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionError("");
    try {
      const data = await authApiFetch(`${API_BASE_URL}/api/admin/quotes`, {}, token, dispatch);
      setAllQuotes(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, dispatch]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const data = await authApiFetch(`${API_BASE_URL}/api/admin/quotes`, {}, token, dispatch);
        if (active) {
          setAllQuotes(data || []);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [token, dispatch]);

  const handleUpdateStatus = async (id, newStatus) => {
    setActionError("");
    try {
      const updated = await authApiFetch(
        `${API_BASE_URL}/api/admin/quotes/${id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stato: newStatus }),
        },
        token,
        dispatch
      );

      setAllQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote(updated);
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDeleteQuote = async (id) => {
    setActionError("");
    try {
      await authApiFetch(
        `${API_BASE_URL}/api/admin/quotes/${id}`,
        { method: "DELETE" },
        token,
        dispatch
      );

      setAllQuotes((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuote && selectedQuote.id === id) {
        setShowDetailModal(false);
        setSelectedQuote(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const openDetail = async (quote) => {
    setSelectedQuote(quote);
    setShowDetailModal(true);
    setTranslatedText("");
    setTranslating(false);

    if (quote.stato === "PENDING") {
      handleUpdateStatus(quote.id, "READ");
    }

    const isForeignLang = quote.lingua && quote.lingua.toLowerCase() !== "it";

    if (isForeignLang && quote.messaggio && quote.messaggio.trim() !== "") {
      setTranslating(true);
      try {
        const res = await authApiFetch(
          `${API_BASE_URL}/api/admin/quotes/translate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: quote.messaggio,
              sourceLang: quote.lingua || "autodetect",
              targetLang: "it",
            }),
          },
          token,
          dispatch
        );
        if (res?.translatedText && res.translatedText.trim() !== quote.messaggio.trim()) {
          setTranslatedText(res.translatedText);
        }
      } catch (err) {
        console.warn("[WARN AdminQuotes] Errore caricamento traduzione:", err);
      } finally {
        setTranslating(false);
      }
    }
  };

  // Conteggi KPI — calcolati in tempo reale sull'intero dataset
  const countAll = allQuotes.length;
  const countPending = allQuotes.filter((q) => q.stato === "PENDING").length;
  const countRead = allQuotes.filter((q) => q.stato === "READ").length;
  const countProcessed = allQuotes.filter((q) => q.stato === "PROCESSED").length;

  // Filtraggio per categoria attiva
  const categoryQuotes = activeFilter === "ALL"
    ? allQuotes
    : allQuotes.filter((q) => q.stato === activeFilter);

  // Filtro di ricerca testo in tempo reale
  const filteredQuotes = categoryQuotes.filter((q) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const fullName = `${q.nome} ${q.cognome}`.toLowerCase();
    const email = (q.email || "").toLowerCase();
    const phone = (q.telefono || "").toLowerCase();
    const location = (q.location || "").toLowerCase();
    const eventType = (q.tipoEvento || "").toLowerCase();
    return (
      fullName.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      location.includes(query) ||
      eventType.includes(query)
    );
  });

  return (
    <div className="container admin-quotes-page">
      {/* 1. Header Card con KPI e Titolo */}
      <div className="admin-header-card p-3 p-md-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h1 className="h3 font-heading fw-bold mb-1 admin-header-title d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-text-fill"></i> Area Riservata Admin - Gestione Preventivi
            </h1>
            <p className="text-muted small mb-0">
              Gestisci le richieste di preventivo ricevute. Rispondi, modifica lo stato ed elimina le pratiche.
            </p>
          </div>
          <button
            onClick={fetchQuotes}
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-2 align-self-start align-self-md-auto fw-semibold"
            title="Aggiorna elenco dati"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Aggiorna Dati</span>
          </button>
        </div>

        {/* KPI Summary Cards Grid */}
        <div className="row g-3 mb-3">
          <div className="col-6 col-md-3">
            <div className="kpi-card d-flex align-items-center gap-3 cursor-pointer" onClick={() => setActiveFilter("ALL")}>
              <div className="kpi-icon-wrapper bg-secondary bg-opacity-10 text-secondary">
                <i className="bi bi-inbox-fill"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold lh-1">{countAll}</div>
                <div className="text-muted small fw-semibold">Totali</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpi-card d-flex align-items-center gap-3 cursor-pointer" onClick={() => setActiveFilter("PENDING")}>
              <div className="kpi-icon-wrapper bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-clock-history"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold lh-1 text-warning">{countPending}</div>
                <div className="text-muted small fw-semibold">In Attesa</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpi-card d-flex align-items-center gap-3 cursor-pointer" onClick={() => setActiveFilter("READ")}>
              <div className="kpi-icon-wrapper bg-info bg-opacity-10 text-info">
                <i className="bi bi-envelope-open-fill"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold lh-1 text-info">{countRead}</div>
                <div className="text-muted small fw-semibold">Letti</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpi-card d-flex align-items-center gap-3 cursor-pointer" onClick={() => setActiveFilter("PROCESSED")}>
              <div className="kpi-icon-wrapper bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div>
                <div className="fs-4 fw-bold lh-1 text-success">{countProcessed}</div>
                <div className="text-muted small fw-semibold">Gestiti</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtri & Barra di Ricerca in Tempo Reale */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 pt-3 border-top border-secondary border-opacity-10">
          <div className="filter-btn-group d-flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`btn ${activeFilter === "ALL" ? "btn-success" : "btn-outline-secondary"}`}
            >
              Tutti ({countAll})
            </button>
            <button
              onClick={() => setActiveFilter("PENDING")}
              className={`btn ${activeFilter === "PENDING" ? "btn-warning text-dark fw-bold" : "btn-outline-warning"}`}
            >
              <i className="bi bi-clock-history me-1"></i> In Attesa ({countPending})
            </button>
            <button
              onClick={() => setActiveFilter("READ")}
              className={`btn ${activeFilter === "READ" ? "btn-info text-white fw-bold" : "btn-outline-info"}`}
            >
              <i className="bi bi-envelope-open me-1"></i> Letti ({countRead})
            </button>
            <button
              onClick={() => setActiveFilter("PROCESSED")}
              className={`btn ${activeFilter === "PROCESSED" ? "btn-success fw-bold" : "btn-outline-success"}`}
            >
              <i className="bi bi-check-circle me-1"></i> Gestiti ({countProcessed})
            </button>
          </div>

          <div className="search-input-wrapper">
            <i className="bi bi-search"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              placeholder="Cerca nome, email, città..."
            />
          </div>
        </div>
      </div>

      {/* Banner di errore per azioni (es. modifica stato/eliminazione fallita) */}
      {actionError && (
        <ErrorBanner
          message={actionError}
          type="danger"
          className="mb-4"
          onDismiss={() => setActionError("")}
          autoDismissMs={6000}
        />
      )}

      {/* Caricamento / Errori principali */}
      {loading && (
        <LoadingSpinner variant="inline" message="Caricamento preventivi in corso..." size="lg" />
      )}

      {error && !loading && (
        <ErrorBanner
          message={error}
          type="danger"
          className="mb-4"
          onDismiss={() => setError("")}
        />
      )}

      {/* Stato Vuoto */}
      {!loading && !error && filteredQuotes.length === 0 && (
        <div className="text-center py-5 border rounded bg-body-tertiary shadow-sm">
          <i className="bi bi-inbox fs-1 text-muted"></i>
          <h5 className="mt-3 text-muted">Nessuna richiesta di preventivo trovata.</h5>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="btn btn-link btn-sm text-success mt-2">
              Pulisci ricerca
            </button>
          )}
        </div>
      )}

      {/* 2. VISTA DESKTOP: Tabella Spaziosa con Scroll Orizzontale (>= 992px) */}
      {!loading && !error && filteredQuotes.length > 0 && (
        <>
          <div className="d-none d-lg-block">
            <div className="admin-table-container shadow-sm">
              <table className="table table-hover table-custom-admin align-middle">
                <thead className="admin-table-head">
                  <tr>
                    <th style={{ width: "135px" }}>Data Richiesta</th>
                    <th style={{ width: "200px" }}>Cliente</th>
                    <th style={{ width: "240px" }}>Contatti</th>
                    <th style={{ width: "160px" }}>Evento</th>
                    <th style={{ width: "120px" }}>Stato</th>
                    <th className="text-end" style={{ width: "160px" }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((q) => (
                    <tr key={q.id}>
                      <td className="small client-date-text text-nowrap">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(q.dataRichiesta).toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td>
                        <div className="client-name-text">
                          {q.nome} {q.cognome}
                        </div>
                        {q.location && (
                          <span className="small client-location-text d-block text-truncate" style={{ maxWidth: "180px" }} title={q.location}>
                            <i className="bi bi-geo-alt me-1 text-danger"></i>
                            {q.location}
                          </span>
                        )}
                      </td>
                      <td className="small">
                        <div>
                          <a
                            href={`mailto:${q.email}`}
                            onClick={(e) => handleEmailClick(e, q.email, dispatch)}
                            className="text-decoration-none contact-chip-email font-monospace"
                            title={q.email}
                          >
                            <i className="bi bi-envelope me-1"></i>
                            {q.email}
                          </a>
                        </div>
                        {q.telefono && (
                          <div>
                            <a
                              href={`tel:${q.telefono.replace(/[^\d+]/g, "")}`}
                              onClick={(e) => handlePhoneClick(e, q.telefono)}
                              className="text-decoration-none contact-chip-phone font-monospace"
                            >
                              <i className="bi bi-telephone me-1"></i>
                              {q.telefono}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="small">
                        <span className={`badge ${getEventTypeBadgeClass(q.tipoEvento)} mb-1`}>
                          {q.tipoEvento || "Matrimonio"}
                        </span>
                        {q.dataEvento && (
                          <div className="text-muted text-nowrap">
                            <i className="bi bi-calendar-event me-1"></i>
                            {q.dataEvento}
                          </div>
                        )}
                      </td>
                      <td>
                        {q.stato === "PENDING" && (
                          <span className="status-badge badge-pending">
                            <i className="bi bi-hourglass-split"></i> IN ATTESA
                          </span>
                        )}
                        {q.stato === "READ" && (
                          <span className="status-badge badge-read">
                            <i className="bi bi-envelope-open"></i> LETTO
                          </span>
                        )}
                        {q.stato === "PROCESSED" && (
                          <span className="status-badge badge-processed">
                            <i className="bi bi-check-lg"></i> GESTITO
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => openDetail(q)}
                            className="btn btn-outline-primary"
                            title="Vedi dettaglio completo"
                          >
                            <i className="bi bi-eye-fill"></i>
                          </button>

                          {q.stato !== "PENDING" && (
                            <button
                              onClick={() => handleUpdateStatus(q.id, "PENDING")}
                              className="btn btn-outline-warning"
                              title="Segna In Attesa"
                            >
                              <i className="bi bi-clock-history"></i>
                            </button>
                          )}

                          {q.stato !== "READ" && (
                            <button
                              onClick={() => handleUpdateStatus(q.id, "READ")}
                              className="btn btn-outline-info"
                              title="Segna come Letto"
                            >
                              <i className="bi bi-envelope-open"></i>
                            </button>
                          )}

                          {q.stato !== "PROCESSED" && (
                            <button
                              onClick={() => handleUpdateStatus(q.id, "PROCESSED")}
                              className="btn btn-outline-success"
                              title="Segna come Gestito"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteConfirmId(q.id)}
                            className="btn btn-outline-danger"
                            title="Elimina richiesta"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. VISTA MOBILE / TABLET: Card Responsive Grid (< 992px) */}
          <div className="d-block d-lg-none">
            <div className="row g-3">
              {filteredQuotes.map((q) => (
                <div className="col-12 col-md-6" key={q.id}>
                  <div className="quote-card-mobile h-100 d-flex flex-column justify-content-between">
                    <div>
                      {/* Card Header */}
                      <div className="quote-card-header d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div>
                            <h6 className="mb-0 client-name-text">{q.nome} {q.cognome}</h6>
                            <span className="small text-muted">
                              {new Date(q.dataRichiesta).toLocaleDateString("it-IT")}
                            </span>
                          </div>
                        </div>

                        <div>
                          {q.stato === "PENDING" && <span className="status-badge badge-pending">IN ATTESA</span>}
                          {q.stato === "READ" && <span className="status-badge badge-read">LETTO</span>}
                          {q.stato === "PROCESSED" && <span className="status-badge badge-processed">GESTITO</span>}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="quote-card-body">
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span className={`badge ${getEventTypeBadgeClass(q.tipoEvento)}`}>
                            <i className="bi bi-tag-fill me-1"></i>
                            {q.tipoEvento || "Matrimonio"}
                          </span>
                          {q.dataEvento && (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                              <i className="bi bi-calendar-event me-1"></i>
                              {q.dataEvento}
                            </span>
                          )}
                          {q.location && (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">
                              <i className="bi bi-geo-alt me-1"></i>
                              {q.location}
                            </span>
                          )}
                        </div>

                        {/* Direct Contact Links */}
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {q.email && (
                            <a
                              href={`mailto:${q.email}`}
                              onClick={(e) => handleEmailClick(e, q.email, dispatch)}
                              className="contact-chip contact-chip-email"
                            >
                              <i className="bi bi-envelope-fill"></i>
                              <span className="text-truncate" style={{ maxWidth: "160px" }}>{q.email}</span>
                            </a>
                          )}
                          {q.telefono && (
                            <a
                              href={`tel:${q.telefono.replace(/[^\d+]/g, "")}`}
                              onClick={(e) => handlePhoneClick(e, q.telefono)}
                              className="contact-chip contact-chip-phone"
                            >
                              <i className="bi bi-telephone-fill"></i>
                              <span>{q.telefono}</span>
                            </a>
                          )}
                        </div>

                        {q.messaggio && (
                          <div className="small text-muted bg-body-tertiary p-2 rounded border line-clamp-2">
                            "{q.messaggio}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="quote-card-footer d-flex justify-content-between align-items-center gap-2">
                      <button
                        onClick={() => openDetail(q)}
                        className="btn btn-outline-primary btn-sm flex-grow-1 fw-semibold"
                      >
                        <i className="bi bi-eye me-1"></i> Dettagli
                      </button>

                      <div className="btn-group btn-group-sm">
                        {q.stato !== "PENDING" && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, "PENDING")}
                            className="btn btn-outline-warning"
                            title="Segna In Attesa"
                          >
                            <i className="bi bi-clock-history"></i>
                          </button>
                        )}

                        {q.stato !== "READ" && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, "READ")}
                            className="btn btn-outline-info"
                            title="Segna come Letto"
                          >
                            <i className="bi bi-envelope-open"></i>
                          </button>
                        )}

                        {q.stato !== "PROCESSED" && (
                          <button
                            onClick={() => handleUpdateStatus(q.id, "PROCESSED")}
                            className="btn btn-outline-success"
                            title="Segna come Gestito"
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteConfirmId(q.id)}
                          className="btn btn-outline-danger"
                          title="Elimina"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modale Dettaglio Preventivo */}
      {showDetailModal && selectedQuote && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title font-heading fw-bold">
                  <i className="bi bi-file-earmark-person me-2"></i>
                  Dettaglio Richiesta Preventivo #{selectedQuote.id.substring(0, 8)}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold">Nome e Cognome</label>
                    <p className="fs-5 fw-bold mb-0">{selectedQuote.nome} {selectedQuote.cognome}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold">Stato Attuale</label>
                    <div>
                      {selectedQuote.stato === "PENDING" && <span className="status-badge badge-pending">IN ATTESA</span>}
                      {selectedQuote.stato === "READ" && <span className="status-badge badge-read">LETTO</span>}
                      {selectedQuote.stato === "PROCESSED" && <span className="status-badge badge-processed">GESTITO</span>}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold d-block mb-1">Email</label>
                    <p className="mb-0 fw-semibold">
                      <a
                        href={`mailto:${selectedQuote.email}`}
                        onClick={(e) => handleEmailClick(e, selectedQuote.email, dispatch)}
                        className="text-decoration-none contact-chip-email"
                      >
                        <i className="bi bi-envelope me-1"></i>
                        {selectedQuote.email}
                      </a>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold d-block mb-1">Telefono</label>
                    <p className="mb-0 fw-semibold">
                      {selectedQuote.telefono ? (
                        <a
                          href={`tel:${selectedQuote.telefono.replace(/[^\d+]/g, "")}`}
                          onClick={(e) => handlePhoneClick(e, selectedQuote.telefono)}
                          className="text-decoration-none contact-chip-phone"
                        >
                          <i className="bi bi-telephone me-1"></i>
                          {selectedQuote.telefono}
                        </a>
                      ) : (
                        <span className="text-muted">Non specificato</span>
                      )}
                    </p>
                  </div>

                  <hr className="my-2" />

                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold d-block">Data Evento</label>
                    <p className="mb-0 fw-bold">{selectedQuote.dataEvento || "Non specificata"}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold d-block mb-1">Tipo Evento</label>
                    <div>
                      <span className={`badge ${getEventTypeBadgeClass(selectedQuote.tipoEvento)} fs-6`}>
                        {selectedQuote.tipoEvento || "Matrimonio"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold d-block">Location Evento</label>
                    <p className="mb-0">{selectedQuote.location || "Non specificata"}</p>
                  </div>

                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold d-block">Numero Ospiti</label>
                    <p className="mb-0">{selectedQuote.numeroOspiti || "Non specificato"}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold d-block">Orario Giornata</label>
                    <p className="mb-0">{selectedQuote.orarioGiornata || "Non specificato"}</p>
                  </div>
                  {selectedQuote.tipoCerimonia &&
                   selectedQuote.tipoEvento &&
                   selectedQuote.tipoEvento.toLowerCase().includes("matrimonio") && (
                    <div className="col-md-4">
                      <label className="text-muted small fw-semibold d-block">Tipo Cerimonia</label>
                      <p className="mb-0">{selectedQuote.tipoCerimonia}</p>
                    </div>
                  )}

                  {selectedQuote.budget && (
                    <div className="col-md-12">
                      <label className="text-muted small fw-semibold d-block mb-1">Idea di Budget</label>
                      <span className="badge bg-secondary fs-6 mt-1">{selectedQuote.budget}</span>
                    </div>
                  )}

                  <div className="col-md-12 mt-3">
                    <label className="text-muted small fw-semibold">Messaggio / Idea di Festa</label>
                    <div className="p-3 rounded bg-body-tertiary border message-box-dark">
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {selectedQuote.messaggio || "Nessun messaggio inserito."}
                      </p>
                    </div>
                  </div>

                  {translating && (
                    <div className="col-md-12 mt-2">
                      <div className="text-muted small d-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                        <span>Traduzione messaggio per Admin in corso...</span>
                      </div>
                    </div>
                  )}

                  {translatedText && !translating && (
                    <div className="col-md-12 mt-3">
                      <div className="p-3 rounded bg-success bg-opacity-10 border border-success border-opacity-25">
                        <div className="fw-bold text-success mb-1 small d-flex align-items-center gap-1">
                          <i className="bi bi-translate"></i>
                          <span>🇮🇹 Traduzione in Italiano per Admin:</span>
                        </div>
                        <p className="mb-0 text-success-emphasis" style={{ whiteSpace: "pre-wrap" }}>
                          {translatedText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer bg-body-tertiary d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="small text-muted fw-semibold me-1">Cambia Stato:</span>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, "PENDING")}
                    className={`btn btn-sm ${selectedQuote.stato === "PENDING" ? "btn-warning text-dark fw-bold disabled" : "btn-outline-warning"}`}
                  >
                    <i className="bi bi-clock-history me-1"></i> In Attesa
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, "READ")}
                    className={`btn btn-sm ${selectedQuote.stato === "READ" ? "btn-info text-white fw-bold disabled" : "btn-outline-info"}`}
                  >
                    <i className="bi bi-envelope-open me-1"></i> Letto
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, "PROCESSED")}
                    className={`btn btn-sm ${selectedQuote.stato === "PROCESSED" ? "btn-success fw-bold disabled" : "btn-outline-success"}`}
                  >
                    <i className="bi bi-check-circle me-1"></i> Gestito
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale Conferma Eliminazione */}
      {deleteConfirmId && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title font-heading fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Conferma Eliminazione
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeleteConfirmId(null)}
                ></button>
              </div>
              <div className="modal-body">
                Sei sicuro di voler eliminare definitivamente questa richiesta di preventivo? L'azione non può essere annullata.
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm fw-bold"
                  onClick={() => handleDeleteQuote(deleteConfirmId)}
                >
                  Elimina Definitivamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminQuotes;
