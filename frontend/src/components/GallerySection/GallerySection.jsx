import { useState } from "react";
import { Container, Row, Col, Carousel, Nav } from "react-bootstrap";
import { useSelector } from "react-redux";
import { translations } from "../../utils/translations";
import { galleryItems } from "./galleryData";
import MediaModal from "../MediaModal/MediaModal";
import "./GallerySection.css";

function GallerySection() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].gallery;

  const [activeFilter, setActiveFilter] = useState("all");
  const [modalShow, setModalShow] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items based on active tab
  const filteredItems = galleryItems.filter((item) => {
    if (activeFilter === "photos") return item.type === "image";
    if (activeFilter === "videos") return item.type === "video";
    return true;
  });

  // Featured items for top carousel
  const featuredItems = galleryItems.filter((item) => item.featured);

  const handleCardClick = (index) => {
    setSelectedIndex(index);
    setModalShow(true);
  };

  const handleCarouselClick = (item) => {
    const foundIndex = filteredItems.findIndex((fi) => fi.id === item.id);
    if (foundIndex !== -1) {
      setSelectedIndex(foundIndex);
    } else {
      // If currently filtered out, switch to all and open
      setActiveFilter("all");
      const indexInAll = galleryItems.findIndex((gi) => gi.id === item.id);
      setSelectedIndex(indexInAll >= 0 ? indexInAll : 0);
    }
    setModalShow(true);
  };

  return (
    <section className="gallery-section py-5">
      <Container>
        {/* Carosello In Evidenza */}
        <div className="carousel-highlight-container mb-5 p-3 p-md-4 rounded-4">
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
                className="gallery-carousel-item cursor-pointer"
              >
                <div className="carousel-media-wrapper">
                  {item.type === "video" ? (
                    <video
                      src={item.src}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="carousel-media-content"
                    />
                  ) : (
                    <img
                      src={item.src}
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
                {t.filterAll} ({galleryItems.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="photos" className="filter-btn rounded-pill px-4 py-2">
                <i className="bi bi-camera-fill me-2"></i>
                {t.filterPhotos} ({galleryItems.filter((i) => i.type === "image").length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="videos" className="filter-btn rounded-pill px-4 py-2">
                <i className="bi bi-film me-2"></i>
                {t.filterVideos} ({galleryItems.filter((i) => i.type === "video").length})
              </Nav.Link>
            </Nav.Item>
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
                {/* Media Container with controlled vertical aspect ratio */}
                <div className="gallery-media-wrapper">
                  {item.type === "video" ? (
                    <>
                      <video
                        src={item.src}
                        muted
                        loop
                        playsInline
                        autoPlay
                        className="gallery-media-thumb"
                      />
                      {/* Play Icon Badge overlay for video */}
                      <div className="play-icon-overlay">
                        <i className="bi bi-play-circle-fill"></i>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={item.src}
                        alt={item.title}
                        className="gallery-media-thumb"
                        loading="lazy"
                      />
                      {/* Expand Icon Badge overlay for photo */}
                      <div className="expand-icon-overlay">
                        <i className="bi bi-arrows-angle-expand"></i>
                      </div>
                    </>
                  )}
                  
                  {/* Badge top-left */}
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

                  {/* Hover Info Bottom Bar */}
                  <div className="gallery-card-info p-3">
                    <h4 className="h6 font-heading text-white fw-bold mb-1">
                      {item.title}
                    </h4>
                    <p className="small text-white-50 mb-0">{item.subtitle}</p>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Modal Window */}
        <MediaModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          items={filteredItems}
          currentIndex={selectedIndex}
          onNavigate={(newIndex) => setSelectedIndex(newIndex)}
        />
      </Container>
    </section>
  );
}

export default GallerySection;
