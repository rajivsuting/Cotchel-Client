import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/apiService";
import { API } from "../config/api";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setTokenValid(false);
      toast.error("Invalid reset link");
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const response = await api.post(API.AUTH.RESET_PASSWORD, {
        token,
        password: formData.password,
      });

      if (response.data.message) {
        toast.success("Password reset successful!");
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
  };

  const handleConfirmPasswordToggle = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  if (!tokenValid) {
    return (
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex flex-col md:flex-row bg-transparent gap-6 md:gap-12 items-start">
            {/* Left: Image */}
            <div className="md:w-1/2 w-full flex flex-col items-center justify-center">
              <img
                src="/signup3.png"
                alt="Invalid link illustration"
                className="w-full"
                draggable="false"
              />
            </div>
            {/* Right: Error Message */}
            <div className="md:w-1/2 w-full flex flex-col justify-center px-4 sm:px-8 py-8 md:py-0">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiLock className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Invalid Reset Link
                </h2>
                <p className="text-gray-600 mb-6">
                  The password reset link is invalid or has expired.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Please request a new password reset link.
                </p>
                <Link
                  to="/request-reset"
                  className="block w-full bg-[#0D0B46] text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-10 min-h-screen">
      <div className="w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex flex-col md:flex-row bg-transparent gap-6 md:gap-12 items-start">
          {/* Left: Image */}
          <div className="md:w-1/2 w-full flex flex-col items-center justify-center">
            <img
              src="/signup3.png"
              alt="Reset password illustration"
              className="w-full"
              draggable="false"
            />
          </div>
          {/* Right: Form */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-4 sm:px-8 py-8 md:py-0">
            <h2 className="text-2xl font-bold text-left mb-2">
              Reset Your Password
            </h2>
            <p className="text-gray-600 mb-6">Enter your new password below.</p>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                    errors.password ? "ring-2 ring-red-400" : ""
                  }`}
                  placeholder="Enter your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                    errors.confirmPassword ? "ring-2 ring-red-400" : ""
                  }`}
                  placeholder="Confirm your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleConfirmPasswordToggle}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              {errors.submit && (
                <p className="text-xs text-red-500">{errors.submit}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0D0B46] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-[#0D0B46] hover:underline cursor-pointer"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
