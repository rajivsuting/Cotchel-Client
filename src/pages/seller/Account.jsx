import React, { useState, useEffect } from "react";
import LoadingState from "../../components/LoadingState";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiXCircle,
  FiEdit2,
  FiUser,
  FiPhone,
  FiBriefcase,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/apiService";

const Account = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { checkAuth } = useAuth();

  // Separate state for each section
  const [basicForm, setBasicForm] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
  });
  const [contactForm, setContactForm] = useState({ email: "", phone: "" });
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    gstin: "",
    pan: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
  });
  const [editBasic, setEditBasic] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [editBusiness, setEditBusiness] = useState(false);
  const [pendingEditClose, setPendingEditClose] = useState(false);
  const [pendingContactEditClose, setPendingContactEditClose] = useState(false);
  const [pendingBusinessEditClose, setPendingBusinessEditClose] =
    useState(false);
  const [businessErrors, setBusinessErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/auth/profile");
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (data?.data) {
      const user = data.data;
      // Only update form state if not editing
      if (!editBasic) {
        setBasicForm({
          name: user.fullName || "",
          dateOfBirth: user.dateOfBirth || "",
          gender: user.gender || "",
        });
      }
      if (!editContact) {
        setContactForm({
          email: user.email || "",
          phone: user.phone || user.phoneNumber || "",
        });
      }
      if (!editBusiness && user.sellerDetails) {
        const sellerDetails = user.sellerDetails;
        setBusinessForm({
          businessName: sellerDetails.businessName || "",
          gstin: sellerDetails.gstin || "",
          pan: sellerDetails.pan || "",
          addressLine1: sellerDetails.addressLine1 || "",
          addressLine2: sellerDetails.addressLine2 || "",
          city: sellerDetails.city || "",
          state: sellerDetails.state || "",
          postalCode: sellerDetails.postalCode || "",
          bankName: sellerDetails.bankName || "",
          accountName: sellerDetails.accountName || "",
          accountNumber: sellerDetails.accountNumber || "",
          ifscCode: sellerDetails.ifscCode || "",
          branch: sellerDetails.branch || "",
        });
      }
      // If we just updated, close the edit form now
      if (pendingEditClose) {
        setEditBasic(false);
        setPendingEditClose(false);
      }
      if (pendingContactEditClose) {
        setEditContact(false);
        setPendingContactEditClose(false);
      }
      if (pendingBusinessEditClose) {
        setEditBusiness(false);
        setPendingBusinessEditClose(false);
      }
    }
  }, [
    data,
    editBasic,
    editContact,
    editBusiness,
    pendingEditClose,
    pendingContactEditClose,
    pendingBusinessEditClose,
  ]);

  const handleBasicChange = (e) => {
    setBasicForm({ ...basicForm, [e.target.name]: e.target.value });
  };
  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };
  const handleBusinessChange = (e) => {
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
      case "accountName":
        // Account Name: Only letters, spaces, and periods
        formattedValue = value.replace(/[^a-zA-Z\s.]/g, "");
        break;
      default:
        // For other fields, just use the value as is
        break;
    }

    setBusinessForm({ ...businessForm, [name]: formattedValue });

    // Clear error when user starts typing
    if (businessErrors[name]) {
      setBusinessErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Helper to refetch profile after update, without setting isLoading
  const refetchProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      setData(response.data);
    } catch (err) {
      // Optionally handle error
    }
  };

  const validateBusinessForm = () => {
    const newErrors = {};

    // Business Name validation
    if (!businessForm.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    } else if (businessForm.businessName.trim().length < 3) {
      newErrors.businessName = "Business name must be at least 3 characters";
    } else if (businessForm.businessName.trim().length > 100) {
      newErrors.businessName = "Business name must be less than 100 characters";
    } else if (
      !/^[a-zA-Z0-9\s&.,'-]+$/.test(businessForm.businessName.trim())
    ) {
      newErrors.businessName = "Business name contains invalid characters";
    }

    // PAN validation
    if (!businessForm.pan.trim()) {
      newErrors.pan = "PAN is required";
    } else if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(businessForm.pan.trim())) {
      newErrors.pan = "Invalid PAN format (e.g., ABCDE1234F)";
    }

    // GSTIN validation
    if (!businessForm.gstin.trim()) {
      newErrors.gstin = "GSTIN is required";
    } else if (
      !/^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1})$/.test(
        businessForm.gstin.trim()
      )
    ) {
      newErrors.gstin = "Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)";
    }

    // Address Line 1 validation
    if (!businessForm.addressLine1.trim()) {
      newErrors.addressLine1 = "Address is required";
    } else if (businessForm.addressLine1.trim().length < 10) {
      newErrors.addressLine1 = "Address must be at least 10 characters";
    } else if (businessForm.addressLine1.trim().length > 100) {
      newErrors.addressLine1 = "Address must be less than 100 characters";
    }

    // Address Line 2 validation (optional but with length limit)
    if (
      businessForm.addressLine2.trim() &&
      businessForm.addressLine2.trim().length > 100
    ) {
      newErrors.addressLine2 =
        "Address line 2 must be less than 100 characters";
    }

    // City validation
    if (!businessForm.city.trim()) {
      newErrors.city = "City is required";
    }

    // State validation
    if (!businessForm.state.trim()) {
      newErrors.state = "State is required";
    }

    // Postal Code validation
    if (!businessForm.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{6}$/.test(businessForm.postalCode.trim())) {
      newErrors.postalCode = "Postal code must be 6 digits";
    }

    // Bank Name validation
    if (!businessForm.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    } else if (businessForm.bankName.trim().length < 3) {
      newErrors.bankName = "Bank name must be at least 3 characters";
    } else if (businessForm.bankName.trim().length > 100) {
      newErrors.bankName = "Bank name must be less than 100 characters";
    } else if (!/^[a-zA-Z0-9\s&.,'-]+$/.test(businessForm.bankName.trim())) {
      newErrors.bankName = "Bank name contains invalid characters";
    }

    // Account Name validation
    if (!businessForm.accountName.trim()) {
      newErrors.accountName = "Account holder name is required";
    } else if (businessForm.accountName.trim().length < 3) {
      newErrors.accountName =
        "Account holder name must be at least 3 characters";
    } else if (businessForm.accountName.trim().length > 100) {
      newErrors.accountName =
        "Account holder name must be less than 100 characters";
    } else if (!/^[a-zA-Z\s.]+$/.test(businessForm.accountName.trim())) {
      newErrors.accountName =
        "Account holder name can only contain letters, spaces, and periods";
    }

    // Account Number validation
    if (!businessForm.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (!/^\d{9,18}$/.test(businessForm.accountNumber.trim())) {
      newErrors.accountNumber = "Account number must be 9-18 digits";
    }

    // IFSC Code validation
    if (!businessForm.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(businessForm.ifscCode.trim())) {
      newErrors.ifscCode = "Invalid IFSC code format (e.g., ABCD0001234)";
    }

    // Branch validation
    if (!businessForm.branch.trim()) {
      newErrors.branch = "Branch name is required";
    } else if (businessForm.branch.trim().length > 100) {
      newErrors.branch = "Branch name must be less than 100 characters";
    }

    setBusinessErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.patch("/auth/edit", {
        fullName: basicForm.name,
        dateOfBirth: basicForm.dateOfBirth,
        gender: basicForm.gender
          ? basicForm.gender.charAt(0).toUpperCase() + basicForm.gender.slice(1)
          : basicForm.gender,
      });
      toast.success("Basic details updated successfully");
      setPendingEditClose(true);
      await refetchProfile();
      await checkAuth();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update basic details"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.patch("/auth/edit", {
        phoneNumber: contactForm.phone,
      });
      toast.success("Contact information updated successfully");
      setPendingContactEditClose(true);
      await refetchProfile();
      await checkAuth();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update contact information"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();

    if (!validateBusinessForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch("/auth/seller-details/update", {
        businessName: businessForm.businessName,
        gstin: businessForm.gstin,
        pan: businessForm.pan,
        addressLine1: businessForm.addressLine1,
        addressLine2: businessForm.addressLine2,
        city: businessForm.city,
        state: businessForm.state,
        postalCode: businessForm.postalCode,
        bankName: businessForm.bankName,
        accountName: businessForm.accountName,
        accountNumber: businessForm.accountNumber,
        ifscCode: businessForm.ifscCode,
        branch: businessForm.branch,
      });
      toast.success("Business details updated successfully");
      setPendingBusinessEditClose(true);
      await refetchProfile();
      await checkAuth();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update business details"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <div className="text-red-500 p-8">
        {error.response?.data?.message ||
          error.message ||
          "Failed to load profile."}
      </div>
    );
  }

  const user = data?.data;
  const sellerDetails = user?.sellerDetails;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
        Welcome
      </h1>
      <h2 className="text-xl font-semibold text-gray-800 mb-8 flex items-center gap-2">
        {user?.fullName || user?.name || user?.email || "Seller"}
      </h2>
      {/* Basic Details Card */}
      <section className="relative border border-gray-200 rounded-xl bg-white p-6 mb-8">
        <form onSubmit={handleBasicSubmit}>
          {/* Edit icon */}
          {!editBasic && (
            <button
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-[#0D0B46]"
              onClick={() => setEditBasic(true)}
              aria-label="Edit Basic Details"
            >
              <FiEdit2 className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="text-[#0D0B46]" /> Basic Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Name
              </label>
              {editBasic ? (
                <input
                  type="text"
                  name="name"
                  value={basicForm.name}
                  onChange={handleBasicChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46]"
                />
              ) : (
                <div className="text-base text-gray-900 font-medium py-1">
                  {basicForm.name || <span className="text-gray-400">-</span>}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Date of Birth
              </label>
              {editBasic ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={
                    basicForm.dateOfBirth
                      ? basicForm.dateOfBirth.slice(0, 10)
                      : ""
                  }
                  onChange={handleBasicChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46]"
                />
              ) : (
                <div className="text-base text-gray-900 font-medium py-1">
                  {basicForm.dateOfBirth ? (
                    basicForm.dateOfBirth.slice(0, 10)
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Gender
              </label>
              {editBasic ? (
                <select
                  name="gender"
                  value={basicForm.gender}
                  onChange={handleBasicChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46]"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <div className="text-base text-gray-900 font-medium py-1 capitalize">
                  {basicForm.gender || <span className="text-gray-400">-</span>}
                </div>
              )}
            </div>
          </div>
          {editBasic && (
            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#0D0B46] text-white rounded-md hover:bg-[#23206a] disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setEditBasic(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Contact Information Card */}
      <section className="relative border border-gray-200 rounded-xl bg-white p-6 mb-8">
        <form onSubmit={handleContactSubmit}>
          {/* Edit icon */}
          {!editContact && (
            <button
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-[#0D0B46]"
              onClick={() => setEditContact(true)}
              aria-label="Edit Contact Information"
            >
              <FiEdit2 className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiPhone className="text-[#0D0B46]" /> Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Email
              </label>
              <div className="flex items-center gap-2 py-1">
                <span className="text-base text-gray-900 font-medium">
                  {contactForm.email || (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
                {user?.isEmailVerified ? (
                  <FiCheckCircle
                    className="text-green-500"
                    title="Email Verified"
                  />
                ) : (
                  <FiXCircle
                    className="text-red-500"
                    title="Email Not Verified"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Phone
              </label>
              {editContact ? (
                <input
                  type="text"
                  name="phone"
                  value={contactForm.phone}
                  onChange={handleContactChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46]"
                />
              ) : (
                <div className="text-base text-gray-900 font-medium py-1">
                  {contactForm.phone || (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {editContact && (
            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-[#0D0B46] text-white rounded-md hover:bg-[#23206a] disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setEditContact(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Business Details Section */}
      {sellerDetails && (
        <section className="relative border border-gray-200 rounded-xl bg-white p-6 mt-8">
          <form onSubmit={handleBusinessSubmit}>
            {/* Edit icon */}
            {!editBusiness && (
              <button
                type="button"
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-[#0D0B46]"
                onClick={() => setEditBusiness(true)}
                aria-label="Edit Business Details"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiBriefcase className="text-[#0D0B46]" /> Business Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Business Name
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="businessName"
                      value={businessForm.businessName}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.businessName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your business name"
                      maxLength={100}
                    />
                    {businessErrors.businessName && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.businessName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.businessName || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  GSTIN
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="gstin"
                      value={businessForm.gstin}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.gstin
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                    {businessErrors.gstin && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.gstin}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.gstin || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  PAN
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="pan"
                      value={businessForm.pan}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.pan
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                    {businessErrors.pan && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.pan}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.pan || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Address Line 1
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="addressLine1"
                      value={businessForm.addressLine1}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.addressLine1
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Street address, building, etc."
                      maxLength={100}
                    />
                    {businessErrors.addressLine1 && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.addressLine1}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.addressLine1 || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Address Line 2
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="addressLine2"
                      value={businessForm.addressLine2}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.addressLine2
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Apartment, suite, etc."
                      maxLength={100}
                    />
                    {businessErrors.addressLine2 && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.addressLine2}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.addressLine2 || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  City
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="city"
                      value={businessForm.city}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.city
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter city"
                    />
                    {businessErrors.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.city}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.city || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  State
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="state"
                      value={businessForm.state}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.state
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter state"
                    />
                    {businessErrors.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.state}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.state || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Postal Code
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="postalCode"
                      value={businessForm.postalCode}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.postalCode
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter postal code"
                      maxLength={6}
                    />
                    {businessErrors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.postalCode}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.postalCode || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Bank Name
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="bankName"
                      value={businessForm.bankName}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.bankName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter bank name"
                      maxLength={100}
                    />
                    {businessErrors.bankName && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.bankName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.bankName || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Account Holder Name
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="accountName"
                      value={businessForm.accountName}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.accountName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter account holder name"
                      maxLength={100}
                    />
                    {businessErrors.accountName && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.accountName}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.accountName || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Account Number
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="accountNumber"
                      value={businessForm.accountNumber}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.accountNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter account number"
                      maxLength={18}
                    />
                    {businessErrors.accountNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.accountNumber}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.accountNumber || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  IFSC Code
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="ifscCode"
                      value={businessForm.ifscCode}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.ifscCode
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="ABCD0001234"
                      maxLength={11}
                    />
                    {businessErrors.ifscCode && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.ifscCode}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.ifscCode || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Branch
                </label>
                {editBusiness ? (
                  <div>
                    <input
                      type="text"
                      name="branch"
                      value={businessForm.branch}
                      onChange={handleBusinessChange}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        businessErrors.branch
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter branch name"
                      maxLength={100}
                    />
                    {businessErrors.branch && (
                      <p className="text-red-500 text-sm mt-1">
                        {businessErrors.branch}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-base text-gray-900 font-medium py-1">
                    {businessForm.branch || (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {editBusiness && (
              <div className="flex gap-4 mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0D0B46] text-white rounded-md hover:bg-[#23206a] disabled:opacity-50"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  onClick={() => setEditBusiness(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </section>
      )}
    </div>
  );
};

export default Account;
