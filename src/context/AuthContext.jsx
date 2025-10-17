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

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Add axios interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

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
      // Clear user data on authentication failure
      setUser(null);
      // Clear any stale cookies or tokens
      if (error.response?.status === 401) {
        // Token is invalid, clear user state
        console.log("Authentication failed, clearing user data");
        // Clear any cached data
        localStorage.removeItem("recentSearches");
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
    checkAuth();
  }, []); // Empty dependency array - only run once on mount

  const login = async (email, password) => {
    try {
      const response = await api.post(API.AUTH.LOGIN, { email, password });

      if (response.data.user) {
        // Set the complete user object from the response
        setUser(response.data.user);
        // Also check auth status to ensure we have the latest user data
        await checkAuth();
        return { success: true };
      }

      return {
        success: false,
        message: response.data.message || "Login failed",
      };
    } catch (error) {
      console.error("Login error:", error);
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
    const isAuth = !!(user && user._id && user.email);
    console.log("isAuthenticated check:", {
      user: !!user,
      userId: user?._id,
      userEmail: user?.email,
      result: isAuth,
    });
    return isAuth;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isAuthenticated,
        checkAuth,
        updateUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
