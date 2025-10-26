import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import api from "../services/apiService";
import { API } from "../config/api";
import { Country, State, City } from "country-state-city";

const SellerDetails = () => {
  const navigate = useNavigate();
  const { user, checkAuth, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    gstin: "",
    pan: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
  });

  const [errors, setErrors] = useState({});

  // State for dynamic state/city dropdowns
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [states, setStates] = useState(State.getStatesOfCountry("IN"));
  const [cities, setCities] = useState([]);

  useEffect(() => {
    // Check if user is already verified as seller
    if (user?.isVerifiedSeller) {
      navigate("/seller/dashboard");
      return;
    }

    // Check if user already has seller details and is not rejected
    if (user?.sellerDetails && user?.sellerDetailsStatus !== "rejected") {
      navigate("/seller-verification");
      return;
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Apply input formatting and validation based on field type
    let formattedValue = value;

    switch (name) {
      case "pan":
        // PAN: Only uppercase letters and numbers, max 10 characters
        formattedValue = value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 10);
        break;
      case "gstin":
        // GSTIN: Only uppercase letters and numbers, max 15 characters
        formattedValue = value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 15);
        break;
      case "postalCode":
        // Postal Code: Only numbers, max 6 digits
        formattedValue = value.replace(/\D/g, "").slice(0, 6);
        break;
      case "accountNumber":
        // Account Number: Only numbers, max 18 digits
        formattedValue = value.replace(/\D/g, "").slice(0, 18);
        break;
      case "ifscCode":
        // IFSC Code: Only uppercase letters and numbers, max 11 characters
        formattedValue = value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 11);
        break;
      case "city":
      case "state":
        // City and State: No formatting needed for dropdowns
        break;
      case "accountName":
        // Account Name: Only letters, spaces, and periods
        formattedValue = value.replace(/[^a-zA-Z\s.]/g, "");
        break;
      default:
        // For other fields, just trim whitespace
        break;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleStateChange = (e) => {
    const stateCode = e.target.value;
    setSelectedState(stateCode);
    setFormData((prev) => ({ ...prev, state: stateCode, city: "" }));
    setCities(City.getCitiesOfState("IN", stateCode));
    setSelectedCity("");
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    setFormData((prev) => ({ ...prev, city: cityName }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Business Name validation
    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    } else if (formData.businessName.trim().length < 3) {
      newErrors.businessName = "Business name must be at least 3 characters";
    } else if (formData.businessName.trim().length > 100) {
      newErrors.businessName = "Business name must be less than 100 characters";
    } else if (!/^[a-zA-Z0-9\s&.,'-]+$/.test(formData.businessName.trim())) {
      newErrors.businessName = "Business name contains invalid characters";
    }

    // PAN validation
    if (!formData.pan.trim()) {
      newErrors.pan = "PAN is required";
    } else if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(formData.pan.trim())) {
      newErrors.pan = "Invalid PAN format (e.g., ABCDE1234F)";
    }

    // GSTIN validation (now required)
    if (!formData.gstin.trim()) {
      newErrors.gstin = "GSTIN is required";
    } else if (
      !/^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1})$/.test(
        formData.gstin.trim()
      )
    ) {
      newErrors.gstin = "Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)";
    }

    // Address Line 1 validation
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address is required";
    } else if (formData.addressLine1.trim().length < 10) {
      newErrors.addressLine1 = "Address must be at least 10 characters";
    } else if (formData.addressLine1.trim().length > 100) {
      newErrors.addressLine1 = "Address must be less than 100 characters";
    }

    // Address Line 2 validation (optional but with length limit)
    if (
      formData.addressLine2.trim() &&
      formData.addressLine2.trim().length > 100
    ) {
      newErrors.addressLine2 =
        "Address line 2 must be less than 100 characters";
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    // Postal Code validation
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{6}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = "Postal code must be 6 digits";
    }

    // Bank Name validation
    if (!formData.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    } else if (formData.bankName.trim().length < 3) {
      newErrors.bankName = "Bank name must be at least 3 characters";
    } else if (formData.bankName.trim().length > 100) {
      newErrors.bankName = "Bank name must be less than 100 characters";
    } else if (!/^[a-zA-Z0-9\s&.,'-]+$/.test(formData.bankName.trim())) {
      newErrors.bankName = "Bank name contains invalid characters";
    }

    // Account Name validation
    if (!formData.accountName.trim()) {
      newErrors.accountName = "Account holder name is required";
    } else if (formData.accountName.trim().length < 3) {
      newErrors.accountName =
        "Account holder name must be at least 3 characters";
    } else if (formData.accountName.trim().length > 100) {
      newErrors.accountName =
        "Account holder name must be less than 100 characters";
    } else if (!/^[a-zA-Z\s.]+$/.test(formData.accountName.trim())) {
      newErrors.accountName =
        "Account holder name can only contain letters, spaces, and periods";
    }

    // Account Number validation
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (!/^\d{9,18}$/.test(formData.accountNumber.trim())) {
      newErrors.accountNumber = "Account number must be 9-18 digits";
    }

    // IFSC Code validation
    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim())) {
      newErrors.ifscCode = "Invalid IFSC code format (e.g., ABCD0001234)";
    }

    // Branch validation (required)
    if (!formData.branch.trim()) {
      newErrors.branch = "Branch name is required";
    } else if (formData.branch.trim().length > 100) {
      newErrors.branch = "Branch name must be less than 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(API.USER.SELLER_DETAILS, formData);

      if (response.data.success) {
        toast.success(
          "Seller details submitted successfully! Please wait for admin approval."
        );
        // Update the user in auth context immediately with the response data
        if (response.data.user) {
          updateUser(response.data.user);
          // Wait a moment for tokens to be set, then refresh auth
          setTimeout(async () => {
            await checkAuth();
          }, 100);
        }
        navigate("/seller-verification");
      }
    } catch (error) {
      console.error("Error submitting seller details:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to submit seller details";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please log in to continue
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Become a Seller
            </h1>
            <p className="text-gray-600">
              Complete your business details to start selling on our platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.businessName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your business name"
                    maxLength={100}
                  />
                  {errors.businessName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.businessName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.pan ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                  {errors.pan && (
                    <p className="text-red-500 text-sm mt-1">{errors.pan}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GSTIN *
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.gstin ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                  {errors.gstin && (
                    <p className="text-red-500 text-sm mt-1">{errors.gstin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Business Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.addressLine1 ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Street address, building, etc."
                    maxLength={100}
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.addressLine1}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apartment, suite, etc."
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value="India"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.state ? "border-red-500" : "border-gray-300"
                    }`}
                    value={selectedState}
                    onChange={handleStateChange}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <select
                    name="city"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? "border-red-500" : "border-gray-300"
                    }`}
                    value={selectedCity}
                    onChange={handleCityChange}
                    disabled={!selectedState}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.postalCode ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter postal code"
                    maxLength={6}
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Bank Account Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.bankName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter bank name"
                    maxLength={100}
                  />
                  {errors.bankName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.bankName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.accountName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter account holder name"
                    maxLength={100}
                  />
                  {errors.accountName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.accountName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.accountNumber
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter account number"
                    maxLength={18}
                  />
                  {errors.accountNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ifscCode ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="ABCD0001234"
                    maxLength={11}
                  />
                  {errors.ifscCode && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.ifscCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch *
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.branch ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter branch name"
                    maxLength={100}
                  />
                  {errors.branch && (
                    <p className="text-red-500 text-sm mt-1">{errors.branch}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerDetails;
