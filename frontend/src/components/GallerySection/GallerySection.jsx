import { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Carousel, Nav, Modal, Dropdown } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { translations, getCategoryLabel } from "../../utils/translations";
import { galleryItems as staticGalleryItems } from "./galleryData";
import { getOptimizedCloudinaryUrl } from "../../utils/cloudinary";
import API_BASE_URL from "../../config/api";
import { authApiFetch } from "../../utils/apiClient";
import MediaModal from "../MediaModal/MediaModal";
import imageCompression from "browser-image-compression";
import "./GallerySection.css";

// Componente helper per la riproduzione on-demand dei video in griglia:
// Mostra la copertina WebP/JPG ad alta definizione per azzerare il consumo di banda iniziale (Mobile & Desktop).
// Su Desktop attiva una fluida video-preview muta all'hover del mouse (onMouseEnter).
// Su Mobile/Touch apre istantaneamente il Lightbox al tocco a piena risoluzione.
function LazyGridVideo({ src, posterUrl, item, className }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  const poster =
    posterUrl ||
    (src && !src.startsWith("http")
      ? src
      : getOptimizedCloudinaryUrl(src, { type: "poster" }));

  if (hasError || !src) {
    return (
      <img
        src={poster}
        alt={item.title}
        className={className}
        loading="lazy"
      />
    );
  }

  const videoSrc = item.startTime
    ? `${getOptimizedCloudinaryUrl(src, { type: "grid" })}#t=${item.startTime}`
    : getOptimizedCloudinaryUrl(src, { type: "grid" });

  return (
    <div
      className="grid-video-preview-wrapper w-100 h-100 position-relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={poster}
        alt={item.title}
        className={`${className} ${isHovered ? "d-none" : "d-block"}`}
        loading="lazy"
      />
      {isHovered && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          onError={() => setHasError(true)}
          onLoadedMetadata={(e) => {
            if (item.startTime && e.target) {
              e.target.currentTime = item.startTime;
            }
          }}
          className={className}
        />
      )}
    </div>
  );
}

function GallerySection() {
  const dispatch = useDispatch();
  const lang = useSelector((state) => state.ui.language);
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const t = translations[lang].gallery;

  const [dbItems, setDbItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(8);

  const handleFilterSelect = (selectedKey) => {
    setActiveFilter(selectedKey);
    setVisibleCount(8);
  };

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey || "all");
    setVisibleCount(8);
  };

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
    const isFallback = item.isFallback || (!dbItems.length && item.src && item.src.includes("vinco_eventi_galleria"));
    return {
      ...item,
      isFallback,
      src: getItemSrc(item),
      title: isEng ? item.titleEng || item.titleIta || item.title : item.titleIta || item.title,
      subtitle: isEng ? item.subtitleEng || item.subtitleIta || item.subtitle : item.subtitleIta || item.subtitle,
    };
  });

  // Unique category keys for filter options (solamente le categorie valide attive)
  const validCategories = ["djset", "band", "wedding", "lightshow", "live", "effects"];
  const categoryKeys = Array.from(
    new Set(
      allItems
        .map((i) => i.category)
        .filter((c) => c && validCategories.includes(c))
    )
  );

  const getCategoryCount = (catKey) => {
    return allItems.filter((i) => {
      if (i.category !== catKey) return false;
      if (activeFilter === "photos") return i.type === "image";
      if (activeFilter === "videos") return i.type === "video";
      if (activeFilter === "featured") return i.featured;
      return true;
    }).length;
  };

  // Filter items based on active type tab and active category
  const filteredItems = allItems.filter((item) => {
    if (activeFilter === "photos" && item.type !== "image") return false;
    if (activeFilter === "videos" && item.type !== "video") return false;
    if (activeFilter === "featured" && !item.featured) return false;
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    return true;
  });

  // Batch paginated items for smooth 8-at-a-time grid rendering
  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMoreItems = filteredItems.length > visibleCount;
  const remainingCount = filteredItems.length - visibleCount;

  // Featured items for top carousel
  const featuredItems = allItems.filter((item) => item.featured);

  // State per l'indice attivo del Carosello "Momenti in Evidenza"
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Monitoraggio della visibilità del Carosello Top per azzerare lo streaming video se l'utente scorre in basso
  const carouselContainerRef = useRef(null);
  const [isCarouselInView, setIsCarouselInView] = useState(true);

  useEffect(() => {
    const target = carouselContainerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsCarouselInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, []);

  // Pre-caricamento in sottofondo delle copertine/poster HD delle slide adiacenti nel carosello
  useEffect(() => {
    if (!featuredItems || featuredItems.length <= 1) return;

    const nextItem = featuredItems[(carouselIndex + 1) % featuredItems.length];
    const prevItem = featuredItems[(carouselIndex - 1 + featuredItems.length) % featuredItems.length];

    const nextPoster = nextItem.posterUrl || getOptimizedCloudinaryUrl(nextItem.src, { type: "poster" });
    const prevPoster = prevItem.posterUrl || getOptimizedCloudinaryUrl(prevItem.src, { type: "poster" });

    if (nextPoster) {
      const imgNext = new Image();
      imgNext.src = nextPoster;
    }
    if (prevPoster) {
      const imgPrev = new Image();
      imgPrev.src = prevPoster;
    }
  }, [carouselIndex, featuredItems]);

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
    let fileToUpload = file;

    if (file.type && file.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        };
        fileToUpload = await imageCompression(file, options);
      } catch (compressionErr) {
        console.warn("Impossibile comprimere l'immagine nel client, uso del file originale:", compressionErr);
      }
    }

    const uploadData = new FormData();
    uploadData.append("file", fileToUpload);

    try {
      const data = await authApiFetch(
        `${API_BASE_URL}/api/admin/gallery/upload-media`,
        {
          method: "POST",
          body: uploadData,
        },
        token,
        dispatch
      );

      if (data?.url) {
        setFormData((prev) => ({
          ...prev,
          src: data.url,
          publicId: data.publicId || prev.publicId,
          posterUrl: data.posterUrl || prev.posterUrl,
        }));
        alert("File multimediale caricato con successo!");
      }
    } catch (err) {
      alert(err.message || "Impossibile completare l'upload del file.");
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

    let finalPosterUrl = formData.posterUrl;
    if (!finalPosterUrl && formData.type === "video" && formData.src) {
      finalPosterUrl = getOptimizedCloudinaryUrl(formData.src, { type: "poster" });
    }

    const payload = {
      ...formData,
      posterUrl: finalPosterUrl,
      startTime: formData.startTime !== "" ? parseFloat(formData.startTime) : null,
      displayOrder: parseInt(formData.displayOrder) || 1,
    };

    try {
      const isEdit = editingItem && editingItem.id && !String(editingItem.id).startsWith("v_") && !String(editingItem.id).startsWith("p_") && !String(editingItem.id).startsWith("v1");
      const url = isEdit
        ? `${API_BASE_URL}/api/admin/gallery/${editingItem.id}`
        : `${API_BASE_URL}/api/admin/gallery`;
      const method = isEdit ? "PUT" : "POST";

      await authApiFetch(
        url,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        token,
        dispatch
      );

      setShowAdminModal(false);
      setEditingItem(null);
      fetchGalleryItems();
    } catch (err) {
      alert(err.message || "Errore nel salvataggio dell'elemento della galleria.");
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t.confirmDeleteMedia)) return;

    try {
      await authApiFetch(
        `${API_BASE_URL}/api/admin/gallery/${id}`,
        { method: "DELETE" },
        token,
        dispatch
      );
      fetchGalleryItems();
    } catch (err) {
      alert(err.message || "Errore di connessione durante l'eliminazione.");
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
          <div
            ref={carouselContainerRef}
            className="carousel-highlight-container mb-5 p-3 p-md-4 rounded-4 position-relative"
          >
            <div className="text-center mb-4">
              <h2 className="display-6 font-heading fw-bold text-body mb-2">
                {t.carouselTitle}
              </h2>
              <p className="font-body text-body-secondary mb-0 fs-6">
                {t.carouselSubtitle}
              </p>
            </div>

            <Carousel
              activeIndex={carouselIndex}
              onSelect={(idx) => setCarouselIndex(idx)}
              fade
              interval={4000}
              className="gallery-top-carousel rounded-4 overflow-hidden shadow"
              prevIcon={
                <div className="gallery-carousel-nav-btn prev" aria-hidden="true">
                  <i className="bi bi-chevron-left"></i>
                </div>
              }
              nextIcon={
                <div className="gallery-carousel-nav-btn next" aria-hidden="true">
                  <i className="bi bi-chevron-right"></i>
                </div>
              }
            >
              {featuredItems.map((item, idx) => {
                const isActive = idx === carouselIndex;
                const itemPoster = item.posterUrl || getOptimizedCloudinaryUrl(item.src, { type: "poster" });

                return (
                  <Carousel.Item
                    key={item.id}
                    onClick={() => handleCarouselClick(item)}
                    className="gallery-carousel-item cursor-pointer position-relative"
                  >
                    <div className="carousel-media-wrapper">
                      {item.type === "video" ? (
                        isActive && isCarouselInView ? (
                          <video
                            src={item.startTime ? `${getOptimizedCloudinaryUrl(item.src, { type: "carousel" })}#t=${item.startTime}` : getOptimizedCloudinaryUrl(item.src, { type: "carousel" })}
                            poster={itemPoster}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              if (item.startTime && e.target) {
                                e.target.currentTime = item.startTime;
                              }
                            }}
                            onCanPlay={(e) => {
                              if (item.startTime && e.target && e.target.currentTime < item.startTime) {
                                e.target.currentTime = item.startTime;
                              }
                              if (e.target && e.target.paused) {
                                e.target.play().catch(() => {});
                              }
                            }}
                            className="carousel-media-content"
                          />
                        ) : (
                          <img
                            src={itemPoster}
                            alt={item.title}
                            className="carousel-media-content"
                          />
                        )
                      ) : (
                        <img
                          src={itemPoster}
                          alt={item.title}
                          className="carousel-media-content"
                        />
                      )}
                      {/* Badge fissati in alto per non oscurare il video */}
                      <div className="carousel-top-badges">
                        <span className="badge bg-success px-3 py-2 rounded-pill">
                          {item.type === "video" ? t.videoBadge : t.photoBadge}
                        </span>
                        {item.category && (
                          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold">
                            <i className="bi bi-tag-fill me-1"></i>
                            {getCategoryLabel(item.category, lang)}
                          </span>
                        )}
                      </div>

                      <div className="carousel-overlay-caption">
                        <h3 className="carousel-overlay-title">
                          {item.title}
                        </h3>
                        <p className="carousel-overlay-subtitle">{item.subtitle}</p>
                      </div>
                    </div>
                  </Carousel.Item>
                );
              })}
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

          {/* Filter Nav Tabs & Category Dropdown */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 mt-4">
            <Nav
              activeKey={activeFilter}
              onSelect={handleFilterSelect}
              className="gallery-filter-tabs gap-2"
            >
              <Nav.Item>
                <Nav.Link eventKey="all" className="filter-btn rounded-pill px-4 py-2">
                  <i className="bi bi-grid-fill me-2"></i>
                  {t.filterAll} ({allItems.filter((i) => selectedCategory === "all" || i.category === selectedCategory).length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="photos" className="filter-btn rounded-pill px-4 py-2">
                  <i className="bi bi-camera-fill me-2"></i>
                  {t.filterPhotos} ({allItems.filter((i) => i.type === "image" && (selectedCategory === "all" || i.category === selectedCategory)).length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="videos" className="filter-btn rounded-pill px-4 py-2">
                  <i className="bi bi-film me-2"></i>
                  {t.filterVideos} ({allItems.filter((i) => i.type === "video" && (selectedCategory === "all" || i.category === selectedCategory)).length})
                </Nav.Link>
              </Nav.Item>
              {isAuthenticated && (
                <Nav.Item>
                  <Nav.Link eventKey="featured" className="filter-btn filter-btn-featured rounded-pill px-4 py-2">
                    <i className="bi bi-star-fill me-2 text-warning"></i>
                    {t.filterFeatured} ({allItems.filter((i) => i.featured && (selectedCategory === "all" || i.category === selectedCategory)).length})
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>

            {/* Pulsante/Dropdown per filtro per Categoria */}
            <Dropdown onSelect={handleCategorySelect} className="category-filter-dropdown">
              <Dropdown.Toggle
                variant={selectedCategory !== "all" ? "success" : "outline-secondary"}
                className={`filter-btn filter-category-btn rounded-pill px-4 py-2 border d-inline-flex align-items-center gap-2 ${
                  selectedCategory !== "all" ? "active-category-btn" : ""
                }`}
              >
                <i className="bi bi-funnel-fill text-warning"></i>
                <span>
                  {selectedCategory === "all"
                    ? (t.filterByCategory || "Filtra per Categoria")
                    : `${getCategoryLabel(selectedCategory, lang)}`}
                </span>
                {selectedCategory !== "all" && (
                  <span
                    className="badge bg-white text-dark rounded-circle ms-1 px-1 py-0 fs-7 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory("all");
                      setVisibleCount(8);
                    }}
                    title="Rimuovi filtro categoria"
                  >
                    ✕
                  </span>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu className="category-dropdown-menu rounded-4 shadow-lg border-0 p-2">
                <Dropdown.Item
                  eventKey="all"
                  active={selectedCategory === "all"}
                  className="rounded-3 py-2 px-3 d-flex justify-content-between align-items-center"
                >
                  <span>
                    <i className="bi bi-grid-3x3-gap-fill me-2 text-success"></i>
                    {t.allCategories || "Tutte le Categorie"}
                  </span>
                  <span className="badge bg-dark-subtle text-body rounded-pill ms-2">
                    {allItems.filter((i) => {
                      if (activeFilter === "photos") return i.type === "image";
                      if (activeFilter === "videos") return i.type === "video";
                      if (activeFilter === "featured") return i.featured;
                      return true;
                    }).length}
                  </span>
                </Dropdown.Item>
                <Dropdown.Divider />
                {categoryKeys.map((catKey) => {
                  const count = getCategoryCount(catKey);
                  return (
                    <Dropdown.Item
                      key={catKey}
                      eventKey={catKey}
                      active={selectedCategory === catKey}
                      className="rounded-3 py-2 px-3 d-flex justify-content-between align-items-center"
                    >
                      <span>
                        <i className="bi bi-tag-fill me-2 text-warning fs-7"></i>
                        {getCategoryLabel(catKey, lang)}
                      </span>
                      <span className="badge bg-dark-subtle text-body rounded-pill ms-2">
                        {count}
                      </span>
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Zero state se nessun elemento soddisfa entrambi i filtri */}
        {filteredItems.length === 0 && (
          <div className="text-center py-5 my-4 bg-body-tertiary rounded-4 border p-4">
            <i className="bi bi-funnel text-muted display-4 mb-3 d-block"></i>
            <h4 className="h5 fw-bold font-heading text-body mb-2">Nessun media trovato</h4>
            <p className="text-body-secondary font-body small mb-3">
              Non ci sono elementi che soddisfano contemporaneamente i filtri selezionati.
            </p>
            <button
              onClick={() => {
                setActiveFilter("all");
                setSelectedCategory("all");
                setVisibleCount(8);
              }}
              className="btn btn-outline-success rounded-pill px-4 py-2 fw-semibold"
            >
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Ripristina Tutti i Filtri
            </button>
          </div>
        )}

        {/* Multimedia Grid */}
        <Row className="g-3 g-md-4">
          {visibleItems.map((item, index) => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <div
                className="gallery-card rounded-4 overflow-hidden position-relative"
                onClick={() => handleCardClick(index)}
              >
                {/* Admin action buttons overlay on card (Top-Right) */}
                {isAuthenticated && (
                  <div
                    className="admin-action-btns position-absolute top-0 end-0 p-2 z-4 d-flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleOpenEditModal(e, item)}
                      className="btn btn-warning btn-sm py-1 px-2 fw-bold shadow-sm rounded-2"
                      title={t.editMedia}
                    >
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="btn btn-danger btn-sm py-1 px-2 shadow-sm rounded-2"
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
                      <LazyGridVideo
                        src={item.src}
                        posterUrl={item.posterUrl}
                        item={item}
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

                  {/* Badges Top-Left (Foto/Video + Categoria) */}
                  <div
                    className={`card-badges-container position-absolute top-0 start-0 m-2 z-2 d-flex flex-wrap gap-1 align-items-center ${
                      isAuthenticated ? "has-admin-btns" : ""
                    }`}
                  >
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

                    {item.category && (
                      <span className="media-category-tag badge rounded-pill">
                        <i className="bi bi-tag-fill me-1 text-warning"></i>
                        {getCategoryLabel(item.category, lang)}
                      </span>
                    )}
                  </div>

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

        {/* Pulsante "Mostra Altri Media" (Paginazione batch da 8) */}
        {hasMoreItems && (
          <div className="text-center mt-5">
            <button
              onClick={() => setVisibleCount((prev) => prev + 8)}
              className="btn btn-load-more rounded-pill px-4 py-3 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-down-circle-fill fs-5"></i>
              <span>{t.loadMore || "Mostra Altri Media"}</span>
              <span className="badge bg-success text-white rounded-pill ms-2 px-2 py-1 fs-7">
                +{remainingCount} {t.remainingMedia || "rimanenti"}
              </span>
            </button>
            <div className="text-body-secondary small mt-2 font-body">
              {t.showingCounter || "Visualizzati"} {visibleItems.length} {t.of || "di"} {filteredItems.length}
            </div>
          </div>
        )}

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
