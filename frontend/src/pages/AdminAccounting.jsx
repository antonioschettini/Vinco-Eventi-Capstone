import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import API_BASE_URL from "../config/api";
import { authApiFetch } from "../utils/apiClient";
import { setGlobalError, setTaxSettings } from "../redux/slices/uiSlice";
import { handleEmailClick, handlePhoneClick } from "../utils/contactHelpers";
import AdminConfirmModal from "../components/Admin/AdminConfirmModal";
import AdminSubnav from "../components/Admin/AdminSubnav";
import "./AdminAccounting.css";

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// Helper blindato per parsificare numeri in formato italiano (es. 2.500,50 oppure 2500,50 o 2500.50)
const parseItalianNumber = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  let str = val.toString().trim();
  if (str.includes(",") && str.includes(".")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

export default function AdminAccounting() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const taxSettings = useSelector((state) => state.ui.taxSettings) || {
    taxMode: "percent",
    taxPercent: "20",
    taxManualAmount: "0"
  };

  const taxMode = taxSettings.taxMode;
  const taxPercent = taxSettings.taxPercent;
  const taxManualAmount = taxSettings.taxManualAmount;

  const setTaxMode = (mode) => {
    dispatch(setTaxSettings({ taxMode: mode }));
  };

  const setTaxPercent = (percent) => {
    dispatch(setTaxSettings({ taxPercent: percent }));
  };

  const setTaxManualAmount = (amount) => {
    dispatch(setTaxSettings({ taxManualAmount: amount }));
  };

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12, 0 = tutti
  const [viewMode, setViewMode] = useState("calendar"); // Default a "calendar" (Vista Calendario Mese Corrente)
  const [isMobileView, setIsMobileView] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Gestione dinamica degli anni nel dropdown
  const baseYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const [customYears, setCustomYears] = useState([]);

  const availableYears = Array.from(
    new Set([...baseYears, ...customYears, currentYear, new Date().getFullYear()])
  ).sort((a, b) => a - b);

  // Gesture Swipe Mobile per scorrere i mesi nel calendario come un'app nativa
  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    // Swipe a sinistra (mese successivo)
    if (diffX > 50) {
      setSelectedMonth((prev) => (prev >= 12 ? 1 : prev === 0 ? 1 : prev + 1));
    }
    // Swipe a destra (mese precedente)
    else if (diffX < -50) {
      setSelectedMonth((prev) => (prev <= 1 ? 12 : prev - 1));
    }
    setTouchStartX(null);
  };

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Paginazione per la vista Registro Contabile (10 eventi per pagina)
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 10;

  // Report Finanziario Annuale (1 Gennaio - 31 Dicembre dell'anno selezionato)
  const [annualReport, setAnnualReport] = useState({
    totaleLordo: 0,
    totaleSpese: 0,
    totaleNetto: 0,
    stimaTasse: 0,
    nettoPostTasse: 0,
    numeroEventi: 0
  });

  // Report Finanziario Mensile (per il mese selezionato)
  const [monthlyReport, setMonthlyReport] = useState({
    totaleLordo: 0,
    totaleSpese: 0,
    totaleNetto: 0,
    stimaTasse: 0,
    nettoPostTasse: 0,
    numeroEventi: 0
  });

  // Reset pagina al cambio filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, currentYear, viewMode]);

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
    dataFineEvento: "",
    hasDjSet: false,
    location: "",
    tipoEvento: "Matrimonio",
    importoLordo: "",
    totaleSpese: 0,
    tasseStimate: 0,
    note: "",
    isManual: true
  });

  // Lista spese collaboratori/fornitori per l'evento correntemente aperto
  const [speseList, setSpeseList] = useState([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [openingPdfId, setOpeningPdfId] = useState(null);
  const [inlinePdfModal, setInlinePdfModal] = useState({
    open: false,
    url: null,
    title: "",
    eventId: null,
  });
  const fileInputRef = useRef(null);

  // Previene l'apertura automatica del browser se un file viene trascinato ovunque nella finestra
  useEffect(() => {
    const preventDefaultDrag = (e) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventDefaultDrag);
    window.addEventListener("drop", preventDefaultDrag);
    return () => {
      window.removeEventListener("dragover", preventDefaultDrag);
      window.removeEventListener("drop", preventDefaultDrag);
    };
  }, []);

  // Stato per il Modale Riepilogo Eventi del Giorno
  const [dayEventsModal, setDayEventsModal] = useState({
    isOpen: false,
    dateStr: "",
    events: [],
  });

  const handleDayClick = (dateStr, dayEvents) => {
    if (dayEvents && dayEvents.length > 0) {
      setDayEventsModal({
        isOpen: true,
        dateStr,
        events: dayEvents,
      });
    } else {
      handleOpenNewModal(dateStr);
    }
  };

  // Stato per il Modale Custom di Conferma Admin
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Conferma",
    variant: "danger",
    icon: "bi-trash-fill",
    onConfirm: null,
  });

  const closeConfirmModal = () => {
    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchEventsAndReport = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      let urlEvents = `${API_BASE_URL}/api/admin/agenda?year=${currentYear}`;
      if (selectedMonth !== 0) {
        urlEvents += `&month=${selectedMonth}`;
      }

      const urlAnnualReport = `${API_BASE_URL}/api/admin/agenda/report?year=${currentYear}`;
      const promises = [
        authApiFetch(urlEvents, {}, token, dispatch),
        authApiFetch(urlAnnualReport, {}, token, dispatch)
      ];

      if (selectedMonth !== 0) {
        const urlMonthlyReport = `${API_BASE_URL}/api/admin/agenda/report?year=${currentYear}&month=${selectedMonth}`;
        promises.push(authApiFetch(urlMonthlyReport, {}, token, dispatch));
      }

      const results = await Promise.all(promises);

      setEvents(results[0] || []);
      const annualData = results[1] || {
        totaleLordo: 0,
        totaleSpese: 0,
        totaleNetto: 0,
        stimaTasse: 0,
        nettoPostTasse: 0,
        numeroEventi: 0
      };
      setAnnualReport(annualData);

      if (selectedMonth !== 0 && results[2]) {
        setMonthlyReport(results[2]);
      } else {
        setMonthlyReport(annualData);
      }
    } catch (err) {
      dispatch(setGlobalError({ message: err.message || "Impossibile caricare i dati dell'agenda", type: "danger" }));
    } finally {
      setLoading(false);
    }
  }, [currentYear, selectedMonth, token, dispatch]);

  useEffect(() => {
    fetchEventsAndReport();
  }, [fetchEventsAndReport]);

  // Apertura modale per NUOVO evento (anche date nel passato)
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
      dataFineEvento: formattedDate,
      hasDjSet: false,
      location: "",
      tipoEvento: "Matrimonio",
      importoLordo: "",
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
      dataFineEvento: ev.dataFineEvento || ev.dataEvento || "",
      hasDjSet: ev.hasDjSet !== undefined ? ev.hasDjSet : true,
      location: ev.location || "",
      tipoEvento: ev.tipoEvento || "Matrimonio",
      importoLordo: ev.importoLordo || "",
      totaleSpese: ev.totaleSpese || 0,
      tasseStimate: ev.tasseStimate || 0,
      note: ev.note || "",
      isManual: ev.isManual
    });

    try {
      const parsed = ev.speseJson ? JSON.parse(ev.speseJson) : [];
      setSpeseList(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSpeseList([]);
    }

    setShowModal(true);
  };

  // Aggiungi una riga spesa collaboratore
  const handleAddSpesaRow = () => {
    setSpeseList([
      ...speseList,
      { id: Date.now().toString(), descrizione: "", importo: "" }
    ]);
  };

  // Modifica riga spesa collaboratore
  const handleUpdateSpesaRow = (id, field, value) => {
    const updated = speseList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: value
        };
      }
      return item;
    });
    setSpeseList(updated);

    const sumSpese = updated.reduce((acc, curr) => acc + parseItalianNumber(curr.importo), 0);
    setFormData((prev) => ({ ...prev, totaleSpese: sumSpese }));
  };

  // Rimuovi riga spesa collaboratore
  const handleRemoveSpesaRow = (id) => {
    const updated = speseList.filter((item) => item.id !== id);
    setSpeseList(updated);
    const sumSpese = updated.reduce((acc, curr) => acc + parseItalianNumber(curr.importo), 0);
    setFormData((prev) => ({ ...prev, totaleSpese: sumSpese }));
  };

  // Salva evento (POST o PUT)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const sumSpese = speseList.reduce((acc, curr) => acc + parseItalianNumber(curr.importo), 0);
      const parsedLordo = parseItalianNumber(formData.importoLordo);
      const startDate = formData.dataEvento;
      const endDate = formData.dataFineEvento && formData.dataFineEvento >= startDate ? formData.dataFineEvento : startDate;

      const payload = {
        ...formData,
        importoLordo: parsedLordo,
        totaleSpese: sumSpese,
        speseJson: JSON.stringify(speseList.map(item => ({ ...item, importo: parseItalianNumber(item.importo) }))),
        tasseStimate: parseItalianNumber(formData.tasseStimate),
        dataEvento: startDate,
        dataFineEvento: endDate
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

  // Esecuzione eliminazione evento dopo conferma modale
  const executeDeleteEvent = async (eventId) => {
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

  const handleDeleteEvent = (eventId) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Elimina Evento Contabile",
      message: "Sei sicuro di voler eliminare questo evento dall'Agenda Contabile? L'azione non può essere annullata.",
      confirmText: "Elimina Evento",
      variant: "danger",
      icon: "bi-trash-fill",
      onConfirm: () => {
        closeConfirmModal();
        executeDeleteEvent(eventId);
      },
    });
  };

  // Esportazione Bilancio ed Eventi in formato CSV compatibile Excel Italiano (UTF-8 con BOM)
  const handleExportCsv = () => {
    if (!events || events.length === 0) {
      dispatch(
        setGlobalError({
          message: "Nessun evento contabile presente per il periodo selezionato da esportare.",
          type: "info",
        })
      );
      return;
    }

    const headers = [
      "ID Evento",
      "Titolo Evento",
      "Data Inizio",
      "Data Fine",
      "Nome Cliente",
      "Cognome Cliente",
      "Email Cliente",
      "Telefono Cliente",
      "Location",
      "Tipo Evento",
      "Importo Lordo (€)",
      "Totale Spese (€)",
      "Totale Netto (€)",
      "Dettaglio Spese Fornitori",
      "Presenza DJ Set Admin",
      "Nome File Contratto",
      "Note / Dettagli"
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = events.map((ev) => {
      let speseStr = "";
      try {
        if (ev.speseJson) {
          const parsed = typeof ev.speseJson === "string" ? JSON.parse(ev.speseJson) : ev.speseJson;
          if (Array.isArray(parsed)) {
            speseStr = parsed.map((s) => `${s.descrizione || "Spesa"}: €${(s.importo || 0)}`).join(" | ");
          }
        }
      } catch (_) {
        speseStr = "";
      }

      return [
        escapeCsv(ev.id || ""),
        escapeCsv(ev.titolo || ""),
        escapeCsv(ev.dataEvento || ""),
        escapeCsv(ev.dataFineEvento || ev.dataEvento || ""),
        escapeCsv(ev.clienteNome || ""),
        escapeCsv(ev.clienteCognome || ""),
        escapeCsv(ev.clienteEmail || ""),
        escapeCsv(ev.clienteTelefono || ""),
        escapeCsv(ev.location || ""),
        escapeCsv(ev.tipoEvento || ""),
        escapeCsv(Number(ev.importoLordo || 0).toFixed(2).replace(".", ",")),
        escapeCsv(Number(ev.totaleSpese || 0).toFixed(2).replace(".", ",")),
        escapeCsv(Number(ev.totaleNetto || 0).toFixed(2).replace(".", ",")),
        escapeCsv(speseStr),
        escapeCsv(ev.hasDjSet ? "Sì (Enzo Colaluca)" : "No"),
        escapeCsv(ev.contrattoNomeFile || "Nessun Contratto"),
        escapeCsv(ev.note || "")
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const periodLabel = selectedMonth === 0 ? `Anno_${currentYear}` : `Mese_${selectedMonth}_${currentYear}`;
    link.setAttribute("href", url);
    link.setAttribute("download", `VincoEventi_Bilancio_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    dispatch(
      setGlobalError({
        message: `Report contabile (${periodLabel}) esportato con successo in formato Excel/CSV!`,
        type: "success",
      })
    );
  };

  // Apertura e visualizzazione garantita del Contratto PDF tramite Modal Viewer integrato
  const handleOpenContractPdf = async (ev) => {
    if (!ev || !ev.id) return;
    setOpeningPdfId(ev.id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/agenda/${ev.id}/contratto`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let errMsg = "Impossibile recuperare il file PDF del contratto.";
        try {
          const errJson = await res.json();
          if (errJson && errJson.message) errMsg = errJson.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      setInlinePdfModal({
        open: true,
        url: blobUrl,
        title: ev.contrattoNomeFile || "Contratto_Cliente.pdf",
        eventId: ev.id,
      });
    } catch (err) {
      dispatch(
        setGlobalError({
          message: err.message || "Errore durante l'apertura del contratto PDF",
          type: "danger",
        })
      );
    } finally {
      setOpeningPdfId(null);
    }
  };

  // Elaborazione e Upload Contratto PDF (usato sia da file picker che da drag & drop)
  const handleProcessContractFile = async (file) => {
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      dispatch(
        setGlobalError({
          message: "Formato non supportato: il file selezionato deve essere un documento PDF (.pdf).",
          type: "warning",
        })
      );
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      dispatch(
        setGlobalError({
          message: "Il file PDF è troppo grande. La dimensione massima consentita è 30 MB.",
          type: "warning",
        })
      );
      return;
    }

    if (!editingEvent?.id) {
      setConfirmModalConfig({
        isOpen: true,
        title: "Salvataggio Evento Richiesto",
        message: "Devi prima salvare l'evento per poter allegare il relativo contratto PDF.",
        confirmText: "Ho Capito",
        variant: "info",
        icon: "bi-info-circle-fill",
        onConfirm: () => closeConfirmModal(),
      });
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
          body: bodyData,
        },
        token,
        dispatch
      );

      setEditingEvent(updatedEvent);
      fetchEventsAndReport();
      dispatch(
        setGlobalError({
          message: "Contratto PDF caricato con successo!",
          type: "success",
        })
      );
    } catch (err) {
      dispatch(
        setGlobalError({
          message: err.message || "Errore durante l'upload del contratto PDF",
          type: "danger",
        })
      );
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingEvent?.id && !uploadingPdf) {
      setIsDraggingPdf(true);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingEvent?.id && !uploadingPdf) {
      setIsDraggingPdf(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPdf(false);

    if (!editingEvent?.id) {
      setConfirmModalConfig({
        isOpen: true,
        title: "Salvataggio Evento Richiesto",
        message: "Devi prima salvare l'evento per poter allegare il relativo contratto PDF.",
        confirmText: "Ho Capito",
        variant: "info",
        icon: "bi-info-circle-fill",
        onConfirm: () => closeConfirmModal(),
      });
      return;
    }

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessContractFile(file);
    }
  };

  // Esecuzione rimozione contratto PDF dopo conferma modale
  const executeDeleteContract = async () => {
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

  const handleDeleteContract = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Rimuovi Contratto PDF",
      message: "Sei sicuro di voler rimuovere il contratto PDF allegato a questo evento?",
      confirmText: "Rimuovi PDF",
      variant: "warning",
      icon: "bi-file-earmark-x-fill",
      onConfirm: () => {
        closeConfirmModal();
        executeDeleteContract();
      },
    });
  };

  // Costruzione griglia calendario mensile con supporto ad eventi multi-giorno
  const renderCalendarDays = () => {
    const monthIndex = selectedMonth === 0 ? 0 : selectedMonth - 1;
    const firstDayOfMonth = new Date(currentYear, monthIndex, 1);
    const lastDayOfMonth = new Date(currentYear, monthIndex + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const cells = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(
        <div key={`empty-${i}`} className="calendar-day-cell other-month"></div>
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      
      // Supporto eventi multi-giorno: dataEvento <= dateStr <= dataFineEvento
      const dayEvents = events.filter((ev) => {
        const start = ev.dataEvento;
        const end = ev.dataFineEvento || ev.dataEvento;
        return start <= dateStr && dateStr <= end;
      });

      const isToday = dateStr === todayStr;
      // Su mobile (<768px), con 2+ eventi mostriamo 1 chip + badge "+ N altri" per garantire 0 deformazioni nella griglia da 72px.
      // Su desktop (>=768px), con 3+ eventi mostriamo 2 chip + badge "+ N altri" nella griglia da 115px.
      const MAX_VISIBLE_EVENTS = isMobileView
        ? (dayEvents.length > 1 ? 1 : 1)
        : (dayEvents.length > 2 ? 2 : 2);
      const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
      const overflowCount = dayEvents.length - MAX_VISIBLE_EVENTS;

      cells.push(
        <div
          key={`day-${day}`}
          className={`calendar-day-cell ${isToday ? "today" : ""}`}
          onClick={() => handleDayClick(dateStr, dayEvents)}
        >
          <div className="day-number">
            <span className="d-inline-flex align-items-center gap-1">
              <span>{day}</span>
              {dayEvents.length > (isMobileView ? 1 : 2) && (
                <span
                  className="badge bg-success bg-opacity-10 text-success px-1 py-0 font-monospace border border-success border-opacity-25"
                  style={{ fontSize: "0.62rem", lineHeight: 1.1 }}
                  title={`${dayEvents.length} eventi in questo giorno`}
                >
                  {dayEvents.length}<span className="d-none d-sm-inline ms-1">ev</span>
                </span>
              )}
            </span>
            <i className="bi bi-plus-circle-fill add-event-plus" title="Aggiungi evento" onClick={(e) => { e.stopPropagation(); handleOpenNewModal(dateStr); }}></i>
          </div>
          <div className="events-wrapper">
            {visibleEvents.map((ev) => {
              const isMultiDay = ev.dataFineEvento && ev.dataFineEvento !== ev.dataEvento;
              const displayName = ev.clienteCognome ? `${ev.clienteCognome}` : ev.titolo;
              const displayLoc = ev.location || ev.tipoEvento || "";

              return (
                <div
                  key={`${ev.id}-${dateStr}`}
                  className={`event-chip ${ev.isManual ? "manual-event" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayClick(dateStr, dayEvents);
                  }}
                  title={`${ev.titolo} - Client: ${ev.clienteNome || ""} ${ev.clienteCognome || ""} - Location: ${ev.location || ""} - Lordo: €${ev.importoLordo}`}
                >
                  <div className="event-chip-header">
                    <span className="event-chip-title text-truncate">
                      {displayName}
                    </span>
                    <div className="event-chip-icons">
                      {/* Badge DJ Set Enzo (Console DJ Icona) */}
                      {ev.hasDjSet && (
                        <i className="bi bi-disc-fill dj-badge-icon" title="Presenza DJ Set Enzo (Admin DJ)"></i>
                      )}
                      
                      {/* Badge Stato Contratto PDF */}
                      {ev.contrattoUrl ? (
                        <i className="bi bi-check-circle-fill contract-badge-icon ok" title="Contratto allegato"></i>
                      ) : (
                        <i className="bi bi-exclamation-triangle-fill contract-badge-icon missing" title="Contratto mancante!"></i>
                      )}
                    </div>
                  </div>

                  <div className="event-chip-sub">
                    <span className="event-chip-location text-truncate">
                      {displayLoc}
                    </span>
                    {isMultiDay && <span className="multi-day-badge">2 GG</span>}
                  </div>
                </div>
              );
            })}
            
            {/* Badge interattivo + N Altri se presenti eventi in overflow */}
            {overflowCount > 0 && (
              <div
                className="more-events-chip"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayClick(dateStr, dayEvents);
                }}
                title={`Vedi tutti i ${dayEvents.length} eventi di questo giorno`}
              >
                + {overflowCount} altri
              </div>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Calcoli finanziari annuali (1 Gennaio - 31 Dicembre currentYear)
  const lordoTotAnno = annualReport?.totaleLordo || 0;
  const speseTotAnno = annualReport?.totaleSpese || 0;
  const nettoOpAnno = lordoTotAnno - speseTotAnno;

  let tasseCalcolateAnno;
  if (taxMode === "percent") {
    tasseCalcolateAnno = (nettoOpAnno * parseItalianNumber(taxPercent)) / 100;
  } else {
    tasseCalcolateAnno = parseItalianNumber(taxManualAmount);
  }

  const nettoPostTasseAnno = nettoOpAnno - tasseCalcolateAnno;

  // Calcoli finanziari mensili
  const lordoTotMese = monthlyReport?.totaleLordo || 0;
  const speseTotMese = monthlyReport?.totaleSpese || 0;
  const nettoOpMese = lordoTotMese - speseTotMese;

  // Paginazione Registro Contabile
  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [events.length, totalPages, currentPage]);

  const displayedEvents = events.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  return (
    <div className="admin-accounting-page container">
      {/* Intestazione Dashboard & Navigazione Tab */}
      <div className="mb-4">
        <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2 rounded-pill mb-2">
          VINCO EVENTI • AREA GESTIONALE
        </span>
        <h1 className="h2 fw-bold mb-0">Agenda Contabile & Eventi</h1>
      </div>

      {/* Sub-Navigazione per passare tra Preventivi, Agenda ed Audit */}
      <AdminSubnav activeTab="agenda" />

      {/* Barra Filtri: Anno, Mesi (Swipeable su Touch), Pulsante Nuovo Evento */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <label className="fw-bold text-secondary me-1 small">Anno:</label>
              <select
                className="form-select form-select-sm rounded-pill font-monospace"
                style={{ width: "135px" }}
                value={currentYear}
                onChange={(e) => {
                  if (e.target.value === "ADD_NEW") {
                    const inputYear = prompt("Inserisci l'anno da aggiungere all'Agenda (es. 2029, 2030):");
                    if (inputYear) {
                      const parsedY = parseInt(inputYear.trim(), 10);
                      if (!isNaN(parsedY) && parsedY >= 2020 && parsedY <= 2050) {
                        setCustomYears((prev) => [...prev, parsedY]);
                        setCurrentYear(parsedY);
                      } else {
                        alert("Anno non valido. Inserisci un anno compreso tra 2020 e 2050.");
                      }
                    }
                  } else {
                    setCurrentYear(parseInt(e.target.value, 10));
                  }
                }}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
                <option value="ADD_NEW">+ Nuovo Anno...</option>
              </select>
            </div>

            {/* Nastro Pillole Mesi Scorrevole Touch */}
            <div className="month-pills-scroll flex-grow-1 mx-md-2">
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

            {/* Toggle Vista, Esporta Excel e Nuovo Evento */}
            <div className="d-flex flex-wrap align-items-center gap-2">
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
                  title="Visualizza la lista completa in formato Registro Contabile"
                >
                  <i className="bi bi-journal-text me-1"></i> Registro Contabile
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                title="Esporta bilancio ed eventi in formato Excel / CSV compatibile con commercialista"
              >
                <i className="bi bi-file-earmark-excel-fill text-success"></i>
                <span>Esporta Excel</span>
              </button>

              <button
                onClick={() => handleOpenNewModal()}
                className="btn btn-success btn-sm rounded-pill px-3 fw-bold shadow-sm"
              >
                <i className="bi bi-plus-lg me-1"></i> Nuovo Evento
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Report Finanziario Generale ANNUALE */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="financial-kpi-card kpi-lordo">
            <div className="financial-kpi-icon">
              <i className="bi bi-cash-stack"></i>
            </div>
            <div>
              <span className="text-secondary small fw-bold text-uppercase d-block">Totale Lordo</span>
              <span className="h4 fw-bold mb-0">€ {lordoTotAnno.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
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
              <span className="h4 fw-bold mb-0 text-danger">- € {speseTotAnno.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
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
              <span className="h4 fw-bold mb-0 text-primary">€ {nettoOpAnno.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Card Netto Post-Tasse Anno intuitiva con supporto virgola e modalità % vs € */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="financial-kpi-card kpi-tasse">
            <div className="financial-kpi-icon">
              <i className="bi bi-piggy-bank"></i>
            </div>
            <div className="w-100 overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase me-1">Netto Post-Tasse</span>
                
                {/* Switcher Modalità Tasse % vs € */}
                <div className="btn-group btn-group-xs flex-shrink-0">
                  <button
                    type="button"
                    className={`btn ${taxMode === "percent" ? "btn-warning text-dark font-monospace" : "btn-outline-secondary font-monospace"}`}
                    onClick={() => setTaxMode("percent")}
                    title="Calcola in Percentuale %"
                  >
                    %
                  </button>
                  <button
                    type="button"
                    className={`btn ${taxMode === "manual" ? "btn-warning text-dark font-monospace" : "btn-outline-secondary font-monospace"}`}
                    onClick={() => setTaxMode("manual")}
                    title="Imposta Cifra Fissa in €"
                  >
                    €
                  </button>
                </div>
              </div>

              <div className="h4 fw-bold mb-1 text-success text-truncate">
                € {nettoPostTasseAnno.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
              </div>

              <div className="d-flex align-items-center gap-1">
                {taxMode === "percent" ? (
                  <div className="d-flex align-items-center gap-1 w-100">
                    <span className="text-muted small">Aliquota:</span>
                    <div className="input-group input-group-sm" style={{ maxWidth: "110px" }}>
                      <input
                        type="text"
                        className="form-control form-control-sm text-end font-monospace fw-bold px-2 py-0"
                        value={taxPercent}
                        placeholder="20"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setTaxPercent(e.target.value)}
                      />
                      <span className="input-group-text px-1 py-0 font-monospace">%</span>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-1 w-100">
                    <span className="text-muted small">Tasse:</span>
                    <div className="input-group input-group-sm" style={{ maxWidth: "135px" }}>
                      <span className="input-group-text px-1 py-0 font-monospace">€</span>
                      <input
                        type="text"
                        className="form-control form-control-sm text-end font-monospace fw-bold px-2 py-0"
                        value={taxManualAmount}
                        placeholder="0,00"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setTaxManualAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VISTA CALENDARIO CON GESTURE SWIPE MOBILE */}
      {viewMode === "calendar" && (
        <div className="calendar-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h5 className="fw-bold mb-0 text-success d-flex align-items-center">
                <i className="bi bi-calendar-event me-2"></i>
                {selectedMonth === 0 ? `Panoramica Annuale ${currentYear}` : `${MONTH_NAMES[selectedMonth - 1]} ${currentYear}`}
              </h5>
              
              {/* Riepilogo Finanziario Mensile Responsive con Micro-Chips Flex */}
              {selectedMonth !== 0 && (
                <div className="month-summary-chips d-flex flex-wrap align-items-center gap-1 my-1">
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill font-monospace small">
                    Lordo €{lordoTotMese.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill font-monospace small">
                    Spese -€{speseTotMese.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill font-monospace small fw-bold">
                    Netto €{nettoOpMese.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <span className="badge bg-secondary bg-opacity-10 text-secondary align-self-start align-self-md-auto">
              {events.length} eventi registrati {selectedMonth === 0 ? "in tutto l'anno" : "in questo mese"}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5 text-success">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              <span>Caricamento eventi in corso...</span>
            </div>
          ) : selectedMonth === 0 ? (
            <div className="my-2">
              <div className="alert alert-success bg-success bg-opacity-10 border-0 rounded-4 p-3 mb-4 d-flex align-items-center gap-3">
                <i className="bi bi-info-circle-fill text-success fs-3"></i>
                <div>
                  <h6 className="fw-bold text-success mb-1">Panoramica 12 Mesi - Anno {currentYear}</h6>
                  <small className="text-secondary">
                    Fai click su una scheda mensile per aprire la griglia dettagliata del mese oppure clicca su <strong>Registro Contabile</strong> in alto per la tabella generale.
                  </small>
                </div>
              </div>

              <div className="row g-3">
                {MONTH_NAMES.map((mName, idx) => {
                  const mNum = idx + 1;
                  const mEvents = events.filter((ev) => {
                    if (!ev.dataEvento) return false;
                    const parts = ev.dataEvento.split("-");
                    return parseInt(parts[0]) === currentYear && parseInt(parts[1]) === mNum;
                  });

                  const mLordo = mEvents.reduce((acc, curr) => acc + (curr.importoLordo || 0), 0);
                  const mSpese = mEvents.reduce((acc, curr) => acc + (curr.totaleSpese || 0), 0);
                  const mNetto = mLordo - mSpese;

                  return (
                    <div key={mName} className="col-12 col-sm-6 col-md-4 col-lg-3">
                      <div
                        className="month-overview-card p-3"
                        onClick={() => setSelectedMonth(mNum)}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-success">{mName}</span>
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill font-monospace">
                            {mEvents.length} {mEvents.length === 1 ? "evento" : "eventi"}
                          </span>
                        </div>
                        <div className="small text-muted mb-1">
                          Lordo: <strong className="text-body fw-bold">€ {mLordo.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="small text-muted mb-3">
                          Netto: <strong className="text-primary">€ {mNetto.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <button className="btn btn-sm btn-outline-success w-100 rounded-pill font-monospace" style={{ fontSize: "0.78rem" }}>
                          <i className="bi bi-calendar-week me-1"></i> Apri Mese
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="calendar-weekdays">
                {WEEKDAY_NAMES.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="calendar-days-grid">{renderCalendarDays()}</div>

              {/* LISTA EVENTI DEL MESE TOUCH-FRIENDLY */}
              {events.length > 0 && (
                <div className="mobile-events-section mt-4 pt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-success mb-0 d-flex align-items-center">
                      <i className="bi bi-list-stars me-2"></i> Eventi del Mese ({events.length})
                    </h6>
                    <small className="text-muted" style={{ fontSize: "0.75rem" }}>Tocca per modificare</small>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {events.map((ev) => (
                      <div
                        key={`mobile-list-${ev.id}`}
                        className="card border-0 shadow-sm rounded-3 p-3 cursor-pointer mobile-event-card"
                        onClick={() => handleOpenEditModal(ev)}
                      >
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-2">
                          <div className="d-flex flex-wrap align-items-center gap-1 min-w-0">
                            <span className="badge bg-success bg-opacity-10 text-success fw-bold font-monospace">
                              <i className="bi bi-calendar-event me-1"></i>
                              {ev.dataEvento} {ev.dataFineEvento && ev.dataFineEvento !== ev.dataEvento ? `➔ ${ev.dataFineEvento}` : ""}
                            </span>
                            {ev.hasDjSet && (
                              <span className="badge bg-warning text-dark font-monospace">
                                <i className="bi bi-disc-fill me-1"></i> DJ Set Enzo
                              </span>
                            )}
                          </div>
                          {ev.contrattoUrl ? (
                            <span className="badge bg-success text-white px-2 py-1">
                              <i className="bi bi-check-circle-fill me-1"></i> PDF Ok
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i> PDF Mancante
                            </span>
                          )}
                        </div>
                        <div className="mb-2">
                          <h6 className="fw-bold mb-0 text-body">{ev.titolo}</h6>
                          <small className="text-muted d-block">
                            {ev.clienteNome} {ev.clienteCognome} {ev.location && `• ${ev.location}`}
                          </small>
                        </div>

                        <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 border-top gap-2">
                          <div className="d-flex align-items-center gap-3">
                            <small className="text-body-secondary">Lordo: <strong className="text-body fw-bold">€{parseItalianNumber(ev.importoLordo).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></small>
                            <small className="text-muted">Netto: <strong className="text-primary">€{ev.totaleNetto?.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</strong></small>
                          </div>
                          <button className="btn btn-sm btn-outline-success rounded-pill px-3 py-0 font-monospace" style={{ fontSize: "0.75rem" }}>
                            Modifica <i className="bi bi-chevron-right ms-1"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VISTA REGISTRO CONTABILE */}
      {viewMode === "table" && (
        <div className="excel-table-card">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-body-tertiary">
            <h6 className="fw-bold text-secondary mb-0">
              <i className="bi bi-journal-text me-2"></i>
              {selectedMonth === 0 ? `Elenco Completo Anno ${currentYear}` : `Elenco Eventi ${MONTH_NAMES[selectedMonth - 1]} ${currentYear}`}
            </h6>
            {selectedMonth !== 0 ? (
              <span className="badge bg-success bg-opacity-10 text-success font-monospace">
                Netto Mese: € {nettoOpMese.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="badge bg-success bg-opacity-10 text-success font-monospace">
                Netto Anno: € {nettoOpAnno.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* VISTA TABELLA DESKTOP */}
          <div className="table-responsive d-none d-md-block">
            <table className="table excel-table align-middle">
              <thead>
                <tr>
                  <th>Data Evento</th>
                  <th>Titolo Evento / Cliente</th>
                  <th>Tipo / Location</th>
                  <th className="text-center">Presenza DJ</th>
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
                    <td colSpan="9" className="text-center py-4 text-muted">
                      Caricamento in corso...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      Nessun evento registrato per il periodo selezionato.
                    </td>
                  </tr>
                ) : (
                  displayedEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td className="fw-bold font-monospace text-success">
                        {ev.dataEvento}
                        {ev.dataFineEvento && ev.dataFineEvento !== ev.dataEvento && (
                          <span className="d-block text-muted small font-monospace">➔ {ev.dataFineEvento}</span>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold">{ev.titolo}</div>
                        {ev.clienteNome && (
                          <small className="text-muted d-block">
                            {ev.clienteNome} {ev.clienteCognome} {ev.clienteTelefono && `• ${ev.clienteTelefono}`}
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-body-secondary text-body me-1">{ev.tipoEvento || "Evento"}</span>
                        <small className="text-muted">{ev.location}</small>
                      </td>
                      <td className="text-center">
                        {ev.hasDjSet ? (
                          <span className="badge bg-warning text-dark font-monospace px-2 py-1" title="Presenza DJ Set Admin (Enzo)">
                            <i className="bi bi-disc-fill me-1"></i> DJ Enzo
                          </span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                      <td className="text-end fw-bold text-body font-monospace">
                        € {parseItalianNumber(ev.importoLordo).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-danger fw-semibold font-monospace">
                        -€ {parseItalianNumber(ev.totaleSpese).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-success fw-bold font-monospace">
                        € {parseItalianNumber(ev.totaleNetto).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        {ev.contrattoUrl ? (
                          <button
                            type="button"
                            onClick={() => handleOpenContractPdf(ev)}
                            disabled={openingPdfId === ev.id}
                            className="badge bg-success text-white border-0 px-2 py-1 text-decoration-none d-inline-flex align-items-center gap-1 shadow-sm"
                            title="Apri il contratto PDF"
                            style={{ cursor: "pointer" }}
                          >
                            {openingPdfId === ev.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" style={{ width: "10px", height: "10px" }}></span>
                                <span>Apertura...</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-file-earmark-pdf-fill me-1"></i> Allegato
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                            <i className="bi bi-exclamation-triangle-fill me-1"></i> Mancante
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => handleOpenEditModal(ev)}
                          className="btn btn-sm btn-success rounded-pill px-3 py-1 fw-bold shadow-sm font-monospace d-inline-flex align-items-center gap-1"
                        >
                          <i className="bi bi-pencil-square"></i> Modifica
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* VISTA CARD MOBILE PER REGISTRO CONTABILE */}
          <div className="d-block d-md-none p-3">
            {loading ? (
              <div className="text-center py-4 text-muted">Caricamento in corso...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-4 text-muted">Nessun evento registrato.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {displayedEvents.map((ev) => (
                  <div
                    key={`mobile-reg-${ev.id}`}
                    className="card border-0 shadow-sm rounded-3 p-3 mobile-event-card cursor-pointer"
                    onClick={() => handleOpenEditModal(ev)}
                  >
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-2">
                      <div className="d-flex flex-wrap align-items-center gap-1 min-w-0">
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold font-monospace">
                          <i className="bi bi-calendar-event me-1"></i> {ev.dataEvento}
                          {ev.dataFineEvento && ev.dataFineEvento !== ev.dataEvento ? ` ➔ ${ev.dataFineEvento}` : ""}
                        </span>

                        {ev.hasDjSet && (
                          <span className="badge bg-warning text-dark font-monospace">
                            <i className="bi bi-disc-fill me-1"></i> DJ Enzo
                          </span>
                        )}
                      </div>
                      {ev.contrattoUrl ? (
                        <button
                          type="button"
                          disabled={openingPdfId === ev.id}
                          className="badge bg-success text-white px-2 py-1 text-decoration-none shadow-sm cursor-pointer d-inline-flex align-items-center gap-1 border-0"
                          title="Apri e visualizza il contratto PDF"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenContractPdf(ev);
                          }}
                        >
                          {openingPdfId === ev.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" style={{ width: "10px", height: "10px" }}></span>
                              <span>Apertura...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-file-earmark-pdf-fill"></i> Apri PDF
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(ev);
                          }}
                          className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 cursor-pointer text-decoration-none border-0 d-inline-flex align-items-center gap-1"
                          title="PDF Mancante! Clicca per caricare"
                        >
                          <i className="bi bi-exclamation-triangle-fill"></i> PDF Mancante
                        </button>
                      )}
                    </div>

                    <div className="mb-2">
                      <h6 className="fw-bold mb-0 text-body">{ev.titolo}</h6>
                      {ev.clienteNome && (
                        <small className="text-muted d-block">
                          {ev.clienteNome} {ev.clienteCognome} {ev.location && `• ${ev.location}`}
                        </small>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                      <div>
                        <small className="text-body-secondary d-block">Lordo: <strong className="text-body fw-bold">€{parseItalianNumber(ev.importoLordo).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></small>
                        <small className="text-danger d-block">Spese: -€{parseItalianNumber(ev.totaleSpese).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>
                        <small className="text-success fw-bold d-block">Netto: €{parseItalianNumber(ev.totaleNetto).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>
                      </div>
                      <button className="btn btn-sm btn-success rounded-pill px-3 py-1 font-monospace fw-bold shadow-sm">
                        Modifica <i className="bi bi-pencil-square ms-1"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONTROLLI PAGINAZIONE REGISTRO CONTABILE (10 Eventi per Pagina) */}
          {totalPages > 1 && (
            <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2 bg-light">
              <small className="text-muted font-monospace">
                Mostrati <strong>{((currentPage - 1) * EVENTS_PER_PAGE) + 1} - {Math.min(currentPage * EVENTS_PER_PAGE, events.length)}</strong> di <strong>{events.length}</strong> eventi
              </small>
              <div className="btn-group btn-group-sm">
                <button
                  className="btn btn-outline-secondary rounded-start-pill px-3"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <i className="bi bi-chevron-left me-1"></i> Precedente
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`btn ${currentPage === i + 1 ? "btn-success fw-bold" : "btn-outline-secondary"}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="btn btn-outline-secondary rounded-end-pill px-3"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Successivo <i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALE EDITOR EVENTO COMPLETO CON CAMPI SPLITTATI, EVENTI MULTI-GIORNO & SWITCH DJ SET */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: "90vh" }}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden d-flex flex-column" style={{ maxHeight: "88vh" }}>
              <div className="modal-header border-bottom flex-shrink-0 bg-body-tertiary px-4 py-3">
                <h5 className="modal-title fw-bold text-success mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-calculator fs-4"></i>
                  {editingEvent ? "Modifica Evento Contabile" : "Nuovo Evento in Agenda"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSaveEvent} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
                <div className="modal-body p-4 flex-grow-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "thin" }}>
                  
                  {/* BOX PARTECIPAZIONE DJ SET ADMIN (ENZO) */}
                  <div className="dj-switch-box mb-4">
                    <div className="form-check form-switch d-flex align-items-center justify-content-between p-0 mb-0">
                      <label className="form-check-label fw-bold text-body me-3 cursor-pointer d-flex align-items-center gap-2" htmlFor="hasDjSetSwitch">
                        <i className="bi bi-disc-fill text-warning fs-4"></i>
                        <div>
                          <div className="fs-6">Presenza DJ Set Admin (Enzo Colaluca)</div>
                          <small className="text-muted fw-normal">Attiva per mostrare il badge consolle DJ nel calendario e reminder operativo.</small>
                        </div>
                      </label>
                      <input
                        className="form-check-input fs-4 cursor-pointer m-0 flex-shrink-0"
                        type="checkbox"
                        role="switch"
                        id="hasDjSetSwitch"
                        checked={formData.hasDjSet}
                        onChange={(e) => setFormData({ ...formData, hasDjSet: e.target.checked })}
                      />
                    </div>
                  </div>

                  {/* SEZIONE 1: DATI EVENTO, DATE MULTI-GIORNO & CLIENTE */}
                  <h6 className="fw-bold text-secondary mb-3 text-uppercase small border-bottom pb-2">
                    1. Informazioni Evento, Date & Cliente
                  </h6>
                  <div className="row g-3 mb-4 align-items-end">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold d-block mb-1 text-truncate" title="Titolo Evento">
                        Titolo Evento *
                      </label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        required
                        placeholder="es. Matrimonio Rossi"
                        value={formData.titolo}
                        onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-sm-6 col-md-3">
                      <label className="form-label small fw-bold d-block mb-1 text-truncate" title="Data Inizio Evento">
                        Data Inizio Evento *
                      </label>
                      <input
                        type="date"
                        className="form-control rounded-3"
                        required
                        value={formData.dataEvento}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            dataEvento: newStart,
                            dataFineEvento: prev.dataFineEvento && prev.dataFineEvento >= newStart ? prev.dataFineEvento : newStart
                          }));
                        }}
                      />
                    </div>

                    <div className="col-12 col-sm-6 col-md-3">
                      <label className="form-label small fw-bold d-block mb-1 text-truncate" title="Data Fine Evento (Multi-Giorno)">
                        Data Fine Evento
                      </label>
                      <input
                        type="date"
                        className="form-control rounded-3"
                        value={formData.dataFineEvento}
                        min={formData.dataEvento}
                        onChange={(e) => setFormData({ ...formData, dataFineEvento: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Nome Cliente</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Marco"
                        value={formData.clienteNome}
                        onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                      />
                    </div>
                    
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Cognome Cliente (Mostrato in Cella)</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Rossi"
                        value={formData.clienteCognome}
                        onChange={(e) => setFormData({ ...formData, clienteCognome: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold">Email Cliente</label>
                      <input
                        type="email"
                        className="form-control rounded-3"
                        placeholder="es. cliente@email.it"
                        value={formData.clienteEmail}
                        onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
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
                      <label className="form-label small fw-bold">Location / Villa (Mostrata in Cella)</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Villa Rosa, Tenuta Colaluca"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Tipo Evento</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="es. Matrimonio, Pool Party"
                        value={formData.tipoEvento}
                        onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* SEZIONE 2: ECONOMIA & SPESE COLLABORATORI */}
                  <h6 className="fw-bold text-secondary mb-3 text-uppercase small border-bottom pb-2">
                    2. Contabilità, Prezzo & Spese Fornitori
                  </h6>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-success">Importo Lordo Concordato (€) *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-success bg-opacity-10 text-success fw-bold">€</span>
                        <input
                          type="text"
                          className="form-control form-control-lg fw-bold text-success font-monospace"
                          value={formData.importoLordo}
                          placeholder="0,00"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setFormData({ ...formData, importoLordo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center h-100">
                        <div>
                          <small className="text-uppercase fw-bold text-secondary d-block">Totale Netto Operativo</small>
                          <span className="h4 fw-bold text-primary mb-0">
                            € {(parseItalianNumber(formData.importoLordo) - (parseFloat(formData.totaleSpese) || 0)).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
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
                                    type="text"
                                    className="form-control form-control-sm border-0 text-end fw-bold text-danger font-monospace"
                                    value={item.importo}
                                    placeholder="0,00"
                                    onFocus={(e) => e.target.select()}
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
                      <div className="pdf-badge-card p-3">
                        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
                          <div className="d-flex align-items-center gap-3 min-w-0 flex-grow-1 overflow-hidden">
                            <div className="pdf-icon-wrapper flex-shrink-0 text-danger d-flex align-items-center justify-content-center">
                              <i className="bi bi-file-earmark-pdf-fill fs-3"></i>
                            </div>
                            <div className="min-w-0 flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                              <div
                                className="fw-bold text-body text-truncate"
                                title={editingEvent.contrattoNomeFile || "Contratto_Cliente.pdf"}
                                style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              >
                                {editingEvent.contrattoNomeFile || "Contratto_Cliente.pdf"}
                              </div>
                              <small className="text-success fw-bold d-flex align-items-center gap-1 mt-1 text-truncate">
                                <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                                <span>Contratto Persistente Caricato</span>
                              </small>
                            </div>
                          </div>
                          <div className="pdf-action-buttons d-flex align-items-center gap-2 flex-shrink-0 justify-content-end">
                            <button
                              type="button"
                              disabled={openingPdfId === editingEvent.id}
                              onClick={() => handleOpenContractPdf(editingEvent)}
                              className="btn btn-sm btn-success d-inline-flex align-items-center justify-content-center gap-1 px-3 py-1 fw-semibold text-nowrap shadow-sm"
                              title="Apri e visualizza il contratto PDF"
                            >
                              {openingPdfId === editingEvent.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  <span>Apertura...</span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-eye-fill"></i>
                                  <span>Apri PDF</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteContract}
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center gap-1 px-3 py-1 fw-semibold text-nowrap"
                              title="Elimina contratto"
                            >
                              <i className="bi bi-trash-fill"></i>
                              <span>Elimina</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`pdf-upload-dropzone ${isDraggingPdf ? "is-dragging" : ""}`}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                          if (!uploadingPdf) {
                            if (!editingEvent?.id) {
                              setConfirmModalConfig({
                                isOpen: true,
                                title: "Salvataggio Evento Richiesto",
                                message: "Devi prima salvare l'evento per poter allegare il relativo contratto PDF.",
                                confirmText: "Ho Capito",
                                variant: "info",
                                icon: "bi-info-circle-fill",
                                onConfirm: () => closeConfirmModal(),
                              });
                              return;
                            }
                            fileInputRef.current?.click();
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <i className={`bi ${isDraggingPdf ? "bi-arrow-down-circle-fill text-success" : "bi-cloud-arrow-up-fill text-success"} display-6 mb-2 d-block`}></i>
                        <div className="fw-bold text-body mb-1">
                          {isDraggingPdf ? "Rilascia il file PDF qui per caricarlo" : "Upload Contratto PDF"}
                        </div>
                        <small className="text-muted d-block mb-3">
                          {isDraggingPdf ? "Rilascia per avviare il caricamento" : "Trascina qui il file PDF oppure clicca per selezionarlo"}
                        </small>
                        <div className="file-input-wrapper mx-auto" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleProcessContractFile(file);
                              }
                              e.target.value = "";
                            }}
                            disabled={uploadingPdf || !editingEvent?.id}
                            className="form-control form-control-sm"
                          />
                        </div>
                        {uploadingPdf && (
                          <div className="d-flex align-items-center justify-content-center gap-2 mt-3 text-success fw-bold">
                            <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                            <small>Caricamento su Cloudinary in corso...</small>
                          </div>
                        )}
                        {!editingEvent?.id && (
                          <div className="pdf-save-warning-alert fw-bold rounded-3 py-2 px-3 mt-3 mb-0 d-inline-flex align-items-center gap-2 small">
                            <i className="bi bi-exclamation-triangle-fill text-warning fs-6"></i>
                            <span>Salva prima l'evento per poter caricare il contratto PDF.</span>
                          </div>
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

                <div className="modal-footer border-top bg-body-tertiary flex-shrink-0 px-4 py-3 d-flex justify-content-between align-items-center">
                  {editingEvent ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(editingEvent.id)}
                      className="btn btn-outline-danger rounded-pill px-3"
                    >
                      <i className="bi bi-trash me-1"></i> Elimina Evento
                    </button>
                  ) : <div></div>}

                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>
                      Annulla
                    </button>
                    <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm">
                      <i className="bi bi-check-lg me-1"></i> Salva Evento
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modale Custom di Conferma / Avviso Admin */}
      <AdminConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        variant={confirmModalConfig.variant}
        icon={confirmModalConfig.icon}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* MODALE RIEPILOGO EVENTI DEL GIORNO */}
      {dayEventsModal.isOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
          onClick={() => setDayEventsModal({ isOpen: false, dateStr: "", events: [] })}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-success text-white px-4 py-3">
                <h5 className="modal-title fw-bold font-heading d-flex align-items-center gap-2 mb-0">
                  <i className="bi bi-calendar-event-fill fs-4"></i>
                  Riepilogo Eventi del {dayEventsModal.dateStr ? new Date(dayEventsModal.dateStr + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : ""}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDayEventsModal({ isOpen: false, dateStr: "", events: [] })}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                  <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-2 rounded-pill fs-7">
                    {dayEventsModal.events.length} {dayEventsModal.events.length === 1 ? "evento registrato" : "eventi registrati"} in questa data
                  </span>
                  <button
                    onClick={() => {
                      const targetDate = dayEventsModal.dateStr;
                      setDayEventsModal({ isOpen: false, dateStr: "", events: [] });
                      handleOpenNewModal(targetDate);
                    }}
                    className="btn btn-success btn-sm rounded-pill fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                  >
                    <i className="bi bi-plus-lg"></i>
                    <span>Nuovo Evento per Questa Data</span>
                  </button>
                </div>

                <div className="d-flex flex-column gap-3">
                  {dayEventsModal.events.map((ev) => (
                    <div key={`day-modal-ev-${ev.id}`} className="card border shadow-sm rounded-3 p-3">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                        <div className="d-flex flex-wrap align-items-center gap-1 min-w-0">
                          <span className="badge bg-success text-white fw-bold">
                            {ev.tipoEvento || "Matrimonio"}
                          </span>
                          {ev.hasDjSet && (
                            <span className="badge bg-warning text-dark font-monospace">
                              <i className="bi bi-disc-fill me-1"></i> DJ Set Enzo
                            </span>
                          )}
                          {ev.dataFineEvento && ev.dataFineEvento !== ev.dataEvento && (
                            <span className="badge bg-info text-white font-monospace">
                              Multi-Giorno (fino al {ev.dataFineEvento})
                            </span>
                          )}
                        </div>
                        <div>
                          {ev.contrattoUrl ? (
                            <button
                              type="button"
                              disabled={openingPdfId === ev.id}
                              className="badge bg-success text-white px-2 py-1 text-decoration-none shadow-sm cursor-pointer d-inline-flex align-items-center gap-1 border-0"
                              title="Apri e visualizza il contratto PDF"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenContractPdf(ev);
                              }}
                            >
                              {openingPdfId === ev.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status" style={{ width: "10px", height: "10px" }}></span>
                                  <span>Apertura...</span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-file-earmark-pdf-fill"></i> Apri PDF
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDayEventsModal({ isOpen: false, dateStr: "", events: [] });
                                handleOpenEditModal(ev);
                              }}
                              className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 cursor-pointer text-decoration-none border-0 d-inline-flex align-items-center gap-1"
                              title="PDF Mancante! Clicca qui per caricare il contratto PDF"
                            >
                              <i className="bi bi-exclamation-triangle-fill"></i> PDF Mancante
                            </button>
                          )}
                        </div>
                      </div>

                      <h5 className="fw-bold text-body mb-1">{ev.titolo}</h5>
                      {(ev.clienteNome || ev.clienteCognome) && (
                        <p className="mb-1 text-muted small fw-semibold">
                          <i className="bi bi-person me-1"></i>
                          {ev.clienteNome} {ev.clienteCognome}
                        </p>
                      )}
                      {ev.location && (
                        <p className="mb-1 text-muted small">
                          <i className="bi bi-geo-alt me-1"></i>
                          {ev.location}
                        </p>
                      )}

                      {/* Dettagli contatto rapido */}
                      {(ev.clienteTelefono || ev.clienteEmail) && (
                        <div className="d-flex flex-wrap gap-2 mb-3 pt-2 border-top">
                          {ev.clienteTelefono && (
                            <a
                              href={`tel:${ev.clienteTelefono.replace(/[^\d+]/g, "")}`}
                              onClick={(e) => handlePhoneClick(e, ev.clienteTelefono)}
                              className="btn btn-outline-success btn-sm py-1 px-2 rounded-pill font-monospace"
                              style={{ fontSize: "0.8rem" }}
                            >
                              <i className="bi bi-telephone-fill me-1"></i> {ev.clienteTelefono}
                            </a>
                          )}
                          {ev.clienteEmail && (
                            <a
                              href={`mailto:${ev.clienteEmail}`}
                              onClick={(e) => handleEmailClick(e, ev.clienteEmail, dispatch)}
                              className="btn btn-outline-primary btn-sm py-1 px-2 rounded-pill font-monospace"
                              style={{ fontSize: "0.8rem" }}
                            >
                              <i className="bi bi-envelope-fill me-1"></i> {ev.clienteEmail}
                            </a>
                          )}
                        </div>
                      )}

                      {/* Riepilogo Finanziario & Azioni */}
                      <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 border-top gap-2 bg-body-tertiary p-2 rounded border">
                        <div className="d-flex flex-wrap align-items-center gap-3">
                          <small className="text-body-secondary">Lordo: <strong className="text-body font-monospace fw-bold">€{parseItalianNumber(ev.importoLordo).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></small>
                          <small className="text-body-secondary">Spese: <strong className="text-danger font-monospace fw-semibold">-€{parseItalianNumber(ev.totaleSpese).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></small>
                          <small className="text-body-secondary">Netto: <strong className="text-success font-monospace fw-bold">€{parseItalianNumber(ev.totaleNetto).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></small>
                        </div>
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => {
                              setDayEventsModal({ isOpen: false, dateStr: "", events: [] });
                              handleOpenEditModal(ev);
                            }}
                            className="btn btn-success fw-bold d-inline-flex align-items-center gap-1"
                          >
                            <i className="bi bi-pencil-square"></i>
                            <span>Modifica Evento</span>
                          </button>
                          <button
                            onClick={() => {
                              setDayEventsModal({ isOpen: false, dateStr: "", events: [] });
                              handleDeleteEvent(ev.id);
                            }}
                            className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer bg-body-tertiary">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDayEventsModal({ isOpen: false, dateStr: "", events: [] })}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE VISUALIZZATORE PDF INLINE ENTERPRISE */}
      {inlinePdfModal.open && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 1065 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: "95vw", height: "92vh" }}>
            <div className="modal-content h-100 border-0 shadow-lg d-flex flex-column rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white border-bottom border-secondary border-opacity-25 py-2 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 min-w-0 overflow-hidden">
                  <div className="bg-danger bg-opacity-25 p-1 rounded text-danger d-flex align-items-center justify-content-center">
                    <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                  </div>
                  <div className="min-w-0">
                    <h6 className="modal-title fw-bold text-truncate mb-0 fs-6 text-white" title={inlinePdfModal.title}>
                      {inlinePdfModal.title}
                    </h6>
                    <small className="text-success d-flex align-items-center gap-1 font-monospace" style={{ fontSize: "0.75rem" }}>
                      <i className="bi bi-shield-check"></i> Documento Verificato &amp; Archiviato
                    </small>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <a
                    href={inlinePdfModal.url}
                    download={inlinePdfModal.title || "Contratto.pdf"}
                    className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                    title="Scarica file PDF"
                  >
                    <i className="bi bi-download"></i>
                    <span className="d-none d-sm-inline">Scarica</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => window.open(inlinePdfModal.url, "_blank")}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    title="Apri in una nuova scheda"
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                    <span className="d-none d-sm-inline">Nuova Scheda</span>
                  </button>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      if (inlinePdfModal.url) URL.revokeObjectURL(inlinePdfModal.url);
                      setInlinePdfModal({ open: false, url: null, title: "", eventId: null });
                    }}
                    aria-label="Chiudi"
                  ></button>
                </div>
              </div>

              <div className="modal-body p-0 flex-grow-1 bg-secondary bg-opacity-10 position-relative">
                <iframe
                  src={inlinePdfModal.url}
                  className="w-100 h-100 border-0"
                  title="Anteprima PDF Contratto"
                />
              </div>

              <div className="modal-footer bg-dark border-top border-secondary border-opacity-25 py-2 px-3 d-flex justify-content-between align-items-center">
                <small className="text-secondary d-none d-md-block">
                  Vinco Eventi • Gestione Contabile e Contratti Ufficiali
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary px-4 rounded-pill"
                  onClick={() => {
                    if (inlinePdfModal.url) URL.revokeObjectURL(inlinePdfModal.url);
                    setInlinePdfModal({ open: false, url: null, title: "", eventId: null });
                  }}
                >
                  Chiudi Anteprima
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
