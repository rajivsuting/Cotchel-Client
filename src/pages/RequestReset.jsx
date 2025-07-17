import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/apiService";
import { API } from "../config/api";
import { FiMail } from "react-icons/fi";

const RequestReset = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(API.AUTH.REQUEST_RESET, { email });

      if (response.data.message) {
        setEmailSent(true);
        toast.success("Password reset link sent to your email!");
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send reset link. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="bg-gray-50 py-10 min-h-screen">
        <div className="w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex flex-col md:flex-row bg-transparent gap-6 md:gap-12 items-start">
            {/* Left: Image */}
            <div className="md:w-1/2 w-full flex flex-col items-center justify-center">
              <img
                src="/signup3.png"
                alt="Email sent illustration"
                className="w-full"
                draggable="false"
              />
            </div>
            {/* Right: Success Message */}
            <div className="md:w-1/2 w-full flex flex-col justify-center px-4 sm:px-8 py-8 md:py-0">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiMail className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Check Your Email
                </h2>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Click the link in the email to reset your password. The link
                  will expire in 1 hour.
                </p>
                <div className="space-y-4">
                  <Link
                    to="/login"
                    className="block w-full bg-[#0D0B46] text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                  >
                    Back to Login
                  </Link>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Send Another Email
                    </button>
                    <button
                      onClick={async () => {
                        setResending(true);
                        try {
                          const response = await api.post(
                            API.AUTH.REQUEST_RESET,
                            { email }
                          );
                          if (response.data.message) {
                            toast.success("Password reset link resent!");
                            setResentSuccess(true);
                            setTimeout(() => setResentSuccess(false), 2000);
                          }
                        } catch (error) {
                          const errorMessage =
                            error.response?.data?.message ||
                            "Failed to resend reset link. Please try again.";
                          toast.error(errorMessage);
                        } finally {
                          setResending(false);
                        }
                      }}
                      className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200`}
                      disabled={resending}
                    >
                      {resentSuccess
                        ? "Link Sent!"
                        : resending
                        ? "Resending..."
                        : "Resend Link"}
                    </button>
                  </div>
                </div>
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
              alt="Forgot password illustration"
              className="w-full"
              draggable="false"
            />
          </div>
          {/* Right: Form */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-4 sm:px-8 py-8 md:py-0">
            <h2 className="text-2xl font-bold text-left mb-2">
              Forgot Password?
            </h2>
            <p className="text-gray-600 mb-6">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D0B46] bg-gray-100 ${
                    error ? "ring-2 ring-red-400" : ""
                  }`}
                  placeholder="Enter your email address"
                  disabled={loading}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0D0B46] text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Sending..." : "Send Reset Link"}
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

export default RequestReset;
