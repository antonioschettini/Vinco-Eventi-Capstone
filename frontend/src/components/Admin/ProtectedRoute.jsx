import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || user?.role !== "ROLE_ADMIN") {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin-enzo?redirect=${redirectPath}`} state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
