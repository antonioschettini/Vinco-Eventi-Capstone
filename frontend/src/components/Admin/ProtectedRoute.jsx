import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated || user?.role !== "ROLE_ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;
