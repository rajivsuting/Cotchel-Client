import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import api from "../services/apiService";
import { API } from "../config/api";

export const googleAuth = (code) =>
  api.get(`${API.AUTH.GOOGLE_SIGNIN}?code=${code}`);
export const updateUserDetails = (userId, details) =>
  api.put(API.USER.UPDATE_DETAILS, { userId, ...details });

const CompleteProfileModal = ({ user, onComplete }) => {
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
    if (value.length !== 10) {
      setPhoneError("Phone number must be 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!phone || !gender) {
      setError("Please fill in all required fields.");
      return;
    }
    if (phone.length !== 10) {
      setPhoneError("Phone number must be 10 digits");
      return;
    }
    setLoading(true);
    try {
      await updateUserDetails(user._id, { phoneNumber: phone, gender });
      toast.success("Profile completed successfully!");
      onComplete();
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl xl:w-[50%] 2xl:w-[40%] flex px-6 relative">
        <div className="w-1/2 2xl:py-3">
          <img
            className="w-full h-full"
            src="/profile.svg"
            alt="Profile Illustration"
          />
        </div>
        <div className="w-1/2 gap-2 2xl:gap-3 flex flex-col p-2 2xl:p-3">
          <h2 className="text-2xl font-medium  2xl:mb-4">
            Get your profile started
          </h2>
          <div className="mb-4 mt-2 w-full">
            <label className="block text-sm text-gray-600">Phone Number</label>
            <input
              type="tel"
              value={phone}
              maxLength={10}
              onChange={handlePhoneChange}
              placeholder="Enter your phone number"
              className={`w-full border rounded-lg p-2 mt-2 focus:outline-none focus:ring-1 focus:ring-[#0c0b45] ${
                phoneError ? "border-red-500" : ""
              }`}
            />
            {phoneError && (
              <p className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>
          <div className="mb-4 w-full">
            <label className="block text-sm text-gray-600">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full border rounded-lg p-2 mt-2 focus:outline-none focus:ring-1 focus:ring-[#0c0b45]"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-[#0c0b45] text-white py-2 mt-2 rounded-lg transition"
            disabled={!!phoneError || loading}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <p className="text-xs text-gray-500  mt-4 px-2 leading-5">
            By joining, you agree to the{" "}
            <a href="#" className="text-[#0c0b45] hover:underline font-medium">
              Cotchel Terms of Service
            </a>{" "}
            and to occasionally receive emails from us. Please read our{" "}
            <a href="#" className="text-[#0c0b45] hover:underline font-medium">
              Privacy Policy
            </a>{" "}
            to learn how we use your personal data.
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  // Google login logic
  const googleResponse = async (res) => {
    try {
      if (res["code"]) {
        const result = await googleAuth(res["code"]);
        if (result.data.success) {
          const user = result.data.user;
          setUser(user);
          // Check for missing required fields
          if (!user.phoneNumber || !user.gender) {
            setGoogleUser(user);
            setShowCompleteProfile(true);
            return;
          }
          toast.success("Google login successful!");
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        } else {
          toast.error(result.data.message || "Google login failed");
        }
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Google login failed. Please try again.");
    }
  };

  const continueWithGoogle = useGoogleLogin({
    onSuccess: googleResponse,
    onError: googleResponse,
    flow: "auth-code",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      setLoading(true);
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success("Login successful!");
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || "Login failed");
        setErrors({
          submit: result.error || "Login failed",
        });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setErrors({
        submit: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordToggle = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      {showCompleteProfile && googleUser && (
        <CompleteProfileModal
          user={googleUser}
          onComplete={() => {
            setShowCompleteProfile(false);
            toast.success("Profile completed successfully!");
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
          }}
        />
      )}
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex flex-col md:flex-row bg-transparent gap-6 md:gap-12 items-start">
            {/* Left: Image */}
            <div className="md:w-1/2 w-full flex flex-col items-center justify-center">
              <img
                src="/signup3.png"
                alt="Sign in illustration"
                className="w-full"
                draggable="false"
              />
            </div>
            {/* Right: Form */}
            <div className="md:w-1/2 w-full flex flex-col justify-center px-4 sm:px-8 py-8 md:py-0">
              <h2 className="text-2xl font-bold text-left mb-6">
                Sign in to your account
              </h2>
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                      errors.email ? "ring-2 ring-red-400" : ""
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                      errors.password ? "ring-2 ring-red-400" : ""
                    }`}
                    placeholder="Enter your password"
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
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>
                {errors.submit && (
                  <p className="text-xs text-red-500 mb-2">{errors.submit}</p>
                )}
                <div className="flex justify-end mb-2">
                  <Link
                    to="/request-reset"
                    className="text-sm text-[#0D0B46] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0D0B46] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
                {/* Divider with OR */}
                <div className="flex items-center my-6">
                  <div className="flex-grow h-px bg-gray-200"></div>
                  <span className="mx-4 text-gray-400 font-semibold">OR</span>
                  <div className="flex-grow h-px bg-gray-200"></div>
                </div>
                {/* Google Button */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors mb-4 cursor-pointer"
                  onClick={() => continueWithGoogle()}
                >
                  <FcGoogle className="w-5 h-5" />
                  Continue with Google
                </button>
                {/* Already have an account */}
                <p className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#0D0B46] hover:underline font-semibold cursor-pointer"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Login = () => (
  <GoogleOAuthProvider clientId="870796183270-nr36lvkvmb984tuq92fl6g81cnlaglpu.apps.googleusercontent.com">
    <LoginForm />
  </GoogleOAuthProvider>
);

export default Login;
