import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../services/apiService";
import { API } from "../config/api";
import { FcGoogle } from "react-icons/fc";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const steps = ["Basic Info", "OTP Verification", "Additional Info"];

const genders = ["Male", "Female", "Other"];

const googleAuth = (code) => api.get(`${API.AUTH.GOOGLE_SIGNIN}?code=${code}`);
const updateUserDetails = (userId, details) =>
  api.put(API.USER.UPDATE_DETAILS, { userId, ...details });

const CompleteProfileModal = ({ user, onComplete }) => {
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [error, setError] = useState("");

  // Indian phone number regex: starts with 6-9, 10 digits
  const indianPhoneRegex = /^[6-9]\d{9}$/;

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (!indianPhoneRegex.test(value)) {
      setPhoneError(
        "Please enter a valid 10-digit phone number starting with 6-9"
      );
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
    if (!indianPhoneRegex.test(phone)) {
      setPhoneError("Enter a valid phone number");
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
              placeholder="Enter 10-digit phone number starting with 6-9"
              className={`w-full border rounded-lg p-2 mt-2 focus:outline-none focus:ring-1 focus:ring-[#0c0b45] ${
                phoneError ? "border-red-500" : ""
              }`}
              inputMode="numeric"
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

const RegisterContent = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    password: "",
    otp: ["", "", "", "", "", ""],
    lastName: "",
    dob: "",
    gender: "",
    confirmPassword: "",
  });
  const [userId, setUserId] = useState(null);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const navigate = useNavigate();
  const otpRefs = Array.from({ length: 6 }, () => useRef());
  const { setUser } = useAuth();

  const passwordRegex =
    /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  // Validation functions
  const validateStep = () => {
    let errs = {};
    if (step === 0) {
      if (!form.email.trim()) errs.email = "Email is required";
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
        errs.email = "Invalid email";
      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 6)
        errs.password = "Password must be at least 6 characters";
      if (!form.confirmPassword)
        errs.confirmPassword = "Confirm password is required";
      if (form.password !== form.confirmPassword)
        errs.confirmPassword = "Passwords do not match";
    } else if (step === 1) {
      if (!form.otp.every((digit) => digit !== ""))
        errs.otp = "OTP is required";
      else if (!/^\d{6}$/.test(form.otp.join("")))
        errs.otp = "OTP must be 6 digits";
    } else if (step === 2) {
      if (!form.fullName.trim()) errs.fullName = "Full name is required";
      else if (!/^[a-zA-Z. ]+$/.test(form.fullName.trim()))
        errs.fullName = "Name cannot contain special characters or numbers";
      else if (form.fullName.trim().length > 40)
        errs.fullName = "Name cannot exceed 40 characters";
      if (!form.phone.trim()) errs.phone = "Phone is required";
      else if (!/^[6-9]\d{9}$/.test(form.phone))
        errs.phone =
          "Please enter a valid 10-digit phone number starting with 6-9";
      if (!form.dob) errs.dob = "Date of birth is required";
      if (!form.gender) errs.gender = "Gender is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handlers
  const handleChange = (e) => {
    if (e.target.name !== "otp") {
      setForm({ ...form, [e.target.name]: e.target.value });
      setErrors({ ...errors, [e.target.name]: undefined });
      if (e.target.name === "password" || e.target.name === "confirmPassword") {
        setTouched((prev) => ({ ...prev, [e.target.name]: true }));
      }
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (step === 0) {
      setSubmitting(true);
      try {
        const res = await api.post(API.AUTH.REGISTER, {
          email: form.email,
          password: form.password,
        });
        setUserId(res.data.userId);
        setOtpSent(true);
        setOtpResendTimer(30);
        setTimeout(() => setOtpResendTimer(0), 30000);
        setForm((prev) => ({ ...prev, otp: ["", "", "", "", "", ""] }));
        setStep(1);
      } catch (err) {
        const msg = err.response?.data?.message || "Registration failed";
        setErrors({});
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (step === 1) {
      setSubmitting(true);
      try {
        const res = await api.post(API.AUTH.VERIFY_EMAIL, {
          userId,
          code: form.otp.join(""),
        });
        if (res.data.success) {
          setStep(2);
        } else {
          setErrors({ otp: res.data.message || "Invalid OTP" });
        }
      } catch (err) {
        setErrors({ otp: err.response?.data?.message || "Invalid OTP" });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setStep((s) => s - 1);
  };

  const handleResendOtp = () => {
    if (otpResendTimer > 0) return;
    setOtpSent(true);
    setOtpResendTimer(30);
    // Simulate sending OTP
    setTimeout(() => setOtpResendTimer(0), 30000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await api.put(API.USER.UPDATE_DETAILS, {
        userId,
        fullName: form.fullName,
        phoneNumber: form.phone,
        dateOfBirth: form.dob,
        gender: form.gender,
      });
      // Check if user came from become-seller flow
      const urlParams = new URLSearchParams(window.location.search);
      const role = urlParams.get("role");

      if (role === "seller") {
        navigate("/seller-details");
      } else {
        navigate("/login");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to complete registration";
      setErrors({});
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const handleConfirmPasswordToggle = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Level Indicator Bars
  const LevelIndicator = () => (
    <div className="flex gap-2 mt-12 w-3/4 mx-auto">
      {steps.map((_, idx) => (
        <div
          key={idx}
          className={`flex-1 h-2 rounded-full transition-all duration-200 ${
            idx <= step ? "bg-[#0D0B46]" : "bg-gray-200"
          }`}
        ></div>
      ))}
    </div>
  );

  // Select image based on step
  const stepImages = ["/signup1.png", "/signup2.png", "/signup3.png"];

  // OTP paste handler
  const handleOtpPaste = (e) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (paste.length === 6) {
      setForm((prev) => ({
        ...prev,
        otp: paste.split(""),
      }));
      if (otpRefs && otpRefs[5] && otpRefs[5].current) {
        otpRefs[5].current.focus();
      }
    }
  };

  const handleOtpChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = Array.isArray(form.otp)
      ? [...form.otp]
      : ["", "", "", "", "", ""];
    newOtp[idx] = value;
    setForm({ ...form, otp: newOtp });
    setErrors({ ...errors, otp: undefined });
    if (value && idx < 5) {
      otpRefs[idx + 1].current.focus();
    }
    if (!value && idx > 0) {
      otpRefs[idx - 1].current.focus();
    }
  };

  // Auto-focus first OTP input on step 1
  useEffect(() => {
    if (step === 1 && otpRefs[0] && otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
  }, [step]);

  // Google login/signup logic
  const googleResponse = async (res) => {
    try {
      if (res["code"]) {
        const result = await googleAuth(res["code"]);
        if (result.data.success) {
          const user = result.data.user;
          setUser(user); // Set user in context
          // Check for missing required fields
          if (!user.phoneNumber || !user.gender) {
            setGoogleUser(user);
            setShowCompleteProfile(true);
            return;
          }
          toast.success("Google sign up successful!");
          // Check if user came from become-seller flow
          const urlParams = new URLSearchParams(window.location.search);
          const role = urlParams.get("role");

          if (role === "seller") {
            navigate("/seller-details");
          } else {
            navigate("/");
          }
        } else {
          toast.error(result.data.message || "Google sign up failed");
        }
      }
    } catch (error) {
      console.error("Error signing up with Google:", error);
      toast.error("Google sign up failed. Please try again.");
    }
  };

  const continueWithGoogle = useGoogleLogin({
    onSuccess: googleResponse,
    onError: googleResponse,
    flow: "auth-code",
  });

  return (
    <div className="bg-gray-50 py-10">
      <div className="w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex flex-col md:flex-row bg-transparent gap-6 md:gap-12 items-start">
          {/* Left: Image and Level Indicator */}
          <div className="md:w-1/2 w-full flex flex-col items-center justify-center">
            <img
              src={stepImages[step]}
              alt={`Register Step ${step + 1}`}
              className="w-full   "
              draggable="false"
            />
            <LevelIndicator />
          </div>
          {/* Right: Form */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-4 sm:px-8 py-8 md:py-0">
            <h2 className="text-2xl font-bold text-left mb-2">
              {step === 0 && "Create an Account"}
              {step === 1 && "Verify Account"}
              {step === 2 && "Additional Information"}
            </h2>
            {step === 1 && (
              <p className="text-sm text-gray-500 mb-4">
                You may have received it on{" "}
                <span className="font-semibold">{form.email}</span>
              </p>
            )}
            <form
              onSubmit={step === 2 ? handleSubmit : handleNext}
              className="w-full"
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                        errors.email ? "ring-2 ring-red-400" : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, password: true }))
                      }
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                        errors.password ? "ring-2 ring-red-400" : ""
                      }`}
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={handlePasswordToggle}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </button>
                    {touched.password &&
                      form.password &&
                      !passwordRegex.test(form.password) && (
                        <p className="text-xs text-red-500 mt-1">
                          Password must be at least 8 characters, include
                          lowercase, number, and special character
                        </p>
                      )}
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="relative mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onBlur={() =>
                        setTouched((prev) => ({
                          ...prev,
                          confirmPassword: true,
                        }))
                      }
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                        errors.confirmPassword ? "ring-2 ring-red-400" : ""
                      }`}
                      onCopy={(e) => e.preventDefault()}
                      onPaste={(e) => e.preventDefault()}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={handleConfirmPasswordToggle}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="w-5 h-5" />
                      ) : (
                        <FiEye className="w-5 h-5" />
                      )}
                    </button>
                    {touched.confirmPassword &&
                      form.confirmPassword &&
                      form.password !== form.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">
                          Passwords do not match
                        </p>
                      )}
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="w-full bg-[#0D0B46] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2 w-full mx-auto">
                    {(Array.isArray(form.otp)
                      ? form.otp
                      : ["", "", "", "", "", ""]
                    ).map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onPaste={handleOtpPaste}
                        className="w-full aspect-square text-center text-xl border border-gray-200 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0D0B46]"
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <p className="text-xs text-red-500 mt-1 text-center">
                      {errors.otp}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-sm text-[#0D0B46] hover:underline disabled:opacity-50 cursor-pointer"
                      onClick={handleResendOtp}
                      disabled={otpResendTimer > 0}
                    >
                      Resend OTP
                      {otpResendTimer > 0 ? ` (${otpResendTimer}s)` : ""}
                    </button>
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:underline cursor-pointer"
                      onClick={handleBack}
                    >
                      Back
                    </button>
                  </div>
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="w-full bg-[#0D0B46] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                        errors.fullName ? "ring-2 ring-red-400" : ""
                      }`}
                      maxLength={40}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="Enter 10-digit phone number starting with 6-9"
                      onChange={(e) => {
                        // Only allow digits and limit to 10 characters
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setForm({ ...form, phone: value });
                        setErrors({ ...errors, phone: undefined });
                      }}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                        errors.phone ? "ring-2 ring-red-400" : ""
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                        errors.dob ? "ring-2 ring-red-400" : ""
                      }`}
                    />
                    {errors.dob && (
                      <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                        errors.gender ? "ring-2 ring-red-400" : ""
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                  <div className="mt-6">
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:underline cursor-pointer mb-4"
                      onClick={handleBack}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-full bg-[#0D0B46] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors cursor-pointer"
                      disabled={submitting}
                    >
                      {submitting ? "Registering..." : "Register"}
                    </button>
                  </div>
                </div>
              )}

              {step === 0 && (
                <>
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
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-[#0D0B45] hover:underline font-semibold cursor-pointer"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
      {showCompleteProfile && googleUser && (
        <CompleteProfileModal
          user={googleUser}
          onComplete={() => {
            setShowCompleteProfile(false);
            toast.success("Profile completed successfully!");
            // Check if user came from become-seller flow
            const urlParams = new URLSearchParams(window.location.search);
            const role = urlParams.get("role");

            if (role === "seller") {
              navigate("/seller-details");
            } else {
              navigate("/");
            }
          }}
        />
      )}
    </div>
  );
};

const Register = () => (
  <GoogleOAuthProvider clientId="870796183270-nr36lvkvmb984tuq92fl6g81cnlaglpu.apps.googleusercontent.com">
    <RegisterContent />
  </GoogleOAuthProvider>
);

export default Register;
