import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiMoreVertical,
  FiX,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import api from "../../services/apiService";
import { API } from "../../config/api";
import { Country, State, City } from "country-state-city";

const ManageAddress = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState(null);

  // Replace static state/city with dynamic ones from country-state-city
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [states, setStates] = useState(State.getStatesOfCountry("IN"));
  const [cities, setCities] = useState([]);

  // Fetch addresses function
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get(API.ADDRESS.ALL);
      setAddresses(response.data.data);
    } catch (err) {
      setError("Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required";
    if (!/^[6-9]\d{9}$/.test(phone))
      return "Please enter a valid 10-digit phone number starting with 6-9";
    return "";
  };

  const validatePostalCode = (postalCode) => {
    const postalRegex = /^[1-9][0-9]{5}$/;
    if (!postalCode) return "Postal code is required";
    if (!postalRegex.test(postalCode))
      return "Please enter a valid 6-digit postal code";
    return "";
  };

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Full name is required";
        if (!/^[a-zA-Z. ]+$/.test(value.trim()))
          return "Name cannot contain special characters or numbers";
        if (value.trim().length > 40) return "Name cannot exceed 40 characters";
        return "";
      case "phone":
        return validatePhone(value);
      case "addressLine1":
        if (!value.trim()) return "Address line 1 is required";
        if (value.length > 100)
          return "Address line 1 cannot exceed 100 characters";
        return "";
      case "addressLine2":
        if (value && value.length > 100)
          return "Address line 2 cannot exceed 100 characters";
        return "";
      case "city":
        return !value.trim() ? "City is required" : "";
      case "state":
        return !value.trim() ? "State is required" : "";
      case "postalCode":
        return validatePostalCode(value);
      case "country":
        return !value.trim() ? "Country is required" : "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "addressLine2" && key !== "isDefault") {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-container")) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === "checkbox" ? checked : value;

    // Special handling for phone number
    if (name === "phone") {
      // Only allow digits and limit to 10 characters
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field if it's been touched
    if (touched[name] || name === "phone" || name === "postalCode") {
      const error = validateField(name, newValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
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

  const handleEdit = (address) => {
    console.log("Edit clicked for address:", address._id); // Debug log
    setEditingAddress(address._id);
    setFormData({
      name: address.name || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "",
      isDefault: address.isDefault || false,
    });
    setErrors({});
    setTouched({});
    setActiveMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched and validate
    const allTouched = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "addressLine2" && key !== "isDefault") {
        allTouched[key] = true;
      }
    });
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    try {
      if (editingAddress && editingAddress !== "new") {
        await api.put(API.ADDRESS.UPDATE(editingAddress), formData);
        toast.success("Address updated successfully");
      } else {
        await api.post(API.ADDRESS.CREATE, formData);
        toast.success("Address added successfully");
      }
      setEditingAddress(null);
      setFormData({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false,
      });
      setErrors({});
      setTouched({});
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save address");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await api.delete(API.ADDRESS.DELETE(id));
        toast.success("Address deleted successfully");
        fetchAddresses();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete address"
        );
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(API.ADDRESS.UPDATE(id), { isDefault: true });
      toast.success("Default address updated");
      fetchAddresses();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update default address"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D0B46]"></div>
      </div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <div className="w-full mx-auto bg-transparent p-0 mt-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FiMapPin className="text-[#0D0B46]" /> Manage Addresses
        </h1>
      </div>

      <div className="space-y-4">
        {/* Add New Address Card */}
        <div className="border border-gray-200 rounded-xl bg-white p-4 hover:bg-gray-50 transition-colors">
          {editingAddress !== "new" ? (
            <button
              onClick={() => {
                setEditingAddress("new");
                setFormData({
                  name: "",
                  phone: "",
                  addressLine1: "",
                  addressLine2: "",
                  city: "",
                  state: "",
                  postalCode: "",
                  country: "India",
                  isDefault: false,
                });
                setSelectedState("");
                setSelectedCity("");
                setErrors({});
                setTouched({});
              }}
              className="w-full flex items-center gap-3 text-gray-700 hover:text-[#0D0B46] transition-colors"
            >
              <div className="w-10 h-10 bg-[#0D0B46]/10 rounded-full flex items-center justify-center">
                <FiPlus className="w-5 h-5 text-[#0D0B46]" />
              </div>
              <div className="text-left">
                <span className="text-lg font-medium">Add New Address</span>
                <p className="text-sm text-gray-500">
                  Add a new delivery address
                </p>
              </div>
            </button>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add New Address
                </h3>
                <button
                  onClick={() => setEditingAddress(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        errors.name && touched.name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                      maxLength={40}
                    />
                    {errors.name && touched.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        errors.phone && touched.phone
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter 10-digit phone number starting with 6-9"
                      maxLength="10"
                      inputMode="numeric"
                    />
                    {errors.phone && touched.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        errors.addressLine1 && touched.addressLine1
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your street address"
                      maxLength={100}
                    />
                    {errors.addressLine1 && touched.addressLine1 && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.addressLine1}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46]"
                      placeholder="Apartment, suite, etc. (optional)"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        errors.state && touched.state
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
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
                    {errors.state && touched.state && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.state}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="city"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        errors.city && touched.city
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
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
                    {errors.city && touched.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                        errors.postalCode && touched.postalCode
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter 6-digit postal code"
                      maxLength="6"
                    />
                    {errors.postalCode && touched.postalCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="country"
                      value="India"
                      disabled
                      className="w-full border rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
                    />
                    {errors.country && touched.country && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.country}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#0D0B46] border-gray-300 rounded focus:ring-[#0D0B46]"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Set as default address
                  </label>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingAddress(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0D0B46] text-white rounded-md hover:bg-[#23206a]"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {addresses.map((address) => (
          <div key={address._id}>
            <div className="border border-gray-200 rounded-xl bg-white p-4 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1 pr-8 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-gray-900 break-words">
                      {address.name}
                    </div>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-[#0D0B46]/10 text-[#0D0B46] rounded-full flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 break-words">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                    {`, ${address.city}, ${address.state} - ${address.postalCode}, ${address.country}`}
                  </div>
                  <div className="text-sm text-gray-600 break-words">
                    Phone: {address.phone}
                  </div>
                </div>
                <div className="relative menu-container">
                  <button
                    onClick={() =>
                      setActiveMenu(
                        activeMenu === address._id ? null : address._id
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FiMoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  {activeMenu === address._id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                      <button
                        onClick={() => handleEdit(address)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Edit Address
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={() => {
                            handleSetDefault(address._id);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <FiMapPin className="w-4 h-4" />
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleDelete(address._id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Delete Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {editingAddress === address._id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Edit Address
                  </h3>
                  <button
                    onClick={() => setEditingAddress(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                          errors.name && touched.name
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your full name"
                        maxLength={40}
                      />
                      {errors.name && touched.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                          errors.phone && touched.phone
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter 10-digit phone number starting with 6-9"
                        maxLength="10"
                        inputMode="numeric"
                      />
                      {errors.phone && touched.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                          errors.addressLine1 && touched.addressLine1
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter your street address"
                        maxLength={100}
                      />
                      {errors.addressLine1 && touched.addressLine1 && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.addressLine1}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46]"
                        placeholder="Apartment, suite, etc. (optional)"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="state"
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                          errors.state && touched.state
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
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
                      {errors.state && touched.state && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.state}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="city"
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                          errors.city && touched.city
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
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
                      {errors.city && touched.city && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D0B46] ${
                          errors.postalCode && touched.postalCode
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter 6-digit postal code"
                        maxLength="6"
                      />
                      {errors.postalCode && touched.postalCode && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.postalCode}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        value="India"
                        disabled
                        className="w-full border rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
                      />
                      {errors.country && touched.country && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.country}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#0D0B46] border-gray-300 rounded focus:ring-[#0D0B46]"
                    />
                    <label
                      htmlFor="isDefault"
                      className="text-sm text-gray-700"
                    >
                      Set as default address
                    </label>
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setEditingAddress(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0D0B46] text-white rounded-md hover:bg-[#23206a]"
                    >
                      Update Address
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageAddress;
