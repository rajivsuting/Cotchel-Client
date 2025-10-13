import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute check:", {
    loading,
    isAuthenticated: isAuthenticated(),
    user: user,
    userRole: user?.role,
    lastActiveRole: user?.lastActiveRole,
    allowedRoles,
    pathname: location.pathname,
  });

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D0B46]"></div>
      </div>
    );
  }

  // Only redirect to login if we're not loading and not authenticated
  if (!loading && !isAuthenticated()) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified, only allow access for those roles
  // Check both user.role and user.lastActiveRole
  const userRole = user?.role || user?.lastActiveRole;
  console.log("ProtectedRoute: Role check:", {
    userRole,
    allowedRoles,
    isAllowed: allowedRoles ? allowedRoles.includes(userRole) : true,
  });

  if (allowedRoles && user && !allowedRoles.includes(userRole)) {
    console.log("ProtectedRoute: Role not allowed, redirecting to home");
    // Redirect to home for unauthorized access
    return <Navigate to="/" replace />;
  }

  console.log("ProtectedRoute: Access granted");
  return children;
};

export const NotSellerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D0B46]"></div>
      </div>
    );
  }

  if (user && user.role === "Seller") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
