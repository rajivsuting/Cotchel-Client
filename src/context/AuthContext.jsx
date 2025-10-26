import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCartItems, setCartCount } from "../redux/slices/cartSlice";
import api, { handleApiError } from "../services/apiService";
import { API } from "../config/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error(
      "useAuth: AuthContext is undefined. Make sure the component is wrapped in AuthProvider"
    );
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Add axios interceptor for handling 401/403 errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle account deactivation/deletion errors
        if (error.response?.status === 403 || error.response?.status === 401) {
          const errorData = error.response.data;
          if (
            errorData.code === "ACCOUNT_DEACTIVATED" ||
            errorData.code === "ACCOUNT_DELETED" ||
            errorData.code === "ADMIN_ACCOUNT_DEACTIVATED" ||
            errorData.code === "ADMIN_ACCOUNT_DELETED"
          ) {
            // Clear user session and redirect to login
            setUser(null);
            if (window.location.pathname !== "/login") {
              navigate("/login", {
                state: {
                  from: window.location.pathname,
                  error: errorData.message,
                },
              });
            }
            return Promise.reject(error);
          }
        }

        // Only handle 401 errors for protected routes, and avoid infinite loops
        if (
          error.response?.status === 401 &&
          error.config.url !== API.USER.ME &&
          error.config.url !== API.AUTH.REFRESH_TOKEN &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            await api.post(API.AUTH.REFRESH_TOKEN);
            // Retry the original request
            return api(originalRequest);
          } catch (refreshError) {
            // If refresh fails, clear user and redirect to login only if we're not already on login page
            if (window.location.pathname !== "/login") {
              setUser(null);
              navigate("/login", { state: { from: window.location.pathname } });
            }
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    try {
      console.log("checkAuth: Starting auth check...");
      setLoading(true);
      const response = await api.get(API.USER.ME);
      console.log("checkAuth: API response:", response.data);
      if (response.data.user) {
        console.log("checkAuth: Setting user data:", response.data.user);
        setUser(response.data.user);
      } else {
        console.log("checkAuth: No user in response, clearing user");
        setUser(null);
      }
    } catch (error) {
      console.log("checkAuth: Error occurred:", error);
      console.log("checkAuth: Error status:", error.response?.status);
      // Only clear user data on explicit 401 (unauthorized) errors
      // Don't clear on network errors or other issues
      if (error.response?.status === 401) {
        console.log("Authentication failed (401), clearing user data");
        setUser(null);
        // Clear any cached data
        localStorage.removeItem("recentSearches");
      } else {
        // For other errors (network issues, 500, etc.), keep existing user state if any
        console.log("Non-auth error, keeping existing user state");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Check auth status only on initial mount
  useEffect(() => {
    if (!initialCheckDone) {
      checkAuth().then(() => {
        setInitialCheckDone(true);
      });
    }
  }, []); // Empty dependency array - only run once on mount

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post(API.AUTH.LOGIN, { email, password });

      if (response.data.user) {
        // Set the complete user object from the response
        console.log("Login successful, setting user:", response.data.user);
        setUser(response.data.user);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return {
        success: false,
        message: response.data.message || "Login failed",
      };
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);

      // Handle specific error cases
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.code === "ACCOUNT_DEACTIVATED") {
          // Clear user session and redirect to login
          setUser(null);
          return {
            success: false,
            message:
              errorData.message ||
              "Your account has been deactivated. Please contact support.",
            type: "account_deactivated",
          };
        }
      }

      if (error.response?.status === 401) {
        const errorData = error.response.data;
        if (errorData.code === "ACCOUNT_DELETED") {
          // Clear user session and redirect to login
          setUser(null);
          return {
            success: false,
            message:
              errorData.message ||
              "Your account has been deleted. Please contact support.",
            type: "account_deleted",
          };
        }
      }

      return {
        success: false,
        message: handleApiError(error),
      };
    }
  };

  const logout = async () => {
    try {
      await api.post(API.AUTH.LOGOUT);
      setUser(null);
      // Clear cart data from Redux when logging out
      dispatch(setCartItems([]));
      dispatch(setCartCount(0));
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear user and redirect
      setUser(null);
      // Clear cart data from Redux when logging out (even on error)
      dispatch(setCartItems([]));
      dispatch(setCartCount(0));
      navigate("/login");
    }
  };

  const isAuthenticated = () => {
    // Check if user exists and has required fields
    const isAuth = !!(user && user._id);
    console.log("isAuthenticated check:", {
      user: !!user,
      userId: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      loading,
      result: isAuth,
    });
    return isAuth;
  };

  const contextValue = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated,
    checkAuth,
    updateUser,
    loading,
  };

  // Debug log to ensure all values are defined
  console.log("AuthProvider: Providing context values:", {
    user: !!user,
    setUser: typeof setUser,
    login: typeof login,
    logout: typeof logout,
    isAuthenticated: typeof isAuthenticated,
    checkAuth: typeof checkAuth,
    updateUser: typeof updateUser,
    loading: typeof loading,
  });

  // Always provide the context - let components handle undefined values

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
