import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Modal, Button, Spinner, Dropdown } from "react-bootstrap";
import API_BASE_URL from "../../config/api";
import { apiFetch } from "../../utils/apiClient";
import ErrorBanner from "../ErrorBanner/ErrorBanner";
import { translations } from "../../utils/translations";
import "./ContactForm.css";

const COUNTRY_PREFIXES = [
  { code: "it", name: "Italia", prefix: "+39", flagUrl: "https://flagcdn.com/w40/it.png" },
  { code: "fr", name: "Francia", prefix: "+33", flagUrl: "https://flagcdn.com/w40/fr.png" },
  { code: "de", name: "Germania", prefix: "+49", flagUrl: "https://flagcdn.com/w40/de.png" },
  { code: "gb", name: "Regno Unito", prefix: "+44", flagUrl: "https://flagcdn.com/w40/gb.png" },
  { code: "es", name: "Spagna", prefix: "+34", flagUrl: "https://flagcdn.com/w40/es.png" },
  { code: "ch", name: "Svizzera", prefix: "+41", flagUrl: "https://flagcdn.com/w40/ch.png" },
  { code: "at", name: "Austria", prefix: "+43", flagUrl: "https://flagcdn.com/w40/at.png" },
  { code: "us", name: "Stati Uniti / Canada", prefix: "+1", flagUrl: "https://flagcdn.com/w40/us.png" },
  { code: "cn", name: "Cina", prefix: "+86", flagUrl: "https://flagcdn.com/w40/cn.png" },
  { code: "jp", name: "Giappone", prefix: "+81", flagUrl: "https://flagcdn.com/w40/jp.png" },
  { code: "br", name: "Brasile", prefix: "+55", flagUrl: "https://flagcdn.com/w40/br.png" },
];

const initialFormState = {
  nome: "",
  cognome: "",
  email: "",
  prefissoTelefono: "+39",
  telefono: "",
  tipoEvento: "",
  dataEvento: "",
  luogoEvento: "",
  numeroOspiti: "",
  momentoGiornata: "",
  tipoCerimonia: "",
  ideaFesta: "",
  ulterioriInfo: "",
  budget: "",
  accettaTermini: false,
};

// Valida Email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Valida Telefono (almeno 6 cifre numeriche)
const isValidPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/[^\d]/g, "");
  return digitsOnly.length >= 6 && digitsOnly.length <= 15;
};

// Valida Data (deve essere da oggi in poi)
const isValidFutureDate = (dateString) => {
  if (!dateString) return false;
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

// Valida Luogo Evento (deve contenere la virgola per separare luogo e località: es. Masseria Coccaro, Monopoli)
const isValidLocation = (location) => {
  if (!location) return false;
  const parts = location.split(",");
  return parts.length >= 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0;
};


function ContactForm() {
  const formRef = useRef(null);
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang]?.contactForm || translations.it.contactForm;

  const [formData, setFormData] = useState(initialFormState);
  const [validated, setValidated] = useState(false);
  const [showValidationBanner, setShowValidationBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // { type: 'success' | 'danger', message: string }
  const [showResetModal, setShowResetModal] = useState(false);

  const selectedCountry = COUNTRY_PREFIXES.find(
    (c) => c.prefix === formData.prefissoTelefono
  ) || COUNTRY_PREFIXES[0];

  const getCountryName = (country) => {
    return t.countries?.[country.code] || country.name;
  };

  const selectedCountryName = getCountryName(selectedCountry);

  const scrollToTop = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // If changing tipoEvento to something other than Matrimonio, clear tipoCerimonia
    if (name === "tipoEvento" && value !== "Matrimonio") {
      setFormData((prev) => ({ ...prev, tipoCerimonia: "" }));
    }
  };

  const isFormValid = () => {
    const basicFields = [
      "nome",
      "cognome",
      "tipoEvento",
      "momentoGiornata",
      "budget",
    ];

    const allBasicFilled = basicFields.every(
      (field) => formData[field].toString().trim() !== ""
    );

    const emailOk = isValidEmail(formData.email);
    const phoneOk = isValidPhone(formData.telefono);
    const locationOk = isValidLocation(formData.luogoEvento);
    const guestsOk = Number(formData.numeroOspiti) > 0;
    const dateOk = isValidFutureDate(formData.dataEvento);

    return (
      allBasicFilled &&
      emailOk &&
      phoneOk &&
      locationOk &&
      guestsOk &&
      dateOk &&
      formData.accettaTermini
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    if (!isFormValid()) {
      setShowValidationBanner(true);
      scrollToTop();
      return;
    }

    setShowValidationBanner(false);
    setIsSubmitting(true);
    setSubmitStatus(null);

    const cleanPhoneDigits = formData.telefono.trim().replace(/^\+\d{1,4}\s*/, "");
    const fullPhone = `${formData.prefissoTelefono} ${cleanPhoneDigits}`;

    const payload = {
      nome: formData.nome,
      cognome: formData.cognome,
      email: formData.email,
      telefono: fullPhone,
      dataEvento: formData.dataEvento || null,
      tipoEvento: formData.tipoEvento,
      location: formData.luogoEvento,
      numeroOspiti: String(formData.numeroOspiti),
      orarioGiornata: formData.momentoGiornata,
      tipoCerimonia: formData.tipoCerimonia,
      messaggio: formData.ideaFesta
        ? `${formData.ideaFesta}${formData.ulterioriInfo ? "\n\nInfo aggiuntive: " + formData.ulterioriInfo : ""}`
        : formData.ulterioriInfo || "",
      budget: formData.budget,
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
        <ErrorBanner
          message={t.validationBannerText}
          type="warning"
          className="mb-4"
          onDismiss={() => setShowValidationBanner(false)}
        />
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
                validated && !formData.nome.trim() ? "is-invalid" : ""
              }`}
              required
            />
            <div className="invalid-feedback">{t.firstName} è obbligatorio.</div>
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
                validated && !formData.cognome.trim() ? "is-invalid" : ""
              }`}
              required
            />
            <div className="invalid-feedback">{t.lastName} è obbligatorio.</div>
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
            <div className="invalid-feedback">Inserisci una {t.email} valida.</div>
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

                <Dropdown.Menu className="phone-prefix-menu shadow-lg">
                  {COUNTRY_PREFIXES.map((country) => {
                    const countryName = getCountryName(country);
                    return (
                      <Dropdown.Item
                        key={country.code}
                        active={country.prefix === formData.prefissoTelefono}
                        onClick={() => setFormData((prev) => ({ ...prev, prefissoTelefono: country.prefix }))}
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
                  })}
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
              <div className="invalid-feedback">Il {t.phone} è obbligatorio (inserisci un numero di almeno 6 cifre).</div>
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
                validated && !formData.tipoEvento ? "is-invalid" : ""
              }`}
              required
            >
              <option value="">{t.selectEventType}</option>
              <option value="Matrimonio">{t.eventTypes.wedding}</option>
              <option value="Evento Aziendale">{t.eventTypes.corporate}</option>
              <option value="Evento privato">{t.eventTypes.private}</option>
              <option value="Altro">{t.eventTypes.other}</option>
            </select>
            <div className="invalid-feedback">Seleziona il {t.eventType}.</div>
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
              min={new Date().toISOString().split("T")[0]}
              value={formData.dataEvento}
              onChange={handleChange}
              className={`form-control font-body ${
                validated && !isValidFutureDate(formData.dataEvento)
                  ? "is-invalid"
                  : ""
              }`}
              required
            />
            <div className="invalid-feedback">La {t.eventDate} è obbligatoria.</div>
          </div>
        </div>

        {/* Row 4: Luogo Evento e Numero di ospiti */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label htmlFor="luogoEvento" className="form-label font-body fw-semibold text-body fs-7">
              {t.eventLocation} <span className="text-danger">*</span>
            </label>

            <div className="position-relative">
              {validated && !isValidLocation(formData.luogoEvento) && (
                <div className="location-fumetto-speech-bubble" role="alert">
                  <i className="bi bi-info-circle-fill me-2 text-warning fs-6"></i>
                  <span>
                    {t.locationFumettoHint ||
                      "Inserisci sia il Luogo che la Località separati da una virgola (es. Masseria Coccaro, Monopoli)"}
                  </span>
                </div>
              )}

              <input
                type="text"
                id="luogoEvento"
                name="luogoEvento"
                tabIndex={7}
                value={formData.luogoEvento}
                onChange={handleChange}
                placeholder={t.eventLocationPlaceholder || "Es. Masseria Coccaro, Monopoli"}
                className={`form-control font-body ${
                  validated && !isValidLocation(formData.luogoEvento) ? "is-invalid" : ""
                }`}
                required
              />
            </div>
            <div className="invalid-feedback">
              {t.locationInvalidError ||
                "Inserisci il Luogo e la Località separati da una virgola (es. Masseria Coccaro, Monopoli)."}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="numeroOspiti" className="form-label font-body fw-semibold text-body fs-7">
              {t.guestsCount} <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              id="numeroOspiti"
              name="numeroOspiti"
              tabIndex={8}
              min="1"
              value={formData.numeroOspiti}
              onChange={handleChange}
              placeholder="Es. 120"
              className={`form-control font-body ${
                validated &&
                (!formData.numeroOspiti || Number(formData.numeroOspiti) <= 0)
                  ? "is-invalid"
                  : ""
              }`}
              required
            />
            <div className="invalid-feedback">Inserisci il {t.guestsCount}.</div>
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
                validated && !formData.momentoGiornata ? "is-invalid" : ""
              }`}
              required
            >
              <option value="">{t.selectTimeOfDay}</option>
              <option value="Pranzo">{t.timeOfDayOptions.lunch}</option>
              <option value="Cena">{t.timeOfDayOptions.dinner}</option>
            </select>
            <div className="invalid-feedback">Seleziona il momento della giornata.</div>
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
                <option value="Civile">{t.ceremonyOptions.civil}</option>
                <option value="Religioso">{t.ceremonyOptions.religious}</option>
                <option value="Altro">{t.ceremonyOptions.other}</option>
              </select>
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
              validated && !formData.budget ? "is-invalid" : ""
            }`}
            required
          >
            <option value="">{t.selectBudget}</option>
            <option value="1.500€-3.000€">{t.budgetOptions.tier1}</option>
            <option value="3.000€-5.000€">{t.budgetOptions.tier2}</option>
            <option value="+5.000€">{t.budgetOptions.tier3}</option>
          </select>
          <div className="invalid-feedback">Seleziona una fascia di budget.</div>
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
            Devi accettare i termini e le condizioni per proseguire.
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
        className="reset-confirmation-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="font-heading fw-bold h5 text-body">
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
