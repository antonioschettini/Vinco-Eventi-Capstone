import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";
import { translations } from "../utils/translations";
import heroBgImage from "../assets/home/fotoEnzoSera.webp";
import basicItaImg from "../assets/serviziOfferti/basicIta.png";
import basicEngImg from "../assets/serviziOfferti/basicEng.png";
import plusItaImg from "../assets/serviziOfferti/plusIta.png";
import plusEngImg from "../assets/serviziOfferti/plusEng.png";
import fullItaImg from "../assets/serviziOfferti/fullIta.png";
import fullEngImg from "../assets/serviziOfferti/fullEng.png";
import API_BASE_URL from "../config/api";
import { apiFetch, authApiFetch } from "../utils/apiClient";
import ErrorBanner from "../components/ErrorBanner/ErrorBanner";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import { handlePhoneClick } from "../utils/contactHelpers";
import "./Services.css";

function Services() {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const t = translations[lang].services;

  const [dbServices, setDbServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state per Modifica / Aggiunta Servizio da parte dell'Admin
  const [formData, setFormData] = useState({
    titleIta: "",
    titleEng: "",
    subtitleIta: "",
    subtitleEng: "",
    category: "PACKAGE",
    badge: "BASIC",
    imageUrlIta: "",
    imageUrlEng: "",
    featuresIta: "",
    featuresEng: "",
    brochureUrlIta: "",
    brochureUrlEng: "",
    displayOrder: 1,
  });

  const fetchDbServices = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_BASE_URL}/api/services`);
      if (Array.isArray(data)) {
        const packagesOnly = data.filter((s) => s.category === "PACKAGE");
        setDbServices(packagesOnly);
      }
    } catch {
      console.log("Database non raggiungibile. Uso fallback locali per visualizzazione.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    const loadServices = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`${API_BASE_URL}/api/services`);
        if (isSubscribed && Array.isArray(data)) {
          const packagesOnly = data.filter((s) => s.category === "PACKAGE");
          setDbServices(packagesOnly);
        }
      } catch {
        console.log("Database non raggiungibile. Uso fallback locali per visualizzazione.");
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };
    loadServices();
    return () => { isSubscribed = false; };
  }, []);

  // Determina l'immagine da visualizzare (Priorità: 1. URL Cloudinary/DB, 2. Immagine Locale Fallback)
  const getServiceImage = (service) => {
    const isEng = lang === "en";
    const dbUrl = isEng ? service.imageUrlEng : service.imageUrlIta;

    if (dbUrl && dbUrl.startsWith("http")) {
      return dbUrl;
    }

    // Fallback sulle immagini trasparenti locali per i pacchetti standard
    const badge = service.badge ? service.badge.toUpperCase() : "BASIC";
    switch (badge) {
      case "BASIC":
        return isEng ? basicEngImg : basicItaImg;
      case "PLUS":
        return isEng ? plusEngImg : plusItaImg;
      case "FULL":
        return isEng ? fullEngImg : fullItaImg;
      default:
        return isEng ? basicEngImg : basicItaImg;
    }
  };

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setFormData({
      titleIta: service.titleIta || "",
      titleEng: service.titleEng || "",
      subtitleIta: service.subtitleIta || "",
      subtitleEng: service.subtitleEng || "",
      category: service.category || "PACKAGE",
      badge: service.badge || "BASIC",
      imageUrlIta: service.imageUrlIta || "",
      imageUrlEng: service.imageUrlEng || "",
      featuresIta: service.featuresIta || "",
      featuresEng: service.featuresEng || "",
      brochureUrlIta: service.brochureUrlIta || "",
      brochureUrlEng: service.brochureUrlEng || "",
      displayOrder: service.displayOrder || 1,
    });
    setShowAddModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setFormData({
      titleIta: "",
      titleEng: "",
      subtitleIta: "",
      subtitleEng: "",
      category: "PACKAGE",
      badge: "CUSTOM",
      imageUrlIta: "",
      imageUrlEng: "",
      featuresIta: "",
      featuresEng: "",
      brochureUrlIta: "",
      brochureUrlEng: "",
      displayOrder: dbServices.length + 1,
    });
    setShowAddModal(true);
  };

  const handleImageUpload = async (e, langField) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");
    setSuccessMsg("");
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const data = await authApiFetch(
        `${API_BASE_URL}/api/admin/services/upload-image`,
        {
          method: "POST",
          body: formDataUpload,
        },
        token,
        dispatch
      );

      if (data?.url) {
        setFormData((prev) => ({
          ...prev,
          [langField]: data.url,
        }));
        setSuccessMsg("Immagine caricata con successo su Cloudinary!");
      }
    } catch (err) {
      setErrorMsg(`Upload fallito: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateOrUpdateService = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const url = editingService
        ? `${API_BASE_URL}/api/admin/services/${editingService.id}`
        : `${API_BASE_URL}/api/admin/services`;
      const method = editingService ? "PUT" : "POST";

      await authApiFetch(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
        token,
        dispatch
      );

      setShowAddModal(false);
      setEditingService(null);
      setSuccessMsg(editingService ? "Pacchetto aggiornato con successo!" : "Nuovo pacchetto creato!");
      fetchDbServices();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm(t.adminActions.confirmDelete)) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authApiFetch(
        `${API_BASE_URL}/api/admin/services/${id}`,
        { method: "DELETE" },
        token,
        dispatch
      );
      setSuccessMsg("Pacchetto eliminato con successo.");
      fetchDbServices();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // Fallback per rendering iniziale o se DB in caricamento
  const defaultStaticPackages = [
    {
      id: "static-basic",
      badge: "BASIC",
      titleIta: t.basic.title,
      titleEng: t.basic.title,
      subtitleIta: t.basic.subtitle,
      subtitleEng: t.basic.subtitle,
      featuresIta: t.basic.features.join(";"),
      featuresEng: t.basic.features.join(";"),
    },
    {
      id: "static-plus",
      badge: "PLUS",
      titleIta: t.plus.title,
      titleEng: t.plus.title,
      subtitleIta: t.plus.subtitle,
      subtitleEng: t.plus.subtitle,
      featuresIta: t.plus.features.join(";"),
      featuresEng: t.plus.features.join(";"),
    },
    {
      id: "static-full",
      badge: "FULL",
      titleIta: t.full.title,
      titleEng: t.full.title,
      subtitleIta: t.full.subtitle,
      subtitleEng: t.full.subtitle,
      featuresIta: t.full.features.join(";"),
      featuresEng: t.full.features.join(";"),
      brochureUrlIta: t.full.brochureLinks.liveBand,
      brochureUrlEng: t.full.brochureLinks.liveBand,
    },
  ];

  const packagesToRender = dbServices.length > 0
    ? [...dbServices].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : defaultStaticPackages;

  return (
    <div className="services-page-wrapper">
      {/* 1. HERO SECTION SERVIZI (Stessa UI/UX di Galleria, Chi Siamo ed Home) */}
      <section
        className="hero-gallery-section py-5 position-relative"
        style={{ backgroundImage: `url("${heroBgImage}")` }}
      >
        <div className="hero-gallery-overlay"></div>

        <Container className="hero-gallery-content text-center py-4 py-md-5">
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={9}>
              <h1 className="display-3 fw-bold mb-4 font-heading text-body hero-gallery-title">
                {t.heroTitle}
              </h1>
              <p className="lead fs-4 font-body text-body-secondary mb-4 hero-gallery-subtitle max-w-800 mx-auto">
                {t.heroSubtitle}
              </p>
              <div className="d-flex justify-content-center">
                <a
                  href="tel:+393492949669"
                  onClick={(e) => handlePhoneClick(e, "+393492949669")}
                  className="btn btn-forest-submit btn-lg px-4 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                >
                  <i className="bi bi-telephone-fill"></i>
                  <span>(+39) 349 2949669</span>
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 2. I PACCHETTI PRINCIPALI (CARD / BOX) */}
      <section className="py-5">
        <div className="container">
          {/* Banner Notifiche (Errore / Successo) */}
          {errorMsg && (
            <ErrorBanner
              message={errorMsg}
              type="danger"
              className="mb-4"
              onDismiss={() => setErrorMsg("")}
            />
          )}
          {successMsg && (
            <ErrorBanner
              message={successMsg}
              type="success"
              className="mb-4"
              autoDismissMs={5000}
              onDismiss={() => setSuccessMsg("")}
            />
          )}

          {/* Bar Controlli Admin per Gestione / Aggiunta Pacchetti */}
          {isAuthenticated && (
            <div className="bg-success-subtle border border-success border-opacity-25 p-3 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <span className="fw-bold text-success d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock-fill fs-5"></i>
                {t.adminActions.adminMode}
              </span>
              <button
                onClick={handleOpenCreateModal}
                className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
              >
                <i className="bi bi-plus-circle-fill"></i>
                <span>{t.adminActions.addService}</span>
              </button>
            </div>
          )}

          {loading && (
            <LoadingSpinner variant="inline" message="Caricamento pacchetti servizi in corso..." size="md" />
          )}

          <div className="text-center mb-5">
            <h2 className="display-6 font-heading fw-bold">{t.packagesTitle}</h2>
            <div className="mx-auto border-bottom border-success border-3" style={{ width: "80px" }}></div>
          </div>

          <div className="row g-4 justify-content-center align-items-stretch">
            {packagesToRender.map((pkg) => {
              const badgeUpper = pkg.badge ? pkg.badge.toUpperCase() : "BASIC";
              const isFull = badgeUpper === "FULL";
              const title = lang === "en" ? pkg.titleEng || pkg.titleIta : pkg.titleIta;
              const subtitle = lang === "en" ? pkg.subtitleEng || pkg.subtitleIta : pkg.subtitleIta;
              const rawFeatures = lang === "en" ? pkg.featuresEng || pkg.featuresIta : pkg.featuresIta;
              const featuresList = rawFeatures ? rawFeatures.split(";").map((f) => f.trim()).filter(Boolean) : [];

              return (
                <div className="col-lg-4 col-md-6 d-flex justify-content-center" key={pkg.id}>
                  <div className="service-card-box w-100 d-flex flex-column">
                    
                    {/* Admin Action Buttons directly on Card Header */}
                    {isAuthenticated && (
                      <div className="p-2 bg-dark bg-opacity-75 text-white d-flex justify-content-between align-items-center border-bottom">
                        <span className="badge bg-success text-uppercase small">ID #{String(pkg.id).substring(0, 6)}</span>
                        <div className="btn-group btn-group-sm">
                          <button
                            onClick={() => handleOpenEditModal(pkg)}
                            className="btn btn-warning btn-sm fw-bold d-flex align-items-center gap-1"
                            title="Modifica questo pacchetto"
                          >
                            <i className="bi bi-pencil-fill"></i> Modifica
                          </button>
                          <button
                            onClick={() => handleDeleteService(pkg.id)}
                            className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                            title="Elimina pacchetto"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="service-card-img-wrapper">
                      <img
                        src={getServiceImage(pkg)}
                        alt={`${title} Vinco Eventi`}
                        className="service-card-img"
                      />
                      <span className={`package-badge-pill badge-${badgeUpper.toLowerCase()}`}>
                        {badgeUpper}
                      </span>
                    </div>

                    <div className="p-4 d-flex flex-column flex-grow-1 justify-content-between">
                      <div>
                        <h3 className="h4 font-heading fw-bold mb-2">{title}</h3>
                        <p className="text-muted small mb-3">{subtitle}</p>

                        <ul className="feature-list-custom">
                          {featuresList.map((feat, idx) => {
                            const cleanFeat = feat.replace(/\[BROCHURE\]/gi, "").trim();
                            const featLower = feat.toLowerCase();

                            // Se siamo nel pacchetto FULL e la caratteristica richiede Brochure, rendi il pulsante cliccabile
                            if (isFull && (featLower.includes("live band") || featLower.includes("band"))) {
                              return (
                                <li key={idx}>
                                  {cleanFeat}{" "}
                                  <a
                                    href={t.full.brochureLinks.liveBand}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-danger btn-sm brochure-link-btn"
                                    title={lang === "en" ? "Open Live Band Brochure on Google Drive" : "Apri Brochure Live Band su Google Drive"}
                                  >
                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                    <span>{t.brochureBtn}</span>
                                  </a>
                                </li>
                              );
                            }
                            if (isFull && (featLower.includes("photobooth") || featLower.includes("videobooth") || featLower.includes("telefono") || featLower.includes("guestbook"))) {
                              return (
                                <li key={idx}>
                                  {cleanFeat}{" "}
                                  <a
                                    href={t.full.brochureLinks.photobooth}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-danger btn-sm brochure-link-btn"
                                    title={lang === "en" ? "Open Photobooth Brochure on Google Drive" : "Apri Brochure Photobooth su Google Drive"}
                                  >
                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                    <span>{t.brochureBtn}</span>
                                  </a>
                                </li>
                              );
                            }
                            if (isFull && !featLower.includes("audio") && (featLower.includes("illuminazioni") || featLower.includes("lighting") || featLower.includes("sparkular") || featLower.includes("fuochi"))) {
                              return (
                                <li key={idx}>
                                  {cleanFeat}{" "}
                                  <a
                                    href={t.full.brochureLinks.lighting}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-danger btn-sm brochure-link-btn"
                                    title={lang === "en" ? "Open Lighting & Fireworks Brochure on Google Drive" : "Apri Brochure Scenografie Luminose su Google Drive"}
                                  >
                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                    <span>{t.brochureBtn}</span>
                                  </a>
                                </li>
                              );
                            }
                            return <li key={idx}>{cleanFeat}</li>;
                          })}
                        </ul>
                      </div>

                      <div className="mt-3">
                        <a
                          href="tel:+393492949669"
                          onClick={(e) => handlePhoneClick(e, "+393492949669")}
                          className="btn btn-outline-success w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                        >
                          <i className="bi bi-telephone-fill"></i>
                          <span>{t.contactUs}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SEZIONE "ALTRE PROPOSTE" (Stessa UI/UX dei paragrafi in Chi Siamo) */}
      <section className="other-proposals-section py-5 my-3 my-md-4">
        <Container className="py-2">
          <Row className="justify-content-center">
            <Col xs={12} lg={10} xl={9}>
              <div className="story-content text-center text-md-start">
                <h2 className="display-5 font-heading text-body fw-bold mb-4">
                  {t.otherProposals.title}
                </h2>
                <div className="font-body text-body-secondary fs-6 lh-lg d-flex flex-column gap-3 mb-0">
                  <p className="mb-0" style={{ textAlign: "justify" }}>
                    {t.otherProposals.text}
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* MODALE AMMINISTRAZIONE (AGGIUNGI / MODIFICA SERVIZIO CON UPLOAD CLOUDINARY) */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title font-heading fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>
                  {editingService ? `Modifica Pacchetto ${formData.badge}` : "Aggiungi Nuovo Pacchetto"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateOrUpdateService}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Titolo Pacchetto (ITA)*</label>
                      <input
                        type="text"
                        value={formData.titleIta}
                        onChange={(e) => setFormData({ ...formData, titleIta: e.target.value })}
                        className="form-control"
                        required
                        placeholder="es. BASIC BOX"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Titolo Pacchetto (ENG)*</label>
                      <input
                        type="text"
                        value={formData.titleEng}
                        onChange={(e) => setFormData({ ...formData, titleEng: e.target.value })}
                        className="form-control"
                        required
                        placeholder="es. BASIC BOX"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Badge Identificativo</label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value.toUpperCase() })}
                        className="form-control"
                        placeholder="BASIC, PLUS, FULL, SPECIAL"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ordine di Visualizzazione</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Sottotitolo Descrizione (ITA)</label>
                      <textarea
                        rows="2"
                        value={formData.subtitleIta}
                        onChange={(e) => setFormData({ ...formData, subtitleIta: e.target.value })}
                        className="form-control"
                        placeholder="Breve sintesi del pacchetto..."
                      ></textarea>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Sottotitolo Descrizione (ENG)</label>
                      <textarea
                        rows="2"
                        value={formData.subtitleEng}
                        onChange={(e) => setFormData({ ...formData, subtitleEng: e.target.value })}
                        className="form-control"
                        placeholder="Short package overview..."
                      ></textarea>
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Elenco Caratteristiche ITA (separate da punto e virgola ;)</label>
                      <textarea
                        rows="3"
                        value={formData.featuresIta}
                        onChange={(e) => setFormData({ ...formData, featuresIta: e.target.value })}
                        className="form-control"
                        placeholder="Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo"
                      ></textarea>
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Elenco Caratteristiche ENG (separate da punto e virgola ;)</label>
                      <textarea
                        rows="3"
                        value={formData.featuresEng}
                        onChange={(e) => setFormData({ ...formData, featuresEng: e.target.value })}
                        className="form-control"
                        placeholder="Audio and lighting service;DJ (selected from VINCO EVENTI team)"
                      ></textarea>
                    </div>

                    {/* Upload Immagini su Cloudinary */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Upload Immagine Promo ITA (Cloudinary)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "imageUrlIta")}
                        className="form-control"
                        disabled={uploadingImage}
                      />
                      {formData.imageUrlIta && (
                        <small className="text-success d-block mt-1 text-truncate">
                          URL: {formData.imageUrlIta}
                        </small>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Upload Immagine Promo ENG (Cloudinary)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "imageUrlEng")}
                        className="form-control"
                        disabled={uploadingImage}
                      />
                      {formData.imageUrlEng && (
                        <small className="text-success d-block mt-1 text-truncate">
                          URL: {formData.imageUrlEng}
                        </small>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-body-tertiary">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={uploadingImage}>
                    {uploadingImage ? "Upload in corso..." : "Salva Modifiche Pacchetto"}
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

export default Services;
