import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import api, { handleApiError } from "../services/apiService";
import { API } from "../config/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Add axios interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Only handle 401 errors for protected routes
        if (
          error.response?.status === 401 &&
          error.config.url !== API.USER.ME
        ) {
          try {
            // Try to refresh the token
            await api.post(API.AUTH.REFRESH_TOKEN);
            // Retry the original request
            return api(error.config);
          } catch (refreshError) {
            // If refresh fails, clear user and redirect to login
            setUser(null);
            navigate("/login");
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
      setLoading(true);
      const response = await api.get(API.USER.ME);
      if (response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
      console.log(user);
    } catch (error) {
      // Don't treat auth check failure as an error
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth status in the background
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear user and redirect
      setUser(null);
      navigate("/login");
    }
  };

  const isAuthenticated = () => {
    return !!user;
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
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
