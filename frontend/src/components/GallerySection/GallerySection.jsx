import { useState, useEffect } from "react";
import { Container, Row, Col, Carousel, Nav, Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import { galleryItems as staticGalleryItems } from "./galleryData";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";
import API_BASE_URL from "../../config/api";
import MediaModal from "../MediaModal/MediaModal";
import "./GallerySection.css";

function GallerySection() {
  const lang = useSelector((state) => state.ui.language);
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const t = translations[lang].gallery;

  const [dbItems, setDbItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  // Lightbox Modal State
  const [modalShow, setModalShow] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Admin CRUD Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [formData, setFormData] = useState({
    titleIta: "",
    titleEng: "",
    subtitleIta: "",
    subtitleEng: "",
    type: "image",
    src: "",
    category: "djset",
    featured: false,
    startTime: "",
    displayOrder: 1,
    publicId: "",
    posterUrl: "",
  });

  const fetchGalleryItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gallery`);
      if (response.ok) {
        const data = await response.json();
        setDbItems(data);
      }
    } catch {
      console.log("Database gallery non raggiungibile. Uso fallback locali per visualizzazione.");
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    const loadItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`);
        if (response.ok && isSubscribed) {
          const data = await response.json();
          setDbItems(data);
        }
      } catch {
        console.log("Database gallery non raggiungibile. Uso fallback locali per visualizzazione.");
      }
    };
    loadItems();
    return () => { isSubscribed = false; };
  }, []);

  // Formatta l'elenco dei media da renderizzare
  const rawList = dbItems.length > 0 ? dbItems : staticGalleryItems;

  const getItemSrc = (item) => {
    // DB items hanno sempre URL Cloudinary (https://...)
    if (item.src && item.src.startsWith("http")) {
      return item.src;
    }
    // Fallback: cerca nella lista statica per ID
    const staticMatch = staticGalleryItems.find((s) => s.id === item.id);
    return staticMatch ? staticMatch.src : item.src;
  };

  const allItems = rawList.map((item) => {
    const isEng = lang === "en";
    return {
      ...item,
      src: getItemSrc(item),
      title: isEng ? item.titleEng || item.titleIta || item.title : item.titleIta || item.title,
      subtitle: isEng ? item.subtitleEng || item.subtitleIta || item.subtitle : item.subtitleIta || item.subtitle,
    };
  });

  // Filter items based on active tab
  const filteredItems = allItems.filter((item) => {
    if (activeFilter === "photos") return item.type === "image";
    if (activeFilter === "videos") return item.type === "video";
    if (activeFilter === "featured") return item.featured;
    return true;
  });

  // Featured items for top carousel
  const featuredItems = allItems.filter((item) => item.featured);

  const handleCardClick = (index) => {
    setSelectedIndex(index);
    setModalShow(true);
  };

  const handleCarouselClick = (item) => {
    const foundIndex = filteredItems.findIndex((fi) => fi.id === item.id);
    if (foundIndex !== -1) {
      setSelectedIndex(foundIndex);
    } else {
      setActiveFilter("all");
      const indexInAll = allItems.findIndex((gi) => gi.id === item.id);
      setSelectedIndex(indexInAll >= 0 ? indexInAll : 0);
    }
    setModalShow(true);
  };

  // Handlers Admin CRUD
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      titleIta: "",
      titleEng: "",
      subtitleIta: "",
      subtitleEng: "",
      type: "image",
      src: "",
      category: "djset",
      featured: false,
      startTime: "",
      displayOrder: allItems.length + 1,
      publicId: "",
      posterUrl: "",
    });
    setShowAdminModal(true);
  };

  const handleOpenEditModal = (e, item) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormData({
      titleIta: item.titleIta || item.title || "",
      titleEng: item.titleEng || item.title || "",
      subtitleIta: item.subtitleIta || item.subtitle || "",
      subtitleEng: item.subtitleEng || item.subtitle || "",
      type: item.type || "image",
      src: item.src || "",
      category: item.category || "djset",
      featured: item.featured || false,
      startTime: item.startTime !== null && item.startTime !== undefined ? item.startTime : "",
      displayOrder: item.displayOrder || 1,
      publicId: item.publicId || "",
      posterUrl: item.posterUrl || "",
    });
    setShowAdminModal(true);
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMedia(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/gallery/upload-media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          src: data.url,
          publicId: data.publicId || prev.publicId,
          posterUrl: data.posterUrl || prev.posterUrl,
        }));
        alert("File multimediale caricato con successo!");
      } else {
        alert("Impossibile completare l'upload del file. Puoi comunque inserire o incollare l'URL della risorsa multimediale direttamente nel campo sottostante.");
      }
    } catch {
      alert("Errore di connessione durante l'upload multimediale. Puoi comunque inserire l'URL direttamente nel campo sottostante.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();

    if (!formData.src) {
      alert("Inserisci un URL o carica un file multimediale prima di salvare.");
      return;
    }

    const payload = {
      ...formData,
      startTime: formData.startTime !== "" ? parseFloat(formData.startTime) : null,
      displayOrder: parseInt(formData.displayOrder) || 1,
    };

    try {
      const isEdit = editingItem && editingItem.id && !String(editingItem.id).startsWith("v_") && !String(editingItem.id).startsWith("p_") && !String(editingItem.id).startsWith("v1");
      const url = isEdit
        ? `${API_BASE_URL}/api/admin/gallery/${editingItem.id}`
        : `${API_BASE_URL}/api/admin/gallery`;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowAdminModal(false);
        setEditingItem(null);
        fetchGalleryItems();
      } else {
        alert("Errore nel salvataggio dell'elemento della galleria.");
      }
    } catch {
      alert("Errore di connessione con il server backend.");
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t.confirmDeleteMedia)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/gallery/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        fetchGalleryItems();
      } else {
        alert("Impossibile eliminare l'elemento selezionato.");
      }
    } catch {
      alert("Errore di connessione durante l'eliminazione.");
    }
  };

  return (
    <section className="gallery-section py-5">
      <Container>
        {/* Admin Action Control Bar */}
        {isAuthenticated && (
          <div className="bg-success-subtle border border-success border-opacity-25 p-3 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <span className="fw-bold text-success d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock-fill fs-5"></i>
              {t.adminMode}
            </span>
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
            >
              <i className="bi bi-plus-circle-fill"></i>
              <span>{t.addMedia}</span>
            </button>
          </div>
        )}

        {/* Carosello In Evidenza */}
        {featuredItems.length > 0 && (
          <div className="carousel-highlight-container mb-5 p-3 p-md-4 rounded-4 position-relative">
            <div className="text-center mb-4">
              <h2 className="display-6 font-heading fw-bold text-body mb-2">
                {t.carouselTitle}
              </h2>
              <p className="font-body text-body-secondary mb-0 fs-6">
                {t.carouselSubtitle}
              </p>
            </div>

            <Carousel fade interval={4000} className="gallery-top-carousel rounded-4 overflow-hidden shadow">
              {featuredItems.map((item) => (
                <Carousel.Item
                  key={item.id}
                  onClick={() => handleCarouselClick(item)}
                  className="gallery-carousel-item cursor-pointer position-relative"
                >

                  <div className="carousel-media-wrapper">
                    {item.type === "video" ? (
                      <video
                        src={item.startTime ? `${getOptimizedCloudinaryUrl(item.src, { type: "grid" })}#t=${item.startTime}` : getOptimizedCloudinaryUrl(item.src, { type: "grid" })}
                        poster={item.posterUrl || getOptimizedCloudinaryUrl(item.src, { type: "poster" })}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="auto"
                        onLoadedMetadata={(e) => {
                          if (item.startTime && e.target) {
                            e.target.currentTime = item.startTime;
                          }
                        }}
                        className="carousel-media-content"
                      />
                    ) : (
                      <img
                        src={getOptimizedCloudinaryUrl(item.src, { type: "grid" })}
                        alt={item.title}
                        className="carousel-media-content"
                      />
                    )}
                    <div className="carousel-overlay-caption p-4">
                      <span className="badge bg-success px-3 py-2 rounded-pill mb-2">
                        {item.type === "video" ? t.videoBadge : t.photoBadge}
                      </span>
                      <h3 className="h3 font-heading text-white mb-1 fw-bold">
                        {item.title}
                      </h3>
                      <p className="text-white-50 fs-6 mb-0">{item.subtitle}</p>
                    </div>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        )}

        {/* Section Heading & Filters */}
        <div className="text-center mb-4">
          <h2 className="display-5 font-heading fw-bold text-body mb-3 gallery-title-line">
            {t.sectionTitle}
          </h2>
          <p className="font-body text-body-secondary fs-5 max-w-700 mx-auto">
            {t.sectionSubtitle}
          </p>

          {/* Filter Nav Tabs */}
          <Nav
            activeKey={activeFilter}
            onSelect={(selectedKey) => setActiveFilter(selectedKey)}
            className="gallery-filter-tabs justify-content-center mt-4 gap-2"
          >
            <Nav.Item>
              <Nav.Link eventKey="all" className="filter-btn rounded-pill px-4 py-2">
                <i className="bi bi-grid-fill me-2"></i>
                {t.filterAll} ({allItems.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="photos" className="filter-btn rounded-pill px-4 py-2">
                <i className="bi bi-camera-fill me-2"></i>
                {t.filterPhotos} ({allItems.filter((i) => i.type === "image").length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="videos" className="filter-btn rounded-pill px-4 py-2">
                <i className="bi bi-film me-2"></i>
                {t.filterVideos} ({allItems.filter((i) => i.type === "video").length})
              </Nav.Link>
            </Nav.Item>
            {isAuthenticated && (
              <Nav.Item>
                <Nav.Link eventKey="featured" className="filter-btn filter-btn-featured rounded-pill px-4 py-2">
                  <i className="bi bi-star-fill me-2 text-warning"></i>
                  {t.filterFeatured} ({allItems.filter((i) => i.featured).length})
                </Nav.Link>
              </Nav.Item>
            )}
          </Nav>
        </div>

        {/* Multimedia Grid */}
        <Row className="g-3 g-md-4">
          {filteredItems.map((item, index) => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <div
                className="gallery-card rounded-4 overflow-hidden position-relative"
                onClick={() => handleCardClick(index)}
              >
                {/* Admin action buttons overlay on card (Top-Right) */}
                {isAuthenticated && (
                  <div
                    className="position-absolute top-0 end-0 p-2 z-3 d-flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleOpenEditModal(e, item)}
                      className="btn btn-warning btn-sm py-1 px-2 fw-bold shadow"
                      title={t.editMedia}
                    >
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="btn btn-danger btn-sm py-1 px-2 shadow"
                      title={t.deleteMedia}
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </div>
                )}

                {/* Media Container */}
                <div className="gallery-media-wrapper">
                  {item.type === "video" ? (
                    <>
                      <video
                        src={item.startTime ? `${getOptimizedCloudinaryUrl(item.src, { type: "grid" })}#t=${item.startTime}` : getOptimizedCloudinaryUrl(item.src, { type: "grid" })}
                        poster={item.posterUrl || getOptimizedCloudinaryUrl(item.src, { type: "poster" })}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="auto"
                        onLoadedMetadata={(e) => {
                          if (item.startTime && e.target) {
                            e.target.currentTime = item.startTime;
                          }
                        }}
                        className="gallery-media-thumb"
                      />
                      <div className="play-icon-overlay">
                        <i className="bi bi-play-circle-fill"></i>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={getOptimizedCloudinaryUrl(item.src, { type: "grid" })}
                        alt={item.title}
                        className="gallery-media-thumb"
                        loading="lazy"
                      />
                      <div className="expand-icon-overlay">
                        <i className="bi bi-arrows-angle-expand"></i>
                      </div>
                    </>
                  )}

                  {/* Badge top-left (Foto/Video) */}
                  <span className="media-type-tag badge rounded-pill">
                    {item.type === "video" ? (
                      <>
                        <i className="bi bi-play-fill me-1"></i> {t.videoBadge}
                      </>
                    ) : (
                      <>
                        <i className="bi bi-image me-1"></i> {t.photoBadge}
                      </>
                    )}
                  </span>

                  {/* Badge "In Evidenza" - VISIBILE SOLO ALL'ADMIN in BASSO A DESTRA della card */}
                  {isAuthenticated && item.featured && (
                    <span className="badge badge-featured-admin rounded-pill position-absolute bottom-0 end-0 m-2 z-3 px-2 py-1">
                      <i className="bi bi-star-fill me-1"></i> {t.filterFeatured || "In Evidenza"}
                    </span>
                  )}

                  {/* Hover Info Bottom Bar */}
                  <div className="gallery-card-info p-3">
                    <h4 className="h6 font-heading text-white fw-bold mb-1 pe-4">
                      {item.title}
                    </h4>
                    <p className="small text-white-50 mb-0 pe-4">{item.subtitle}</p>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Lightbox Modal Window */}
        <MediaModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          items={filteredItems}
          currentIndex={selectedIndex}
          onNavigate={(newIndex) => setSelectedIndex(newIndex)}
        />

        {/* Admin Modal (Aggiungi / Modifica Foto e Video con Cloudinary) */}
        {showAdminModal && (
          <Modal
            show={showAdminModal}
            onHide={() => setShowAdminModal(false)}
            centered
            size="lg"
            className="admin-gallery-modal"
          >
            <Modal.Header closeButton className="bg-success text-white">
              <Modal.Title className="font-heading fw-bold">
                <i className="bi bi-pencil-square me-2"></i>
                {editingItem ? t.editMedia : t.addMedia}
              </Modal.Title>
            </Modal.Header>
            <form onSubmit={handleCreateOrUpdate}>
              <Modal.Body className="p-4">
                <Row className="g-3">
                  {/* Titoli ITA e ENG */}
                  <Col md={6}>
                    <label className="form-label fw-semibold">Titolo (ITA)*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.titleIta}
                      onChange={(e) => setFormData({ ...formData, titleIta: e.target.value })}
                      required
                      placeholder="es. DJ Set Exclusive Live"
                    />
                  </Col>
                  <Col md={6}>
                    <label className="form-label fw-semibold">Titolo (ENG)*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.titleEng}
                      onChange={(e) => setFormData({ ...formData, titleEng: e.target.value })}
                      required
                      placeholder="es. Exclusive Live DJ Set"
                    />
                  </Col>

                  {/* Sottotitoli ITA e ENG */}
                  <Col md={12}>
                    <label className="form-label fw-semibold">Sottotitolo (ITA)</label>
                    <textarea
                      rows="2"
                      className="form-control"
                      value={formData.subtitleIta}
                      onChange={(e) => setFormData({ ...formData, subtitleIta: e.target.value })}
                      placeholder="Descrizione del momento..."
                    />
                  </Col>
                  <Col md={12}>
                    <label className="form-label fw-semibold">Sottotitolo (ENG)</label>
                    <textarea
                      rows="2"
                      className="form-control"
                      value={formData.subtitleEng}
                      onChange={(e) => setFormData({ ...formData, subtitleEng: e.target.value })}
                      placeholder="Description of the moment..."
                    />
                  </Col>

                  {/* Tipo Media e Categoria */}
                  <Col md={6}>
                    <label className="form-label fw-semibold">{t.mediaTypeLabel}*</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="image">{t.mediaTypeImage}</option>
                      <option value="video">{t.mediaTypeVideo}</option>
                    </select>
                  </Col>
                  <Col md={6}>
                    <label className="form-label fw-semibold">Categoria</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="djset">DJ Set</option>
                      <option value="band">Live Band</option>
                      <option value="wedding">Matrimonio / Wedding</option>
                      <option value="lightshow">Service & Luci</option>
                      <option value="live">Live Show</option>
                      <option value="effects">Effetti Scenografici</option>
                    </select>
                  </Col>

                  {/* Upload Cloudinary & Direct URL */}
                  <Col md={12}>
                    <label className="form-label fw-semibold">{t.uploadCloudinary}</label>
                    <input
                      type="file"
                      accept={formData.type === "video" ? "video/*" : "image/*"}
                      onChange={handleMediaUpload}
                      className="form-control"
                      disabled={uploadingMedia}
                    />
                    {uploadingMedia && (
                      <small className="text-primary d-block mt-1">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t.uploading}
                      </small>
                    )}
                  </Col>

                  <Col md={12}>
                    <label className="form-label fw-semibold">URL Risorsa Multimediale (Cloudinary o Link Diretto)*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.src}
                      onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                      required
                      placeholder="https://res.cloudinary.com/... o link diretto"
                    />
                    <small className="text-muted d-block mt-1">
                      Si autocompila al caricamento del file oppure puoi incollare manualmente un qualsiasi URL multimediale diretto.
                    </small>
                  </Col>

                  {/* Video Start Time (Offset) & Display Order */}
                  {formData.type === "video" && (
                    <Col md={6}>
                      <label className="form-label fw-semibold">{t.startTimeLabel}</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        placeholder="es. 60 per iniziare a 1:00"
                      />
                    </Col>
                  )}

                  <Col md={formData.type === "video" ? 6 : 12}>
                    <label className="form-label fw-semibold">Ordine di Visualizzazione</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    />
                  </Col>

                  {/* Toggle Featured */}
                  <Col md={12}>
                    <div className="form-check form-switch mt-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="featuredSwitch"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      />
                      <label className="form-check-input-label fw-bold text-success ms-2" htmlFor="featuredSwitch">
                        <i className="bi bi-star-fill text-warning me-1"></i>
                        {t.featuredLabel}
                      </label>
                    </div>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer className="bg-body-tertiary">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdminModal(false)}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-success fw-bold"
                  disabled={uploadingMedia}
                >
                  {uploadingMedia ? t.uploading : t.saveMedia}
                </button>
              </Modal.Footer>
            </form>
          </Modal>
        )}
      </Container>
    </section>
  );
}

export default GallerySection;
