import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Modal, Button, Spinner, Dropdown } from "react-bootstrap";
import API_BASE_URL from "../../config/api";
import { apiFetch } from "../../utils/apiClient";
import ErrorBanner from "../ErrorBanner/ErrorBanner";
import { translations } from "../../utils/translations";
import "./ContactForm.css";

const COUNTRY_PREFIXES = [
  { code: "it", name: "Italia", nameEn: "Italy", prefix: "+39", flagUrl: "https://flagcdn.com/w40/it.png" },
  { code: "fr", name: "Francia", nameEn: "France", prefix: "+33", flagUrl: "https://flagcdn.com/w40/fr.png" },
  { code: "de", name: "Germania", nameEn: "Germany", prefix: "+49", flagUrl: "https://flagcdn.com/w40/de.png" },
  { code: "gb", name: "Regno Unito", nameEn: "United Kingdom", prefix: "+44", flagUrl: "https://flagcdn.com/w40/gb.png" },
  { code: "es", name: "Spagna", nameEn: "Spain", prefix: "+34", flagUrl: "https://flagcdn.com/w40/es.png" },
  { code: "ch", name: "Svizzera", nameEn: "Switzerland", prefix: "+41", flagUrl: "https://flagcdn.com/w40/ch.png" },
  { code: "at", name: "Austria", nameEn: "Austria", prefix: "+43", flagUrl: "https://flagcdn.com/w40/at.png" },
  { code: "us", name: "Stati Uniti / Canada", nameEn: "United States / Canada", prefix: "+1", flagUrl: "https://flagcdn.com/w40/us.png" },
  { code: "cn", name: "Cina", nameEn: "China", prefix: "+86", flagUrl: "https://flagcdn.com/w40/cn.png" },
  { code: "jp", name: "Giappone", nameEn: "Japan", prefix: "+81", flagUrl: "https://flagcdn.com/w40/jp.png" },
  { code: "br", name: "Brasile", nameEn: "Brazil", prefix: "+55", flagUrl: "https://flagcdn.com/w40/br.png" },
  { code: "nl", name: "Paesi Bassi", nameEn: "Netherlands", prefix: "+31", flagUrl: "https://flagcdn.com/w40/nl.png" },
  { code: "be", name: "Belgio", nameEn: "Belgium", prefix: "+32", flagUrl: "https://flagcdn.com/w40/be.png" },
  { code: "pt", name: "Portogallo", nameEn: "Portugal", prefix: "+351", flagUrl: "https://flagcdn.com/w40/pt.png" },
  { code: "gr", name: "Grecia", nameEn: "Greece", prefix: "+30", flagUrl: "https://flagcdn.com/w40/gr.png" },
  { code: "ae", name: "Emirati Arabi Uniti", nameEn: "United Arab Emirates", prefix: "+971", flagUrl: "https://flagcdn.com/w40/ae.png" },
  { code: "au", name: "Australia", nameEn: "Australia", prefix: "+61", flagUrl: "https://flagcdn.com/w40/au.png" },
];

const initialFormState = {
  nome: "",
  cognome: "",
  email: "",
  prefissoTelefono: "+39",
  telefono: "",
  tipoEvento: "",
  tipoEventoAltro: "",
  dataEvento: "",
  nomeLocation: "",
  cittaLocation: "",
  numeroOspiti: "",
  momentoGiornata: "",
  tipoCerimonia: "",
  tipoCerimoniaAltro: "",
  ideaFesta: "",
  ulterioriInfo: "",
  budget: "",
  accettaTermini: false,
};

// Valida Email
const isValidEmail = (email) => {
  if (!email) return false;
  const trimmed = email.trim();
  if (trimmed.length > 100) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
};

// Valida Telefono (almeno 6 cifre numeriche fino a 15)
const isValidPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/[^\d]/g, "");
  return digitsOnly.length >= 6 && digitsOnly.length <= 15;
};

// Valida Data (deve essere una data futura o da oggi in poi)
const isValidFutureDate = (dateString) => {
  if (!dateString) return false;
  const todayStr = new Date().toLocaleDateString("sv-SE");
  return dateString >= todayStr;
};

// Valida Nome e Cognome (solo lettere, accenti, punti, spazi, apostrofi e trattini, 2-50 caratteri)
const isValidPersonName = (name) => {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  return /^[a-zA-Zà-ùÀ-Ùá-úÁ-Úä-üÄ-ÜñÑ\s'.-]+$/.test(trimmed);
};

// Valida Nome Struttura / Location (2-80 caratteri, esclude simboli di injection)
const isValidVenueName = (venue) => {
  if (!venue) return false;
  const trimmed = venue.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  return !/[=<>;$%*|\\{}]/.test(trimmed);
};

// Valida Città / Località (2-50 caratteri, alfabetico/accentato/punti/spazi)
const isValidCityName = (city) => {
  if (!city) return false;
  const trimmed = city.trim();
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  return /^[a-zA-Zà-ùÀ-Ùá-úÁ-Úä-üÄ-ÜñÑ\s'.-]+$/.test(trimmed);
};


function ContactForm() {
  const formRef = useRef(null);
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.contactForm || translations.it.contactForm;

  const [formData, setFormData] = useState(initialFormState);
  const [validated, setValidated] = useState(false);
  const [showValidationBanner, setShowValidationBanner] = useState(false);
  const [activeValidationErrors, setActiveValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success' | 'danger', message: string }
  const [showResetModal, setShowResetModal] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");

  const selectedCountry = COUNTRY_PREFIXES.find(
    (c) => c.prefix === formData.prefissoTelefono
  ) || COUNTRY_PREFIXES[0];

  const getCountryName = (country) => {
    if (!country) return "";
    return t.countries?.[country.code] || (lang === "en" && country.nameEn ? country.nameEn : country.name);
  };

  const selectedCountryName = getCountryName(selectedCountry);

  const filteredCountries = COUNTRY_PREFIXES.filter((c) => {
    const q = prefixSearch.toLowerCase().trim();
    if (!q) return true;
    const nameIt = (c.name || "").toLowerCase();
    const nameEn = (c.nameEn || "").toLowerCase();
    const translationName = (t.countries?.[c.code] || "").toLowerCase();
    const code = (c.code || "").toLowerCase();
    const prefix = (c.prefix || "").toLowerCase();
    return (
      nameIt.includes(q) ||
      nameEn.includes(q) ||
      translationName.includes(q) ||
      code.includes(q) ||
      prefix.includes(q)
    );
  });

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToAndFocusField = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "tipoEvento") {
        if (value !== "Altro") {
          updated.tipoEventoAltro = "";
        }
        if (value !== "Matrimonio") {
          updated.tipoCerimonia = "";
          updated.tipoCerimoniaAltro = "";
        }
      }

      if (name === "tipoCerimonia" && value !== "Altro") {
        updated.tipoCerimoniaAltro = "";
      }

      return updated;
    });
  };

  const getValidationErrors = (data = formData) => {
    const errors = [];

    if (!isValidPersonName(data.nome)) {
      errors.push({
        id: "nome",
        label: t.firstName || "Nome",
        guidance: t.validationGuidance?.nome || t.nameInvalidError || "Inserisci un nome valido (almeno 2 caratteri, solo lettere).",
      });
    }

    if (!isValidPersonName(data.cognome)) {
      errors.push({
        id: "cognome",
        label: t.lastName || "Cognome",
        guidance: t.validationGuidance?.cognome || t.lastNameInvalidError || "Inserisci un cognome valido (almeno 2 caratteri, solo lettere).",
      });
    }

    if (!isValidEmail(data.email)) {
      errors.push({
        id: "email",
        label: t.email || "Email",
        guidance: t.validationGuidance?.email || `Inserisci una ${t.email || "email"} valida.`,
      });
    }

    if (!isValidPhone(data.telefono)) {
      errors.push({
        id: "telefono",
        label: t.phone || "Telefono",
        guidance: t.validationGuidance?.telefono || `Il ${t.phone || "telefono"} è obbligatorio (almeno 6 cifre).`,
      });
    }

    if (!data.tipoEvento || !data.tipoEvento.trim()) {
      errors.push({
        id: "tipoEvento",
        label: t.eventType || "Tipo di Evento",
        guidance: t.validationGuidance?.tipoEvento || `Seleziona il ${t.eventType || "tipo di evento"}.`,
      });
    } else if (data.tipoEvento === "Altro" && (!data.tipoEventoAltro || !data.tipoEventoAltro.trim())) {
      errors.push({
        id: "tipoEventoAltro",
        label: t.eventTypeOtherLabel || "Specifica tipo di evento",
        guidance: t.validationGuidance?.tipoEventoAltro || t.eventTypeOtherError || "Specifica il tipo di evento.",
      });
    }

    if (!isValidFutureDate(data.dataEvento)) {
      errors.push({
        id: "dataEvento",
        label: t.eventDate || "Data Evento",
        guidance: t.validationGuidance?.dataEvento || `La ${t.eventDate || "data evento"} è obbligatoria (da oggi in poi).`,
      });
    }

    if (!isValidVenueName(data.nomeLocation)) {
      errors.push({
        id: "nomeLocation",
        label: t.venueName || "Nome Struttura / Location",
        guidance: t.validationGuidance?.nomeLocation || t.venueNameError || "Inserisci il nome valido della struttura o location.",
      });
    }

    if (!isValidCityName(data.cittaLocation)) {
      errors.push({
        id: "cittaLocation",
        label: t.cityName || "Città / Località",
        guidance: t.validationGuidance?.cittaLocation || t.cityNameError || "Inserisci una città o località valida.",
      });
    }

    if (!data.momentoGiornata || !data.momentoGiornata.trim()) {
      errors.push({
        id: "momentoGiornata",
        label: t.timeOfDay || "L'evento si svolgerà a",
        guidance: t.validationGuidance?.momentoGiornata || "Seleziona il momento della giornata.",
      });
    }

    if (data.tipoEvento === "Matrimonio" && data.tipoCerimonia === "Altro" && (!data.tipoCerimoniaAltro || !data.tipoCerimoniaAltro.trim())) {
      errors.push({
        id: "tipoCerimoniaAltro",
        label: t.ceremonyTypeOtherLabel || "Specifica tipo di cerimonia",
        guidance: t.validationGuidance?.tipoCerimoniaAltro || t.ceremonyTypeOtherError || "Specifica il tipo di cerimonia.",
      });
    }

    if (!data.budget || !data.budget.trim()) {
      errors.push({
        id: "budget",
        label: t.budget || "Hai un idea di budget per il tuo evento?",
        guidance: t.validationGuidance?.budget || "Seleziona una fascia di budget.",
      });
    }

    if (!data.accettaTermini) {
      errors.push({
        id: "accettaTermini",
        label: t.acceptTerms || "Termini e Condizioni",
        guidance: t.validationGuidance?.accettaTermini || t.acceptTermsError || "Devi accettare i Termini e Condizioni.",
      });
    }

    return errors;
  };

  const isFormValid = () => {
    return getValidationErrors(formData).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    const errors = getValidationErrors(formData);
    setActiveValidationErrors(errors);

    if (errors.length > 0) {
      setShowValidationBanner(true);
      if (errors[0]?.id) {
        scrollToAndFocusField(errors[0].id);
      } else {
        scrollToTop();
      }
      return;
    }

    setShowValidationBanner(false);
    setIsSubmitting(true);
    setSubmitStatus(null);

    const cleanPhoneDigits = formData.telefono.trim().replace(/^\+\d{1,4}\s*/, "");
    const fullPhone = `${formData.prefissoTelefono} ${cleanPhoneDigits}`;

    const finalTipoEvento =
      formData.tipoEvento === "Altro"
        ? (formData.tipoEventoAltro.trim() ? `Altro: ${formData.tipoEventoAltro.trim()}` : "Altro")
        : formData.tipoEvento;

    const finalTipoCerimonia =
      formData.tipoCerimonia === "Altro"
        ? (formData.tipoCerimoniaAltro.trim() ? `Altro: ${formData.tipoCerimoniaAltro.trim()}` : "Altro")
        : formData.tipoCerimonia;

    const combinedLocation = `${formData.nomeLocation.trim()}, ${formData.cittaLocation.trim()}`;

    const payload = {
      nome: formData.nome.trim(),
      cognome: formData.cognome.trim(),
      email: formData.email.trim(),
      telefono: fullPhone,
      dataEvento: formData.dataEvento || null,
      tipoEvento: finalTipoEvento,
      location: combinedLocation,
      numeroOspiti: formData.numeroOspiti && formData.numeroOspiti.trim() ? formData.numeroOspiti.trim() : null,
      orarioGiornata: formData.momentoGiornata,
      tipoCerimonia: finalTipoCerimonia,
      messaggio: formData.ideaFesta
        ? `${formData.ideaFesta.trim()}${formData.ulterioriInfo ? "\n\nInfo aggiuntive: " + formData.ulterioriInfo.trim() : ""}`
        : formData.ulterioriInfo ? formData.ulterioriInfo.trim() : "",
      budget: formData.budget,
      lingua: lang,
    };

    try {
      await apiFetch(`${API_BASE_URL}/api/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSubmitStatus({
        type: "success",
        message: t.successMessage,
      });
      resetFormInputs();
    } catch (error) {
      setSubmitStatus({
        type: "danger",
        message: error.message || t.errorMessage || "Errore durante l'invio del preventivo. Riprova più tardi.",
      });
    } finally {
      setIsSubmitting(false);
      scrollToTop();
    }
  };

  const resetFormInputs = () => {
    setFormData(initialFormState);
    setValidated(false);
    setShowValidationBanner(false);
    setActiveValidationErrors([]);
  };

  const handleConfirmReset = () => {
    resetFormInputs();
    setShowResetModal(false);
    setSubmitStatus(null);
    scrollToTop();
  };

  return (
    <div ref={formRef} className="contact-form-wrapper p-4 p-md-5 rounded-4 shadow-lg border">
      <div className="mb-4 text-center text-md-start">
        <h2 className="display-6 font-heading fw-bold text-body mb-2">
          {t.title}
        </h2>
        <p className="font-body text-body-secondary fs-6 mb-0">{t.subtitle}</p>
      </div>

      {submitStatus && (
        <ErrorBanner
          message={submitStatus.message}
          type={submitStatus.type}
          className="mb-4"
          onDismiss={() => setSubmitStatus(null)}
          autoDismissMs={submitStatus.type === "success" ? 8000 : 0}
        />
      )}

      {showValidationBanner && (
        <div className="alert alert-warning border-warning border-2 shadow-sm rounded-3 p-3 mb-4 font-body" role="alert">
          <div className="d-flex align-items-start gap-2 mb-2">
            <i className="bi bi-exclamation-triangle-fill fs-5 text-warning flex-shrink-0 mt-1"></i>
            <div className="me-auto">
              <h6 className="fw-bold mb-1 text-warning-emphasis">
                {t.validationHeader || "Attenzione: Compila o correggi i seguenti campi obbligatori per inviare la richiesta:"}
              </h6>
              <p className="small mb-0 text-body-secondary">
                {t.validationBanner || "Compila tutti i campi obbligatori contrassegnati dall'asterisco (*). Clicca sul campo in errore per compilarlo direttamente:"}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setShowValidationBanner(false)}
            ></button>
          </div>
          {activeValidationErrors.length > 0 ? (
            <ul className="mb-0 ps-4 small">
              {activeValidationErrors.map((err) => (
                <li key={err.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => scrollToAndFocusField(err.id)}
                    className="btn btn-link p-0 text-decoration-underline text-warning-emphasis fw-semibold text-start border-0 align-baseline ms-1"
                  >
                    {err.label}
                  </button>
                  <span className="text-body">: {err.guidance}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small mb-0 text-warning-emphasis">
              {t.validationBanner || "Compila tutti i campi obbligatori contrassegnati dall'asterisco (*)."}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Row 1: Nome e Cognome */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="nome" className="form-label font-body fw-semibold text-body fs-7">
              {t.firstName} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              tabIndex={1}
              value={formData.nome}
              onChange={handleChange}
              placeholder="Es. Mario"
              className={`form-control font-body ${
                validated && !isValidPersonName(formData.nome) ? "is-invalid" : ""
              }`}
              required
            />
            <div className="invalid-feedback">
              {t.validationGuidance?.nome || t.nameInvalidError || "Inserisci un nome valido (solo lettere, senza cifre o simboli)."}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="cognome" className="form-label font-body fw-semibold text-body fs-7">
              {t.lastName} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="cognome"
              name="cognome"
              tabIndex={2}
              value={formData.cognome}
              onChange={handleChange}
              placeholder="Es. Rossi"
              className={`form-control font-body ${
                validated && !isValidPersonName(formData.cognome) ? "is-invalid" : ""
              }`}
              required
            />
            <div className="invalid-feedback">
              {t.validationGuidance?.cognome || t.lastNameInvalidError || "Inserisci un cognome valido (solo lettere, senza cifre o simboli)."}
            </div>
          </div>
        </div>

        {/* Row 2: Email e Telefono */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="email" className="form-label font-body fw-semibold text-body fs-7">
              {t.email} <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              tabIndex={3}
              value={formData.email}
              onChange={handleChange}
              placeholder="mario.rossi@example.com"
              className={`form-control font-body ${
                validated && !isValidEmail(formData.email) ? "is-invalid" : ""
              }`}
              required
            />
            <div className="invalid-feedback">
              {t.validationGuidance?.email || `Inserisci una ${t.email} valida.`}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="telefono" className="form-label font-body fw-semibold text-body fs-7">
              {t.phone} <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <Dropdown className="phone-prefix-dropdown">
                <Dropdown.Toggle
                  variant="outline-secondary"
                  id="dropdown-phone-prefix"
                  className="d-flex align-items-center gap-1 phone-prefix-btn"
                  title={`${selectedCountryName} (${selectedCountry.prefix})`}
                >
                  <img
                    src={selectedCountry.flagUrl}
                    alt={selectedCountryName}
                    className="country-flag-icon"
                    width="18"
                    height="13"
                  />
                  <span className="prefix-num-sm">{selectedCountry.prefix}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu className="phone-prefix-menu shadow-lg p-2">
                  <div className="px-2 pb-2 mb-1 border-bottom border-secondary border-opacity-10">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-transparent border-end-0 text-muted">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-sm border-start-0 prefix-search-input"
                        placeholder={lang === "en" ? "Search country or prefix..." : "Cerca paese o prefisso..."}
                        value={prefixSearch}
                        onChange={(e) => setPrefixSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      {prefixSearch && (
                        <button
                          className="btn btn-sm btn-outline-secondary border-start-0"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrefixSearch("");
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="prefix-menu-items-scroll">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => {
                        const countryName = getCountryName(country);
                        return (
                          <Dropdown.Item
                            key={country.code}
                            active={country.prefix === formData.prefissoTelefono}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, prefissoTelefono: country.prefix }));
                              setPrefixSearch("");
                            }}
                            className="d-flex align-items-center gap-2 py-2 px-3 fs-7"
                          >
                            <img
                              src={country.flagUrl}
                              alt={countryName}
                              className="country-flag-icon"
                              width="18"
                              height="13"
                            />
                            <span className="fw-semibold me-auto">{countryName}</span>
                            <span className="text-body-secondary font-monospace small">{country.prefix}</span>
                          </Dropdown.Item>
                        );
                      })
                    ) : (
                      <div className="text-muted text-center py-2 fs-7">
                        {lang === "en" ? "No results found" : "Nessun risultato trovato"}
                      </div>
                    )}
                  </div>
                </Dropdown.Menu>
              </Dropdown>

              <input
                type="tel"
                id="telefono"
                name="telefono"
                tabIndex={5}
                value={formData.telefono}
                onChange={handleChange}
                placeholder="333 123 4567"
                className={`form-control phone-input-field font-body ${
                  validated && !isValidPhone(formData.telefono) ? "is-invalid" : ""
                }`}
                required
              />
              <div className="invalid-feedback">
                {t.validationGuidance?.telefono || `Il ${t.phone} è obbligatorio (inserisci un numero di almeno 6 cifre).`}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Tipo Evento e Data Evento */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="tipoEvento" className="form-label font-body fw-semibold text-body fs-7">
              {t.eventType} <span className="text-danger">*</span>
            </label>
            <select
              id="tipoEvento"
              name="tipoEvento"
              tabIndex={5}
              value={formData.tipoEvento}
              onChange={handleChange}
              className={`form-select font-body ${
                validated && (!formData.tipoEvento || !formData.tipoEvento.trim()) ? "is-invalid" : ""
              }`}
              required
            >
              <option value="">{t.selectEventType}</option>
              <option value="Matrimonio">{t.eventTypes.wedding}</option>
              <option value="Evento Aziendale">{t.eventTypes.corporate}</option>
              <option value="Evento privato">{t.eventTypes.private}</option>
              <option value="Altro">{t.eventTypes.other}</option>
            </select>
            <div className="invalid-feedback">
              {t.validationGuidance?.tipoEvento || `Seleziona il ${t.eventType}.`}
            </div>

            {formData.tipoEvento === "Altro" && (
              <div className="mt-2">
                <label htmlFor="tipoEventoAltro" className="form-label font-body fw-semibold text-body fs-7">
                  {t.eventTypeOtherLabel || "Specifica tipo di evento"} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="tipoEventoAltro"
                  name="tipoEventoAltro"
                  tabIndex={5}
                  value={formData.tipoEventoAltro}
                  onChange={handleChange}
                  placeholder={t.eventTypeOtherPlaceholder || "Es. Laurea, Anniversario, Festa di Gala..."}
                  className={`form-control font-body ${
                    validated && !formData.tipoEventoAltro.trim() ? "is-invalid" : ""
                  }`}
                  required
                />
                <div className="invalid-feedback">
                  {t.validationGuidance?.tipoEventoAltro || t.eventTypeOtherError || "Specifica il tipo di evento."}
                </div>
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="dataEvento" className="form-label font-body fw-semibold text-body fs-7">
              {t.eventDate} <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              id="dataEvento"
              name="dataEvento"
              tabIndex={6}
              min={new Date().toLocaleDateString("sv-SE")}
              value={formData.dataEvento}
              onChange={handleChange}
              className={`form-control font-body ${
                validated && !isValidFutureDate(formData.dataEvento)
                  ? "is-invalid"
                  : ""
              }`}
              required
            />
            <div className="invalid-feedback">
              {t.validationGuidance?.dataEvento || `La ${t.eventDate} è obbligatoria.`}
            </div>
          </div>
        </div>

        {/* Row 4: Location (Nome Struttura e Città/Località) */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="nomeLocation" className="form-label font-body fw-semibold text-body fs-7">
              {t.venueName || "Nome Struttura / Location"} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="nomeLocation"
              name="nomeLocation"
              tabIndex={7}
              value={formData.nomeLocation}
              onChange={handleChange}
              placeholder={t.venueNamePlaceholder || "Es. Masseria Coccaro"}
              className={`form-control font-body ${
                validated && !isValidVenueName(formData.nomeLocation) ? "is-invalid" : ""
              }`}
              required
            />
            <div className="invalid-feedback">
              {t.validationGuidance?.nomeLocation || t.venueNameError || "Inserisci il nome valido della struttura o location (es. Masseria Coccaro)."}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="cittaLocation" className="form-label font-body fw-semibold text-body fs-7">
              {t.cityName || "Città / Località"} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="cittaLocation"
              name="cittaLocation"
              tabIndex={8}
              value={formData.cittaLocation}
              onChange={handleChange}
              placeholder={t.cityNamePlaceholder || "Es. Monopoli"}
              className={`form-control font-body ${
                validated && !isValidCityName(formData.cittaLocation) ? "is-invalid" : ""
              }`}
              required
            />
            <div className="invalid-feedback">
              {t.validationGuidance?.cittaLocation || t.cityNameError || "Inserisci una città o località valida (es. Monopoli)."}
            </div>
          </div>
        </div>

        {/* Row 5: Momento Giornata (Pranzo/Cena) e Tipo Cerimonia (se Matrimonio) */}
        <div className="row g-3 mb-3">
          <div className={`col-12 ${formData.tipoEvento === "Matrimonio" ? "col-md-6" : "col-md-12"}`}>
            <label htmlFor="momentoGiornata" className="form-label font-body fw-semibold text-body fs-7">
              {t.timeOfDay} <span className="text-danger">*</span>
            </label>
            <select
              id="momentoGiornata"
              name="momentoGiornata"
              tabIndex={9}
              value={formData.momentoGiornata}
              onChange={handleChange}
              className={`form-select font-body ${
                validated && (!formData.momentoGiornata || !formData.momentoGiornata.trim()) ? "is-invalid" : ""
              }`}
              required
            >
              <option value="">{t.selectTimeOfDay}</option>
              <option value="Pranzo">{t.timeOfDayOptions.lunch}</option>
              <option value="Cena">{t.timeOfDayOptions.dinner}</option>
            </select>
            <div className="invalid-feedback">
              {t.validationGuidance?.momentoGiornata || "Seleziona il momento della giornata."}
            </div>
          </div>

          {formData.tipoEvento === "Matrimonio" && (
            <div className="col-12 col-md-6">
              <label htmlFor="tipoCerimonia" className="form-label font-body fw-semibold text-body fs-7">
                {t.ceremonyType} <span className="text-body-secondary fw-normal">{t.optional}</span>
              </label>
              <select
                id="tipoCerimonia"
                name="tipoCerimonia"
                tabIndex={10}
                value={formData.tipoCerimonia}
                onChange={handleChange}
                className="form-select font-body"
              >
                <option value="">{t.selectCeremonyType}</option>
                <option value="Civile / Simbolico">{t.ceremonyOptions.civil}</option>
                <option value="Religioso">{t.ceremonyOptions.religious}</option>
                <option value="Altro">{t.ceremonyOptions.other}</option>
              </select>

              {formData.tipoCerimonia === "Altro" && (
                <div className="mt-2">
                  <label htmlFor="tipoCerimoniaAltro" className="form-label font-body fw-semibold text-body fs-7">
                    {t.ceremonyTypeOtherLabel || "Specifica tipo di cerimonia"} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="tipoCerimoniaAltro"
                    name="tipoCerimoniaAltro"
                    tabIndex={10}
                    value={formData.tipoCerimoniaAltro}
                    onChange={handleChange}
                    placeholder={t.ceremonyTypeOtherPlaceholder || "Es. All'aperto, Umanista, Simbolica..."}
                    className={`form-control font-body ${
                      validated && !formData.tipoCerimoniaAltro.trim() ? "is-invalid" : ""
                    }`}
                    required
                  />
                  <div className="invalid-feedback">
                    {t.validationGuidance?.tipoCerimoniaAltro || t.ceremonyTypeOtherError || "Specifica il tipo di cerimonia."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 6: Idea Festa (Textarea) */}
        <div className="mb-3">
          <label htmlFor="ideaFesta" className="form-label font-body fw-semibold text-body fs-7">
            {t.partyIdea} <span className="text-body-secondary fw-normal">{t.optional}</span>
          </label>
          <textarea
            id="ideaFesta"
            name="ideaFesta"
            tabIndex={11}
            rows="3"
            value={formData.ideaFesta}
            onChange={handleChange}
            placeholder="Descrivi come immagini la musica e l'atmosfera per il tuo evento..."
            className="form-control font-body"
          ></textarea>
        </div>

        {/* Row 7: Ulteriori informazioni (Textarea) */}
        <div className="mb-3">
          <label htmlFor="ulterioriInfo" className="form-label font-body fw-semibold text-body fs-7">
            {t.additionalInfo} <span className="text-body-secondary fw-normal">{t.optional}</span>
          </label>
          <textarea
            id="ulterioriInfo"
            name="ulterioriInfo"
            tabIndex={12}
            rows="2"
            value={formData.ulterioriInfo}
            onChange={handleChange}
            placeholder="Note aggiuntive, dettagli sulla location, esigenze particolari..."
            className="form-control font-body"
          ></textarea>
        </div>

        {/* Row 8: Budget (Select) */}
        <div className="mb-4">
          <label htmlFor="budget" className="form-label font-body fw-semibold text-body fs-7">
            {t.budget} <span className="text-danger">*</span>
          </label>
          <select
            id="budget"
            name="budget"
            tabIndex={13}
            value={formData.budget}
            onChange={handleChange}
            className={`form-select font-body ${
              validated && (!formData.budget || !formData.budget.trim()) ? "is-invalid" : ""
            }`}
            required
          >
            <option value="">{t.selectBudget}</option>
            <option value="1.500€-3.000€">{t.budgetOptions.tier1}</option>
            <option value="3.000€-5.000€">{t.budgetOptions.tier2}</option>
            <option value="+5.000€">{t.budgetOptions.tier3}</option>
          </select>
          <div className="invalid-feedback">
            {t.validationGuidance?.budget || "Seleziona una fascia di budget."}
          </div>
        </div>

        {/* Row 9: Checkbox Termini e Condizioni */}
        <div className="mb-4 form-check">
          <input
            type="checkbox"
            id="accettaTermini"
            name="accettaTermini"
            tabIndex={14}
            checked={formData.accettaTermini}
            onChange={handleChange}
            className={`form-check-input ${
              validated && !formData.accettaTermini ? "is-invalid" : ""
            }`}
            required
          />
          <label htmlFor="accettaTermini" className="form-check-label font-body fs-7 text-body">
            {t.acceptTerms} <span className="text-danger">*</span>
          </label>
          <div className="invalid-feedback">
            {t.validationGuidance?.accettaTermini || t.acceptTermsError || "Devi prendere visione dell'Informativa sulla Privacy e accettare i Termini e Condizioni per proseguire."}
          </div>
        </div>

        {/* Row 10: Action Buttons */}
        <div className="d-flex flex-column flex-sm-row gap-3 pt-2">
          <button
            type="submit"
            tabIndex={15}
            disabled={isSubmitting}
            className="btn btn-forest flex-grow-1 py-3 font-body fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                <span>Invio in corso...</span>
              </>
            ) : (
              <>
                <i className="bi bi-send-fill"></i>
                <span>{t.submitBtn}</span>
              </>
            )}
          </button>

          <button
            type="button"
            tabIndex={16}
            disabled={isSubmitting}
            onClick={() => setShowResetModal(true)}
            className="btn btn-outline-secondary py-3 px-4 font-body fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            <span>{t.resetBtn}</span>
          </button>
        </div>
      </form>

      {/* Modal di Conferma Reset */}
      <Modal
        show={showResetModal}
        onHide={() => setShowResetModal(false)}
        centered
        backdrop="static"
        keyboard={true}
        aria-labelledby="contactResetModalTitle"
        className="reset-confirmation-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="font-heading fw-bold h5 text-body" id="contactResetModalTitle">
            <i className="bi bi-exclamation-circle text-warning me-2"></i>
            {t.resetModalTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="font-body text-body-secondary py-3">
          {t.resetModalText}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 d-flex justify-content-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowResetModal(false)}
            className="font-body fw-medium rounded-2"
          >
            {t.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmReset}
            className="font-body fw-semibold rounded-2"
          >
            {t.confirmReset}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ContactForm;
