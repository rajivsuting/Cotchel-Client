import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { API, handleApiError } from "../config/api";
import api from "../services/apiService";
import LoadingState from "../components/LoadingState";
import ErrorBoundary from "../components/ErrorBoundary";
import { FiPlus } from "react-icons/fi";
import { india, states, cities } from "../utils/locationData";

const AddressSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [errors, setErrors] = useState({});

  const [newAddress, setNewAddress] = useState({
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

  const [formState, setFormState] = useState({
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

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get(API.ADDRESS.ALL);
      setAddresses(response.data.data || []);

      // Select default address if available
      const defaultAddress = response.data.data?.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to view your addresses");
        navigate("/login", { state: { from: "/address-selection" } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddressClick = (addressId) => {
    setSelectedAddressId(addressId);
  };

  const handleEditClick = (address) => {
    setEditingAddressId(address._id);
    setFormState({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
  };

  const handleCancel = () => {
    setEditingAddressId(null);
    setFormState({
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
  };

  const handleSaveEdit = async (address) => {
    try {
      setLoading(true);
      const response = await api.put(
        API.ADDRESS.UPDATE(address._id),
        formState
      );
      if (response.data.success) {
        await fetchAddresses();
        setEditingAddressId(null);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error updating address:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to update your address");
        navigate("/login", { state: { from: "/address-selection" } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverHereClick = async (address) => {
    try {
      if (!address || !address._id) {
        toast.error("Invalid address selected");
        return;
      }

      // If coming from checkout, go back to checkout with the selected address
      if (location.state?.from === "checkout") {
        navigate("/checkout", {
          state: {
            addressId: address._id,
            from: "address-selection",
          },
        });
        return;
      }

      // If coming from cart, proceed to checkout
      navigate("/checkout", {
        state: {
          addressId: address._id,
          from: "address-selection",
        },
      });
    } catch (error) {
      console.error("Error selecting address:", error);
      toast.error("Failed to select address. Please try again.");
    }
  };

  const handleAddAddressClick = () => {
    setFormVisible(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    validateField(name, value);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "phone":
        if (!value) error = "Phone number is required";
        else if (!/^\d{10}$/.test(value)) error = "Invalid phone number";
        break;
      case "postalCode":
        if (!value) error = "Postal code is required";
        else if (!/^\d{6}$/.test(value)) error = "Invalid postal code";
        break;
      case "addressLine1":
        if (!value) error = "Address line 1 is required";
        break;
      case "city":
        if (!value) error = "City is required";
        break;
      case "state":
        if (!value) error = "State is required";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleStateChange = (state) => {
    setSelectedState(state);
    setNewAddress((prev) => ({ ...prev, state: state.name }));
  };

  const handleCityChange = (e) => {
    setNewAddress((prev) => ({ ...prev, city: e.target.value }));
  };

  const addNewAddressCancel = () => {
    setFormVisible(false);
    setNewAddress({
      name: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      state: "",
      city: "",
      postalCode: "",
      country: india.isoCode,
      isDefault: false,
    });
    setErrors({});
  };

  const handleAddNewAddress = async () => {
    // Validate required fields
    const requiredFields = [
      "name",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
    ];
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!newAddress[field]) {
        newErrors[field] = `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(API.ADDRESS.ADD, newAddress);
      if (response.data.message) {
        await fetchAddresses();
        setFormVisible(false);
        setNewAddress({
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
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error adding address:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to add an address");
        navigate("/login", { state: { from: "/address-selection" } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !addresses.length) {
    return <LoadingState type="card" count={3} />;
  }

  return (
    <ErrorBoundary>
      <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Select Delivery Address
          </h1>
        </div>

        <div className="space-y-6">
          {/* Address List */}
          {addresses.length > 0 ? (
            <div className="space-y-6">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`p-4 ${
                    selectedAddressId === address._id ? "bg-[#0c0b45]/5" : ""
                  }`}
                  onClick={() => handleAddressClick(address._id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedAddressId === address._id
                            ? "border-[#0c0b45]"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedAddressId === address._id && (
                          <div className="w-2 h-2 rounded-full bg-[#0c0b45]" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {address.name}
                          </h3>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 text-xs font-medium text-[#0c0b45] bg-[#0c0b45]/10 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        {selectedAddressId === address._id && (
                          <button
                            className="text-[#0c0b45] hover:text-[#0c0b45]/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(address);
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{address.phone}</p>
                      <p className="text-gray-600 mt-1">
                        {address.addressLine1}
                        {address.addressLine2 &&
                          `, ${address.addressLine2}`}, {address.city},{" "}
                        {address.state}, {address.postalCode}, {address.country}
                      </p>
                    </div>
                  </div>

                  {/* Edit Form */}
                  {editingAddressId === address._id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formState.name}
                            onChange={handleEditInputChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="text"
                            name="phone"
                            value={formState.phone}
                            onChange={handleEditInputChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          name="addressLine1"
                          value={formState.addressLine1}
                          onChange={handleEditInputChange}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                          rows="2"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <textarea
                          name="addressLine2"
                          value={formState.addressLine2}
                          onChange={handleEditInputChange}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                          rows="2"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <select
                            name="state"
                            value={formState.state}
                            onChange={handleEditInputChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                          >
                            <option value="">Select State</option>
                            {states.map((state) => (
                              <option key={state.isoCode} value={state.isoCode}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <select
                            name="city"
                            value={formState.city}
                            onChange={handleEditInputChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                          >
                            <option value="">Select City</option>
                            {cities.map((city) => (
                              <option key={city.name} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formState.postalCode}
                          onChange={handleEditInputChange}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={formState.isDefault}
                          onChange={handleEditInputChange}
                          className="rounded border-gray-300 text-[#0c0b45] focus:ring-[#0c0b45]"
                        />
                        <label className="text-sm text-gray-700">
                          Make this your default address
                        </label>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 text-white bg-[#0c0b45] rounded hover:bg-[#0c0b45]/90"
                          onClick={() => handleSaveEdit(address)}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Deliver Here Button */}
                  {selectedAddressId === address._id &&
                    editingAddressId !== address._id && (
                      <div className="mt-4">
                        <button
                          className="px-6 py-2 text-white bg-[#0c0b45] rounded-md hover:bg-[#0c0b45]/90 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeliverHereClick(address);
                          }}
                        >
                          Deliver Here
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600 text-lg mb-4">
                No addresses found. Please add a new address to proceed with
                your order.
              </p>
            </div>
          )}

          {/* Add New Address Form */}
          {formVisible && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add New Address
                </h2>
                <button
                  onClick={addNewAddressCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newAddress.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                      placeholder="Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      maxLength={10}
                      value={newAddress.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                      placeholder="Phone"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="addressLine1"
                    value={newAddress.addressLine1}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                    rows="2"
                    placeholder="Address Line 1"
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.addressLine1}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <textarea
                    name="addressLine2"
                    value={newAddress.addressLine2}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                    rows="2"
                    placeholder="Address Line 2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-md bg-gray-100"
                      disabled
                    >
                      <option value={india.isoCode}>{india.name}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                      onChange={(e) =>
                        handleStateChange(
                          states.find((s) => s.isoCode === e.target.value)
                        )
                      }
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.isoCode} value={state.isoCode}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="city"
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                      disabled={!selectedState}
                      onChange={handleCityChange}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      maxLength={6}
                      value={newAddress.postalCode}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#0c0b45] focus:border-transparent"
                      placeholder="Postal Code"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={newAddress.isDefault}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-[#0c0b45] focus:ring-[#0c0b45]"
                  />
                  <label className="text-sm text-gray-700">
                    Make this your default address
                  </label>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={addNewAddressCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-4 py-2 text-white ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#0c0b45]"
                    } rounded hover:bg-[#0c0b45]/90`}
                    onClick={handleAddNewAddress}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save & Continue"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Address Button */}
          {!formVisible && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleAddAddressClick}
                className="flex items-center gap-2 px-6 py-3 text-[#0c0b45] border border-[#0c0b45] rounded-md hover:bg-[#0c0b45] hover:text-white transition-colors"
              >
                <FiPlus />
                Add New Address
              </button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AddressSelection;
