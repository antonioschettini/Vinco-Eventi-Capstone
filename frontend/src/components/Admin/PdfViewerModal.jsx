import { useState, useEffect, useRef, useCallback } from "react";
import "./PdfViewerModal.css";

// Caricatore asincrono di Mozilla PDF.js da CDN ufficiale con GlobalWorker
let pdfjsPromise = null;
function loadPdfJsLib() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js library non trovata dopo il caricamento"));
      }
    };
    script.onerror = () => reject(new Error("Errore nel caricamento di PDF.js da CDN"));
    document.head.appendChild(script);
  });

  return pdfjsPromise;
}

function PdfViewerModal({ isOpen, pdfBlobUrl, title, onClose }) {
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [autoFitWidth, setAutoFitWidth] = useState(true);

  const containerRef = useRef(null);
  const canvasRefs = useRef([]);
  const pdfDocRef = useRef(null);

  // Reset dello stato alla chiusura/apertura
  useEffect(() => {
    if (!isOpen) {
      setNumPages(0);
      setLoading(true);
      setError(null);
      pdfDocRef.current = null;
      canvasRefs.current = [];
    }
  }, [isOpen]);

  // Caricamento del documento PDF
  useEffect(() => {
    if (!isOpen || !pdfBlobUrl) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    loadPdfJsLib()
      .then((pdfjsLib) => {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfBlobUrl,
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
        });

        return loadingTask.promise;
      })
      .then((pdfDoc) => {
        if (!isMounted) return;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("[PdfViewer] Errore caricamento PDF:", err);
        setError("Impossibile caricare l'anteprima PDF inline.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfBlobUrl]);

  // Rendering delle pagine su Canvas ad alta risoluzione (HiDPI / Retina)
  const renderAllPages = useCallback(async () => {
    const pdfDoc = pdfDocRef.current;
    const container = containerRef.current;
    if (!pdfDoc || !container) return;

    const containerWidth = container.clientWidth - 32; // padding
    const dpr = window.devicePixelRatio || 1;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRefs.current[pageNum - 1];
        if (!canvas) continue;

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        let effectiveScale = scale;

        // Adatta automaticamente alla larghezza del container su mobile o se autoFitWidth è attivo
        if (autoFitWidth && containerWidth > 100) {
          effectiveScale = containerWidth / unscaledViewport.width;
          // Limita lo scale per non sgranare su desktop larghi
          effectiveScale = Math.min(effectiveScale, 1.8);
        }

        const viewport = page.getViewport({ scale: effectiveScale * dpr });
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (e) {
        console.warn(`[PdfViewer] Errore render pagina ${pageNum}:`, e);
      }
    }
  }, [scale, autoFitWidth]);

  useEffect(() => {
    if (!loading && numPages > 0) {
      renderAllPages();
    }
  }, [loading, numPages, scale, autoFitWidth, renderAllPages]);

  // Ricalcola il layout al ridimensionamento della finestra
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (autoFitWidth) {
        renderAllPages();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, autoFitWidth, renderAllPages]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setAutoFitWidth(false);
    setScale((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setAutoFitWidth(false);
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setAutoFitWidth(true);
    setScale(1.0);
  };

  return (
    <div
      className="modal fade show d-block pdf-viewer-modal-backdrop"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdfViewerModalTitle"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered pdf-viewer-dialog">
        <div className="modal-content h-100 border-0 shadow-2xl d-flex flex-column rounded-4 overflow-hidden bg-dark">
          {/* Header Principale */}
          <div className="modal-header bg-dark text-white border-bottom border-secondary border-opacity-25 py-2 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 min-w-0 overflow-hidden">
              <div className="bg-danger bg-opacity-25 p-2 rounded text-danger d-flex align-items-center justify-content-center">
                <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
              </div>
              <div className="min-w-0">
                <h6 className="modal-title fw-bold text-truncate mb-0 fs-6 text-white" id="pdfViewerModalTitle" title={title}>
                  {title || "Contratto PDF"}
                </h6>
                <small className="text-success d-flex align-items-center gap-1 font-monospace" style={{ fontSize: "0.75rem" }}>
                  <i className="bi bi-shield-check"></i> Documento Verificato &amp; Archiviato
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {pdfBlobUrl && (
                <>
                  <a
                    href={pdfBlobUrl}
                    download={title || "Contratto.pdf"}
                    className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                    title="Scarica file PDF sul dispositivo"
                  >
                    <i className="bi bi-download"></i>
                    <span className="d-none d-sm-inline">Scarica</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => window.open(pdfBlobUrl, "_blank")}
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                    title="Apri PDF in una nuova scheda del browser"
                  >
                    <i className="bi bi-box-arrow-up-right"></i>
                    <span className="d-none d-sm-inline">Nuova Scheda</span>
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Chiudi Anteprima"
              ></button>
            </div>
          </div>

          {/* Barra Strumenti Zoom & Pagine */}
          {!loading && !error && numPages > 0 && (
            <div className="pdf-toolbar py-1 px-3 bg-secondary bg-opacity-20 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between flex-wrap gap-2 text-white">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-dark border border-secondary text-secondary px-2 py-1 small">
                  <i className="bi bi-files me-1 text-success"></i>
                  {numPages} {numPages === 1 ? "Pagina" : "Pagine"}
                </span>
              </div>

              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="btn btn-sm btn-outline-light py-0 px-2"
                  title="Rimpicciolisci"
                  aria-label="Zoom Out"
                >
                  <i className="bi bi-dash-lg"></i>
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className={`btn btn-sm py-0 px-2 small ${autoFitWidth ? "btn-success" : "btn-outline-light"}`}
                  title="Adatta alla larghezza dello schermo"
                >
                  <i className="bi bi-arrows-expand me-1"></i>
                  <span>{autoFitWidth ? "Adatta" : `${Math.round(scale * 100)}%`}</span>
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="btn btn-sm btn-outline-light py-0 px-2"
                  title="Ingrandisci"
                  aria-label="Zoom In"
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              </div>
            </div>
          )}

          {/* Corpo Modale con Rendering Canvas Scrollabile */}
          <div
            ref={containerRef}
            className="modal-body p-3 flex-grow-1 overflow-auto pdf-canvas-container position-relative d-flex flex-column align-items-center"
          >
            {loading && (
              <div className="d-flex flex-column align-items-center justify-content-center my-auto py-5 text-center">
                <div className="spinner-border text-success mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
                  <span className="visually-hidden">Caricamento PDF...</span>
                </div>
                <h6 className="text-white fw-bold">Generazione Anteprima Documento in Corso...</h6>
                <p className="text-secondary small mb-0">Rendering ad alta fedeltà con supporto mobile touch.</p>
              </div>
            )}

            {error && (
              <div className="text-center my-auto py-5 text-white">
                <i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3 d-block"></i>
                <h6 className="fw-bold">{error}</h6>
                <p className="text-secondary small mb-3">Puoi comunque scaricare il documento o aprirlo direttamente.</p>
                <div className="d-flex justify-content-center gap-2">
                  {pdfBlobUrl && (
                    <a href={pdfBlobUrl} download={title || "Contratto.pdf"} className="btn btn-success btn-sm">
                      <i className="bi bi-download me-1"></i> Scarica PDF
                    </a>
                  )}
                  {pdfBlobUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(pdfBlobUrl, "_blank")}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-box-arrow-up-right me-1"></i> Apri in Nuova Scheda
                    </button>
                  )}
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="pdf-pages-wrapper d-flex flex-column align-items-center gap-3 w-100 py-2">
                {Array.from({ length: numPages }, (_, index) => (
                  <div key={index} className="pdf-page-card position-relative d-flex flex-column align-items-center">
                    <canvas
                      ref={(el) => (canvasRefs.current[index] = el)}
                      className="pdf-page-canvas shadow-lg rounded-2"
                    />
                    <span className="badge bg-dark bg-opacity-75 text-secondary border border-secondary border-opacity-50 mt-1 small">
                      Pagina {index + 1} di {numPages}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Modale */}
          <div className="modal-footer bg-dark border-top border-secondary border-opacity-25 py-2 px-3 d-flex justify-content-between align-items-center">
            <small className="text-secondary d-none d-md-block">
              Vinco Eventi • Visualizzatore Contratti Certificato Cross-Device
            </small>
            <button
              type="button"
              className="btn btn-sm btn-secondary px-4 rounded-pill ms-auto"
              onClick={onClose}
            >
              Chiudi Anteprima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PdfViewerModal;
