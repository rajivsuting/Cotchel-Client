import React, { useState, useEffect } from "react";
import LoadingState from "../../components/LoadingState";
import { toast } from "react-hot-toast";
import {
  FiCheckCircle,
  FiXCircle,
  FiEdit2,
  FiUser,
  FiPhone,
  FiMapPin,
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
  const [editBasic, setEditBasic] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [pendingEditClose, setPendingEditClose] = useState(false);
  const [pendingContactEditClose, setPendingContactEditClose] = useState(false);

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
      // Only update form state if not editing
      if (!editBasic) {
        const user = data.data;
        setBasicForm({
          name: user.fullName || "",
          dateOfBirth: user.dateOfBirth || "",
          gender: user.gender || "",
        });
      }
      if (!editContact) {
        const user = data.data;
        setContactForm({
          email: user.email || "",
          phone: user.phone || user.phoneNumber || "",
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
    }
  }, [data, editBasic, editContact, pendingEditClose, pendingContactEditClose]);

  const handleBasicChange = (e) => {
    setBasicForm({ ...basicForm, [e.target.name]: e.target.value });
  };
  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
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
  const addresses = user?.addresses || [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const sellerDetails = user?.sellerDetails;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
        Welcome
      </h1>
      <h2 className="text-xl font-semibold text-gray-800 mb-8 flex items-center gap-2">
        {user?.fullName || user?.name || user?.email || "Seller"}
      </h2>
      {/* Unified Card for Basic, Contact, and Address */}
      <section className="relative border border-gray-200 rounded-xl bg-white p-6 mb-8">
        {/* Basic Details */}
        <form onSubmit={handleBasicSubmit} className="mb-6">
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

        {/* Contact Information */}
        <form onSubmit={handleContactSubmit} className="mb-6">
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

        {/* Default Address */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiMapPin className="text-[#0D0B46]" /> Default Address
          </h2>
          {defaultAddress ? (
            <div>
              <div className="font-medium text-gray-900">
                {defaultAddress.name}{" "}
                {defaultAddress.isDefault && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[#0D0B46] text-white rounded">
                    Default
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {defaultAddress.addressLine1} {defaultAddress.addressLine2},{" "}
                {defaultAddress.city}, {defaultAddress.state} -{" "}
                {defaultAddress.postalCode}, {defaultAddress.country}
              </div>
              <div className="text-sm text-gray-600">
                Phone: {defaultAddress.phone}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No address added yet.</div>
          )}
        </div>
      </section>

      {/* Seller Details Section */}
      {sellerDetails && (
        <section className="border border-gray-200 rounded-xl bg-white p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiBriefcase className="text-[#0D0B46]" /> Business Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Business Name
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.businessName || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                GSTIN
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.gstin || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                PAN
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.pan || <span className="text-gray-400">-</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Address Line 1
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.addressLine1 || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Address Line 2
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.addressLine2 || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                City
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.city || <span className="text-gray-400">-</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                State
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.state || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Postal Code
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.postalCode || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Bank Name
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.bankName || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Account Holder Name
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.accountName || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Account Number
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.accountNumber || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                IFSC Code
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.ifscCode || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Branch
              </label>
              <div className="text-base text-gray-900 font-medium py-1">
                {sellerDetails.branch || (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Account;
