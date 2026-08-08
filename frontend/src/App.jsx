import { useEffect } from "react";
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
import { clearGlobalError } from "./redux/slices/uiSlice";
import { useSEO } from "./utils/useSEO";
import "./App.css";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import About from "./pages/About";
import AdminLogin from "./pages/AdminLogin";
import AdminQuotes from "./pages/AdminQuotes";
import AdminAccounting from "./pages/AdminAccounting";

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
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const theme = useSelector((state) => state.ui.theme);

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
          {/* Rotta di fallback per reindirizzare a Home se il percorso non esiste */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
