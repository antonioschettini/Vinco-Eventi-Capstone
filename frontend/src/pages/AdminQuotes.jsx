import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import API_BASE_URL from "../config/api";
import "./AdminQuotes.css";

function AdminQuotes() {
  const { token } = useSelector((state) => state.auth);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/admin/quotes`;
      if (activeFilter !== "ALL") {
        url += `?status=${activeFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Impossibile caricare la lista dei preventivi.");
      }

      const data = await response.json();
      setQuotes(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, token]);

  useEffect(() => {
    let isSubscribed = true;
    const loadQuotes = async () => {
      try {
        let url = `${API_BASE_URL}/api/admin/quotes`;
        if (activeFilter !== "ALL") {
          url += `?status=${activeFilter}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Impossibile caricare la lista dei preventivi.");
        }

        const data = await response.json();
        if (isSubscribed) {
          setQuotes(data);
          setError("");
        }
      } catch (err) {
        if (isSubscribed) {
          setError(err.message);
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadQuotes();
    return () => {
      isSubscribed = false;
    };
  }, [activeFilter, token]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/quotes/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stato: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Errore nell'aggiornamento dello stato.");
      }

      const updated = await response.json();
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote(updated);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuote = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/quotes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione del preventivo.");
      }

      setQuotes((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuote && selectedQuote.id === id) {
        setShowDetailModal(false);
        setSelectedQuote(null);
      }
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openDetail = (quote) => {
    setSelectedQuote(quote);
    setShowDetailModal(true);
    if (quote.stato === "PENDING") {
      handleUpdateStatus(quote.id, "READ");
    }
  };

  // Filtro di ricerca in tempo reale
  const filteredQuotes = quotes.filter((q) => {
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

  // Conteggi KPI
  const countAll = quotes.length;
  const countPending = quotes.filter((q) => q.stato === "PENDING").length;
  const countRead = quotes.filter((q) => q.stato === "READ").length;
  const countProcessed = quotes.filter((q) => q.stato === "PROCESSED").length;

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

      {/* Caricamento / Errori */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-2 text-muted">Caricamento preventivi in corso...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
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
                    <th className="text-end" style={{ width: "130px" }}>Azioni</th>
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
                          <a href={`mailto:${q.email}`} className="text-decoration-none contact-chip-email font-monospace" title={q.email}>
                            <i className="bi bi-envelope me-1"></i>
                            {q.email}
                          </a>
                        </div>
                        <div>
                          <a href={`tel:${(q.telefono || "").replace(/[^\d+]/g, "")}`} className="text-decoration-none contact-chip-phone font-monospace">
                            <i className="bi bi-telephone me-1"></i>
                            {q.telefono}
                          </a>
                        </div>
                      </td>
                      <td className="small">
                        <span className="badge bg-secondary mb-1">{q.tipoEvento || "Matrimonio"}</span>
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

                          {q.stato !== "PROCESSED" ? (
                            <button
                              onClick={() => handleUpdateStatus(q.id, "PROCESSED")}
                              className="btn btn-outline-success"
                              title="Segna come Gestito"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(q.id, "PENDING")}
                              className="btn btn-outline-warning"
                              title="Riporta in Attesa"
                            >
                              <i className="bi bi-arrow-counterclockwise"></i>
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
                          <span className="badge bg-secondary">
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
                          <a href={`mailto:${q.email}`} className="contact-chip contact-chip-email">
                            <i className="bi bi-envelope-fill"></i>
                            <span className="text-truncate" style={{ maxWidth: "160px" }}>{q.email}</span>
                          </a>
                          <a href={`tel:${(q.telefono || "").replace(/[^\d+]/g, "")}`} className="contact-chip contact-chip-phone">
                            <i className="bi bi-telephone-fill"></i>
                            <span>{q.telefono}</span>
                          </a>
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

                      {q.stato !== "PROCESSED" ? (
                        <button
                          onClick={() => handleUpdateStatus(q.id, "PROCESSED")}
                          className="btn btn-success btn-sm fw-semibold"
                          title="Segna Gestito"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(q.id, "PENDING")}
                          className="btn btn-warning btn-sm text-dark fw-semibold"
                          title="Riporta in Attesa"
                        >
                          <i className="bi bi-arrow-counterclockwise"></i>
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmId(q.id)}
                        className="btn btn-outline-danger btn-sm"
                        title="Elimina"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
                    <label className="text-muted small fw-semibold">Email</label>
                    <p className="mb-0 fw-semibold text-primary">
                      <a href={`mailto:${selectedQuote.email}`} className="text-decoration-none">
                        {selectedQuote.email}
                      </a>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold">Telefono</label>
                    <p className="mb-0 fw-semibold">
                      <a href={`tel:${(selectedQuote.telefono || "").replace(/[^\d+]/g, "")}`} className="text-decoration-none text-body">
                        {selectedQuote.telefono}
                      </a>
                    </p>
                  </div>

                  <hr className="my-2" />

                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Data Evento</label>
                    <p className="mb-0 fw-bold">{selectedQuote.dataEvento || "Non specificata"}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Tipo Evento</label>
                    <p className="mb-0 fw-bold">{selectedQuote.tipoEvento || "Matrimonio"}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Location Evento</label>
                    <p className="mb-0">{selectedQuote.location || "Non specificata"}</p>
                  </div>

                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Numero Ospiti</label>
                    <p className="mb-0">{selectedQuote.numeroOspiti || "Non specificato"}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Orario Giornata</label>
                    <p className="mb-0">{selectedQuote.orarioGiornata || "Non specificato"}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Tipo Cerimonia</label>
                    <p className="mb-0">{selectedQuote.tipoCerimonia || "Non specificato"}</p>
                  </div>

                  {selectedQuote.budget && (
                    <div className="col-md-12">
                      <label className="text-muted small fw-semibold">Idea di Budget</label>
                      <p className="mb-0 badge bg-secondary fs-6">{selectedQuote.budget}</p>
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
                </div>
              </div>
              <div className="modal-footer bg-body-tertiary d-flex justify-content-between">
                <div>
                  {selectedQuote.stato !== "PROCESSED" ? (
                    <button
                      onClick={() => handleUpdateStatus(selectedQuote.id, "PROCESSED")}
                      className="btn btn-success btn-sm me-2"
                    >
                      <i className="bi bi-check-circle me-1"></i> Segna Gestito
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(selectedQuote.id, "PENDING")}
                      className="btn btn-warning btn-sm me-2"
                    >
                      <i className="bi bi-clock-history me-1"></i> Segna In Attesa
                    </button>
                  )}
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
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
