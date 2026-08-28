import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import TrackModal from "./components/AudioPlayer/TrackModal";
import MobileBottomPlayer from "./components/AudioPlayer/MobileBottomPlayer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import EmailChoiceModal from "./components/EmailModal/EmailChoiceModal";
import MobileFloatingBar from "./components/MobileFloatingBar/MobileFloatingBar";
import ProtectedRoute from "./components/Admin/ProtectedRoute";
import ErrorBanner from "./components/ErrorBanner/ErrorBanner";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import { clearGlobalError } from "./redux/slices/uiSlice";
import { useSEO } from "./utils/useSEO";
import "./App.css";

// Import diretto delle pagine pubbliche per azzerare la latenza di navigazione (0ms switch)
import Home from "./pages/Home";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import About from "./pages/About";

// Lazy loading riservato all'area Admin
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminQuotes = lazy(() => import("./pages/AdminQuotes"));
const AdminAccounting = lazy(() => import("./pages/AdminAccounting"));
const AdminAudit = lazy(() => import("./pages/AdminAudit"));

// Import degli sfondi Hero per il precaricamento immediato in memoria GPU/browser
import homeHeroBg from "./assets/Vinco Eventi assets/assets immagini/Biografia HeroSection Dj colaluca bn.webp";
import servicesHeroBg from "./assets/Vinco Eventi assets/assets immagini/Footer Immagine consolle mani.webp";
import galleryHeroBg from "./assets/Vinco Eventi assets/assets immagini/dj colaluca.webp";
import aboutHeroBg from "./assets/Vinco Eventi assets/assets immagini/foto dj enzo colaluca.webp";
import footerHeroBg from "./assets/Vinco Eventi assets/assets immagini/Consolle e cuffia.webp";

// Layout base condiviso da tutte le pagine
function Layout() {
  useSEO();
  const location = useLocation();
  const dispatch = useDispatch();
  const globalError = useSelector((state) => state.ui.globalError);

  // Reset immediato dello scroll in cima alla pagina ad ogni cambio rotta per la massima reattività
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <TrackModal />
      <MobileBottomPlayer />
      <ScrollToTop />
      <EmailChoiceModal />
      <MobileFloatingBar />
      
      {/* Banner per errori/notifiche globali in alto */}
      {globalError && (
        <div className="container mt-3">
          <ErrorBanner
            message={globalError.message}
            type={globalError.type || "danger"}
            autoDismissMs={globalError.autoDismissMs || 0}
            onDismiss={() => dispatch(clearGlobalError())}
          />
        </div>
      )}

      <main className="flex-grow-1 d-flex flex-column">
        <Suspense fallback={<LoadingSpinner variant="fullPage" size="lg" message="Caricamento in corso..." />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const theme = useSelector((state) => state.ui.theme);

  // Precaricamento istantaneo di tutti gli sfondi Hero per eliminare qualsiasi lag visivo al cambio pagina
  useEffect(() => {
    const heroImages = [homeHeroBg, servicesHeroBg, galleryHeroBg, aboutHeroBg, footerHeroBg];
    heroImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Applica l'attributo data-bs-theme all'elemento html/body per attivare il Dark Mode di Bootstrap 5
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="servizi" element={<Services />} />
          <Route path="galleria" element={<Gallery />} />
          <Route path="chi-siamo" element={<About />} />
          <Route path="admin-enzo" element={<AdminLogin />} />
          <Route
            path="admin-enzo/preventivi"
            element={
              <ProtectedRoute>
                <AdminQuotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-enzo/agenda"
            element={
              <ProtectedRoute>
                <AdminAccounting />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-enzo/audit"
            element={
              <ProtectedRoute>
                <AdminAudit />
              </ProtectedRoute>
            }
          />
          {/* Rotta di fallback per reindirizzare a Home se il percorso non esiste */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
