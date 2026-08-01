import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import TrackModal from "./components/AudioPlayer/TrackModal";
import MobileBottomPlayer from "./components/AudioPlayer/MobileBottomPlayer";
import ProtectedRoute from "./components/Admin/ProtectedRoute";
import { useSEO } from "./utils/useSEO";
import "./App.css";

// Lazy loading delle pagine per Code Splitting e massimizzazione del punteggio Lighthouse Performance
const Home = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const Gallery = lazy(() => import("./pages/Gallery"));
const About = lazy(() => import("./pages/About"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminQuotes = lazy(() => import("./pages/AdminQuotes"));

// Componente di caricamento elegante per le rotte lazy
function PageLoader() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5 my-5 flex-grow-1" style={{ minHeight: "50vh" }}>
      <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}>
        <span className="visually-hidden">Caricamento...</span>
      </div>
    </div>
  );
}

// Layout base condiviso da tutte le pagine
function Layout() {
  useSEO();

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <TrackModal />
      <MobileBottomPlayer />
      <main className="flex-grow-1 d-flex flex-column">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
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
          <Route path="admin" element={<AdminLogin />} />
          <Route
            path="admin/preventivi"
            element={
              <ProtectedRoute>
                <AdminQuotes />
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
