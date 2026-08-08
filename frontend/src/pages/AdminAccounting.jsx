import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import { authApiFetch } from "../utils/apiClient";
import { logout } from "../redux/slices/authSlice";
import { setGlobalError } from "../redux/slices/uiSlice";
import "./AdminAccounting.css";

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export default function AdminAccounting() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12, 0 = tutti
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "table"

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({
    totaleLordo: 0,
    totaleSpese: 0,
    totaleNetto: 0,
    stimaTasse: 0,
    nettoPostTasse: 0,
    numeroEventi: 0
  });

  // Modalità calcolo tasse: "percent" (%) oppure "manual" (€ fisso)
  const [taxMode, setTaxMode] = useState("percent");
  const [taxPercent, setTaxPercent] = useState(20);
  const [taxManualAmount, setTaxManualAmount] = useState(0);

  // Stato per la modale di editing/creazione evento
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    titolo: "",
    clienteNome: "",
    clienteCognome: "",
    clienteEmail: "",
    clienteTelefono: "",
    dataEvento: "",
    location: "",
    tipoEvento: "Matrimonio",
    importoLordo: 0,
    totaleSpese: 0,
    tasseStimate: 0,
    note: "",
    isManual: true
  });

  // Lista spese collaboratori/fornitori per l'evento correntemente aperto
  const [speseList, setSpeseList] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const fetchEventsAndReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      let urlEvents = `${API_BASE_URL}/api/admin/agenda?year=${currentYear}`;
      let urlReport = `${API_BASE_URL}/api/admin/agenda/report?year=${currentYear}`;
      if (selectedMonth !== 0) {
        urlEvents += `&month=${selectedMonth}`;
        urlReport += `&month=${selectedMonth}`;
      }

      const [eventsData, reportData] = await Promise.all([
        authApiFetch(urlEvents, {}, token, dispatch),
        authApiFetch(urlReport, {}, token, dispatch)
      ]);

      setEvents(eventsData || []);
      setReport(reportData || {
        totaleLordo: 0,
        totaleSpese: 0,
        totaleNetto: 0,
        stimaTasse: 0,
        nettoPostTasse: 0,
        numeroEventi: 0
      });
    } catch (err) {
      dispatch(setGlobalError({ message: err.message || "Impossibile caricare i dati dell'agenda", type: "danger" }));
    } finally {
      setLoading(false);
    }
  }, [currentYear, selectedMonth, token, dispatch]);

  useEffect(() => {
    fetchEventsAndReport();
  }, [fetchEventsAndReport]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin-enzo");
  };

  // Apertura modale per NUOVO evento
  const handleOpenNewModal = (defaultDate = "") => {
    const today = new Date();
    const formattedDate = defaultDate || `${currentYear}-${String(selectedMonth || (today.getMonth() + 1)).padStart(2, "0")}-01`;
    setEditingEvent(null);
    setFormData({
      titolo: "",
      clienteNome: "",
      clienteCognome: "",
      clienteEmail: "",
      clienteTelefono: "",
      dataEvento: formattedDate,
      location: "",
      tipoEvento: "Matrimonio",
      importoLordo: 0,
      totaleSpese: 0,
      tasseStimate: 0,
      note: "",
      isManual: true
    });
    setSpeseList([]);
    setShowModal(true);
  };

  // Apertura modale per EDITING evento
  const handleOpenEditModal = (ev) => {
    setEditingEvent(ev);
    setFormData({
      titolo: ev.titolo || "",
      clienteNome: ev.clienteNome || "",
      clienteCognome: ev.clienteCognome || "",
      clienteEmail: ev.clienteEmail || "",
      clienteTelefono: ev.clienteTelefono || "",
      dataEvento: ev.dataEvento || "",
      location: ev.location || "",
      tipoEvento: ev.tipoEvento || "Matrimonio",
      importoLordo: ev.importoLordo || 0,
      totaleSpese: ev.totaleSpese || 0,
      tasseStimate: ev.tasseStimate || 0,
      note: ev.note || "",
      isManual: ev.isManual
    });

    try {
      const parsed = ev.speseJson ? JSON.parse(ev.speseJson) : [];
      setSpeseList(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setSpeseList([]);
    }

    setShowModal(true);
  };

  // Aggiungi una riga spesa collaboratore
  const handleAddSpesaRow = () => {
    setSpeseList([
      ...speseList,
      { id: Date.now().toString(), descrizione: "", importo: 0 }
    ]);
  };

  // Modifica riga spesa collaboratore
  const handleUpdateSpesaRow = (id, field, value) => {
    const updated = speseList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === "importo" ? (parseFloat(value) || 0) : value
        };
      }
      return item;
    });
    setSpeseList(updated);

    // Calcola e aggiorna automaticamente il totale spese nel form
    const sumSpese = updated.reduce((acc, curr) => acc + (parseFloat(curr.importo) || 0), 0);
    setFormData((prev) => ({ ...prev, totaleSpese: sumSpese }));
  };

  // Rimuovi riga spesa collaboratore
  const handleRemoveSpesaRow = (id) => {
    const updated = speseList.filter((item) => item.id !== id);
    setSpeseList(updated);
    const sumSpese = updated.reduce((acc, curr) => acc + (parseFloat(curr.importo) || 0), 0);
    setFormData((prev) => ({ ...prev, totaleSpese: sumSpese }));
  };

  // Salva evento (POST o PUT)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const sumSpese = speseList.reduce((acc, curr) => acc + (parseFloat(curr.importo) || 0), 0);
      const payload = {
        ...formData,
        importoLordo: parseFloat(formData.importoLordo) || 0,
        totaleSpese: sumSpese,
        speseJson: JSON.stringify(speseList),
        tasseStimate: parseFloat(formData.tasseStimate) || 0
      };

      const isEdit = Boolean(editingEvent?.id);
      const url = isEdit ? `${API_BASE_URL}/api/admin/agenda/${editingEvent.id}` : `${API_BASE_URL}/api/admin/agenda`;
      const method = isEdit ? "PUT" : "POST";

      await authApiFetch(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        },
        token,
        dispatch
      );

      setShowModal(false);
      fetchEventsAndReport();
    } catch (err) {
      dispatch(setGlobalError({ message: err.message || "Impossibile salvare l'evento contabile", type: "danger" }));
    }
  };

  // Elimina evento
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo evento dall'Agenda Contabile?")) return;
    try {
      await authApiFetch(
        `${API_BASE_URL}/api/admin/agenda/${eventId}`,
        { method: "DELETE" },
        token,
        dispatch
      );

      setShowModal(false);
      fetchEventsAndReport();
    } catch (err) {
      dispatch(setGlobalError({ message: err.message || "Impossibile eliminare l'evento", type: "danger" }));
    }
  };

  // Upload Contratto PDF
  const handleUploadContract = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!editingEvent?.id) {
      alert("Salva prima l'evento per poter allegare il contratto PDF.");
      return;
    }

    setUploadingPdf(true);
    try {
      const bodyData = new FormData();
      bodyData.append("file", file);

      const updatedEvent = await authApiFetch(
        `${API_BASE_URL}/api/admin/agenda/${editingEvent.id}/contratto`,
        {
          method: "POST",
          body: bodyData
        },
        token,
        dispatch
      );

      setEditingEvent(updatedEvent);
      fetchEventsAndReport();
    } catch (err) {
      dispatch(setGlobalError({ message: err.message || "Errore durante l'upload del contratto PDF", type: "danger" }));
    } finally {
      setUploadingPdf(false);
    }
  };

  // Eliminazione Contratto PDF
  const handleDeleteContract = async () => {
    if (!window.confirm("Vuoi rimuovere il contratto PDF allegato?")) return;
    try {
      const updatedEvent = await authApiFetch(
        `${API_BASE_URL}/api/admin/agenda/${editingEvent.id}/contratto`,
        { method: "DELETE" },
        token,
        dispatch
      );

      setEditingEvent(updatedEvent);
      fetchEventsAndReport();
    } catch (err) {
      dispatch(setGlobalError({ message: err.message || "Impossibile eliminare il contratto PDF", type: "danger" }));
    }
  };

  // Costruzione griglia calendario mensile
  const renderCalendarDays = () => {
    const monthIndex = selectedMonth === 0 ? 0 : selectedMonth - 1;
    const firstDayOfMonth = new Date(currentYear, monthIndex, 1);
    const lastDayOfMonth = new Date(currentYear, monthIndex + 1, 0);

    // Giorno della settimana del 1° del mese (0 = Domenica -> convertito in 0 = Lunedì)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const cells = [];

    // Celle vuote mese precedente
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(
        <div key={`empty-${i}`} className="calendar-day-cell other-month"></div>
      );
    }

    // Celle del mese selezionato
    const todayStr = new Date().toISOString().split("T")[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events.filter((ev) => ev.dataEvento === dateStr);
      const isToday = dateStr === todayStr;

      cells.push(
        <div
          key={`day-${day}`}
          className={`calendar-day-cell ${isToday ? "today" : ""}`}
          onClick={() => handleOpenNewModal(dateStr)}
        >
          <div className="day-number">
            <span>{day}</span>
            <i className="bi bi-plus-circle-fill add-event-plus" title="Aggiungi evento"></i>
          </div>
          <div className="events-wrapper">
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                className={`event-chip ${ev.isManual ? "manual-event" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(ev);
                }}
                title={`${ev.titolo} - Lordo: €${ev.importoLordo}`}
              >
                <div className="text-truncate">{ev.titolo}</div>
                <span className="event-chip-amount">€ {ev.importoLordo?.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Calcoli finanziari flessibili (Percentuale % oppure Importo Fissato €)
  const lordoTot = report?.totaleLordo || 0;
  const speseTot = report?.totaleSpese || 0;
  const nettoOp = lordoTot - speseTot;

  let tasseCalcolate = 0;
  if (taxMode === "percent") {
    tasseCalcolate = (nettoOp * (parseFloat(taxPercent) || 0)) / 100;
  } else {
    tasseCalcolate = parseFloat(taxManualAmount) || 0;
  }

  const nettoPostTasse = nettoOp - tasseCalcolate;

  return (
    <div className="admin-accounting-page container">
      {/* Intestazione Dashboard & Navigazione Tab */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2 rounded-pill mb-2">
            VINCO EVENTI • AREA GESTIONALE
          </span>
          <h1 className="h2 fw-bold mb-0">Agenda Contabile & Eventi</h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
            <i className="bi bi-box-arrow-right me-1"></i> Esci
          </button>
        </div>
      </div>

      {/* Sub-Navigazione per passare tra Preventivi e Agenda */}
      <div className="admin-subnav">
        <Link to="/admin-enzo/preventivi" className="admin-nav-link">
          <i className="bi bi-file-earmark-text me-1"></i> Richieste Preventivo
        </Link>
        <Link to="/admin-enzo/agenda" className="admin-nav-link active">
          <i className="bi bi-calendar-check me-1"></i> Agenda & Contabilità
        </Link>
      </div>

      {/* Barra Filtri: Anno, Mesi, Pulsante Nuovo Evento */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <label className="fw-bold text-secondary me-1 small">Anno:</label>
              <select
                className="form-select form-select-sm rounded-pill font-monospace"
                style={{ width: "110px" }}
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Pillole Mesi */}
            <div className="d-flex flex-wrap gap-1 align-items-center">
              <button
                className={`month-pill ${selectedMonth === 0 ? "active" : ""}`}
                onClick={() => setSelectedMonth(0)}
              >
                Tutti i Mesi
              </button>
              {MONTH_NAMES.map((m, idx) => (
                <button
                  key={m}
                  className={`month-pill ${selectedMonth === idx + 1 ? "active" : ""}`}
                  onClick={() => setSelectedMonth(idx + 1)}
                >
                  {m.substring(0, 3)}
                </button>
              ))}
            </div>

            {/* Toggle Vista e Nuovo Evento */}
            <div className="d-flex align-items-center gap-2">
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${viewMode === "calendar" ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={() => setViewMode("calendar")}
                >
                  <i className="bi bi-calendar3 me-1"></i> Calendario
                </button>
                <button
                  className={`btn ${viewMode === "table" ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={() => setViewMode("table")}
                >
                  <i className="bi bi-table me-1"></i> Foglio Excel
                </button>
              </div>

              <button
                onClick={() => handleOpenNewModal()}
                className="btn btn-success btn-sm rounded-pill px-3 fw-bold"
              >
                <i className="bi bi-plus-lg me-1"></i> Nuovo Evento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Report Finanziario */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="financial-kpi-card kpi-lordo">
            <div className="financial-kpi-icon">
              <i className="bi bi-cash-stack"></i>
            </div>
            <div>
              <span className="text-secondary small fw-bold text-uppercase d-block">Totale Lordo</span>
              <span className="h4 fw-bold mb-0">€ {lordoTot.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="financial-kpi-card kpi-spese">
            <div className="financial-kpi-icon">
              <i className="bi bi-receipt-cutoff"></i>
            </div>
            <div>
              <span className="text-secondary small fw-bold text-uppercase d-block">Spese Collaboratori</span>
              <span className="h4 fw-bold mb-0 text-danger">- € {speseTot.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="financial-kpi-card kpi-netto">
            <div className="financial-kpi-icon">
              <i className="bi bi-wallet2"></i>
            </div>
            <div>
              <span className="text-secondary small fw-bold text-uppercase d-block">Netto Operativo</span>
              <span className="h4 fw-bold mb-0 text-primary">€ {nettoOp.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="financial-kpi-card kpi-tasse">
            <div className="financial-kpi-icon">
              <i className="bi bi-piggy-bank"></i>
            </div>
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase">Netto Post-Tasse</span>
                
                {/* Switcher Modalità Tasse: Percentuale % vs Cifra Esatta € */}
                <div className="btn-group btn-group-xs">
                  <button
                    type="button"
                    className={`btn btn-xs px-2 py-0 fw-bold ${taxMode === "percent" ? "btn-warning text-dark" : "btn-outline-secondary"}`}
                    onClick={() => setTaxMode("percent")}
                    title="Imposta % Tasse"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs px-2 py-0 fw-bold ${taxMode === "manual" ? "btn-warning text-dark" : "btn-outline-secondary"}`}
                    onClick={() => setTaxMode("manual")}
                    title="Imposta € Importo Fissato Tasse"
                  >
                    €
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center gap-1 mb-1">
                {taxMode === "percent" ? (
                  <div className="d-flex align-items-center gap-1 bg-warning bg-opacity-10 text-dark px-2 py-1 rounded">
                    <span className="small fw-bold">Tasse:</span>
                    <input
                      type="number"
                      step="0.5"
                      className="border-0 bg-transparent fw-bold text-dark text-end font-monospace"
                      style={{ width: "45px" }}
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                    />
                    <span className="small fw-bold">%</span>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-1 bg-warning bg-opacity-10 text-dark px-2 py-1 rounded">
                    <span className="small fw-bold">€ Tasse:</span>
                    <input
                      type="number"
                      step="10"
                      className="border-0 bg-transparent fw-bold text-dark text-end font-monospace"
                      style={{ width: "70px" }}
                      value={taxManualAmount}
                      onChange={(e) => setTaxManualAmount(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <span className="h4 fw-bold mb-0 text-success d-block">
                € {nettoPostTasse.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VISTA CALENDARIO */}
      {viewMode === "calendar" && (
        <div className="calendar-container">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 text-success">
              <i className="bi bi-calendar-event me-2"></i>
              {selectedMonth === 0 ? `Anno ${currentYear} (Seleziona un mese per la griglia dettagliata)` : `${MONTH_NAMES[selectedMonth - 1]} ${currentYear}`}
            </h5>
            <span className="badge bg-secondary bg-opacity-10 text-secondary">
              {events.length} eventi in programma
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5 text-success">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <span>Caricamento eventi in corso...</span>
            </div>
          ) : selectedMonth === 0 ? (
            <div className="alert alert-info border-0 rounded-4 p-4 text-center my-3">
              <i className="bi bi-info-circle-fill display-6 mb-2 d-block"></i>
              Seleziona un mese specifico dalle pillole in alto per visualizzare la griglia del calendario giorno per giorno.
            </div>
          ) : (
            <>
              <div className="calendar-weekdays">
                {WEEKDAY_NAMES.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="calendar-days-grid">{renderCalendarDays()}</div>
            </>
          )}
        </div>
      )}

      {/* VISTA TABELLA EXCEL */}
      {viewMode === "table" && (
        <div className="excel-table-card">
          <div className="table-responsive">
            <table className="table excel-table align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Titolo Evento / Cliente</th>
                  <th>Tipo / Location</th>
                  <th className="text-end">Lordo (€)</th>
                  <th className="text-end">Spese (€)</th>
                  <th className="text-end">Netto (€)</th>
                  <th className="text-center">Contratto PDF</th>
                  <th className="text-end">Azione</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      Caricamento in corso...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      Nessun evento registrato per il periodo selezionato.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id}>
                      <td className="fw-bold font-monospace text-success">{ev.dataEvento}</td>
                      <td>
                        <div className="fw-bold">{ev.titolo}</div>
                        {ev.clienteNome && (
                          <small className="text-muted d-block">
                            {ev.clienteNome} {ev.clienteCognome} {ev.clienteTelefono && `• ${ev.clienteTelefono}`}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark me-1">{ev.tipoEvento || "Evento"}</span>
                        <small className="text-muted">{ev.location}</small>
                      </td>
                      <td className="text-end fw-bold text-dark">
                        € {ev.importoLordo?.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-danger fw-semibold">
                        € {ev.totaleSpese?.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-success fw-bold">
                        € {ev.totaleNetto?.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        {ev.contrattoUrl ? (
                          <a
                            href={ev.contrattoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-success rounded-pill px-2 py-0"
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i> Visualizza
                          </a>
                        ) : (
                          <span className="text-muted small">Nessuno</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          className="btn btn-sm btn-outline-primary rounded-pill me-1"
                        >
                          <i className="bi bi-pencil-square me-1"></i> Modifica
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALE EXCEL EDITOR EVENTO */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-success">
                  <i className="bi bi-calculator me-2"></i>
                  {editingEvent ? "Modifica Evento Contabile" : "Nuovo Evento in Agenda"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSaveEvent}>
                <div className="modal-body p-4">
                  {/* SEZIONE 1: DATI EVENTO E CLIENTE */}
                  <h6 className="fw-bold text-secondary mb-3 text-uppercase small border-bottom pb-2">
                    1. Informazioni Generali & Cliente
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Titolo Evento *</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        required
                        placeholder="es. Matrimonio Rossi"
                        value={formData.titolo}
                        onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label small fw-bold">Data Evento *</label>
                      <input
                        type="date"
                        className="form-control rounded-3"
                        required
                        value={formData.dataEvento}
                        onChange={(e) => setFormData({ ...formData, dataEvento: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label small fw-bold">Tipo Evento</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Matrimonio, Evento Aziendale"
                        value={formData.tipoEvento}
                        onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Nome Cliente</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Nome"
                        value={formData.clienteNome}
                        onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Cognome Cliente</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Cognome"
                        value={formData.clienteCognome}
                        onChange={(e) => setFormData({ ...formData, clienteCognome: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Telefono Cliente</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. +39 333..."
                        value={formData.clienteTelefono}
                        onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-bold">Location / Venue</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Villa / Location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Email Cliente</label>
                      <input
                        type="email"
                        className="form-control rounded-3"
                        placeholder="es. cliente@email.it"
                        value={formData.clienteEmail}
                        onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SEZIONE 2: ECONOMIA & SPESE COLLABORATORI (STILE EXCEL) */}
                  <h6 className="fw-bold text-secondary mb-3 text-uppercase small border-bottom pb-2">
                    2. Contabilità, Prezzo & Spese Fornitori (Excel Grid)
                  </h6>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-success">Importo Lordo Concordato (€) *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-success bg-opacity-10 text-success fw-bold">€</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-lg fw-bold text-success"
                          value={formData.importoLordo}
                          onChange={(e) => setFormData({ ...formData, importoLordo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center h-100">
                        <div>
                          <small className="text-uppercase fw-bold text-secondary d-block">Totale Netto Operativo</small>
                          <span className="h4 fw-bold text-primary mb-0">
                            € {((parseFloat(formData.importoLordo) || 0) - (parseFloat(formData.totaleSpese) || 0)).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-end">
                          <small className="text-uppercase fw-bold text-danger d-block">Totale Spese</small>
                          <span className="h6 fw-bold text-danger mb-0">
                            € {(parseFloat(formData.totaleSpese) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabella Spese Collaboratori */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label small fw-bold text-secondary mb-0">
                        Dettaglio Spese Collaboratori / Extra:
                      </label>
                      <button
                        type="button"
                        onClick={handleAddSpesaRow}
                        className="btn btn-sm btn-outline-success rounded-pill"
                      >
                        <i className="bi bi-plus-lg me-1"></i> Aggiungi Voce Spesa
                      </button>
                    </div>

                    <div className="expenses-table-container">
                      <table className="table expenses-table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Descrizione Spesa / Fornitore</th>
                            <th style={{ width: "160px" }} className="text-end">Costo (€)</th>
                            <th style={{ width: "60px" }} className="text-center">Azione</th>
                          </tr>
                        </thead>
                        <tbody>
                          {speseList.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center py-3 text-muted small">
                                Nessuna spesa ancora registrata per questo evento.
                              </td>
                            </tr>
                          ) : (
                            speseList.map((item) => (
                              <tr key={item.id}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm border-0"
                                    placeholder="es. Musicista, DJ, Service audio..."
                                    value={item.descrizione}
                                    onChange={(e) => handleUpdateSpesaRow(item.id, "descrizione", e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm border-0 text-end fw-bold text-danger"
                                    value={item.importo}
                                    onChange={(e) => handleUpdateSpesaRow(item.id, "importo", e.target.value)}
                                  />
                                </td>
                                <td className="text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSpesaRow(item.id)}
                                    className="btn btn-sm text-danger"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SEZIONE 3: CONTRATTO PDF (CRUD ISTANTANEO) */}
                  <h6 className="fw-bold text-secondary mb-3 text-uppercase small border-bottom pb-2">
                    3. Contratto Cliente PDF (CRUD Istantaneo)
                  </h6>
                  <div className="mb-4">
                    {editingEvent?.contrattoUrl ? (
                      <div className="pdf-badge-card">
                        <div className="d-flex align-items-center gap-3">
                          <i className="bi bi-file-earmark-pdf-fill text-danger display-6"></i>
                          <div>
                            <div className="fw-bold text-dark">{editingEvent.contrattoNomeFile || "Contratto_Cliente.pdf"}</div>
                            <small className="text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i> Contratto Persistente Caricato</small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <a
                            href={editingEvent.contrattoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-success rounded-pill px-3"
                          >
                            <i className="bi bi-eye me-1"></i> Apri PDF
                          </a>
                          <button
                            type="button"
                            onClick={handleDeleteContract}
                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                          >
                            <i className="bi bi-trash me-1"></i> Elimina
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pdf-upload-dropzone">
                        <i className="bi bi-cloud-arrow-up-fill text-success display-6 mb-2 d-block"></i>
                        <div className="fw-bold text-dark mb-1">Upload Contratto PDF</div>
                        <small className="text-muted d-block mb-3">Seleziona il contratto siglato in formato .pdf</small>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleUploadContract}
                          disabled={uploadingPdf || !editingEvent?.id}
                          className="form-control form-control-sm w-auto mx-auto"
                        />
                        {uploadingPdf && <small className="text-success d-block mt-2 fw-bold">Caricamento su Cloudinary in corso...</small>}
                        {!editingEvent?.id && (
                          <small className="text-warning d-block mt-2 font-monospace">Salva prima l'evento per poter aggiungere il PDF.</small>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SEZIONE 4: NOTE LIBERE */}
                  <h6 className="fw-bold text-secondary mb-3 text-uppercase small border-bottom pb-2">
                    4. Note & Annotazioni Interne
                  </h6>
                  <div>
                    <textarea
                      rows="3"
                      className="form-control rounded-3"
                      placeholder="Annotazioni particolari, orari della scaletta, accordi specifici..."
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      className="btn btn-outline-danger rounded-pill me-auto"
                    >
                      <i className="bi bi-trash me-1"></i> Elimina Evento
                    </button>
                  )}
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">
                    <i className="bi bi-check-lg me-1"></i> Salva Evento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
