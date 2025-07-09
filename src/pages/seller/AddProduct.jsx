import React, { useState, useEffect, useRef } from "react";
import api from "../../services/apiService";
import { API } from "../../config/api";
import { ChevronDown } from "lucide-react";

const initialState = {
  title: "",
  description: "",
  images: [],
  featuredImage: "",
  category: "",
  subCategory: "",
  quantityAvailable: 1,
  price: "",
  compareAtPrice: "",
  keyHighLights: [""],
  brand: "",
  model: "",
  lotSize: 1,
  length: "",
  breadth: "",
  height: "",
  weight: "",
  files: [],
};

// Helper to upload files to the server using API endpoints from config/api.js
const uploadFiles = async (endpoint, files, fieldName = "images") => {
  const formData = new FormData();
  files.forEach((file) => formData.append(fieldName, file));
  const response = await api.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return response.data;
};

const AddProduct = () => {
  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const isCategoryOptionClicking = useRef(false);
  const isSubcategoryOptionClicking = useRef(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get(API.CATEGORIES.ALL);
        setCategories(res.data.data || []);
      } catch (err) {
        setError("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!form.category) return setSubCategories([]);
    const selected = categories.find((cat) => cat._id === form.category);
    setSubCategories(selected?.subCategories || []);
  }, [form.category, categories]);

  useEffect(() => {
    if (form.category) {
      const selected = categories.find((cat) => cat._id === form.category);
      setCategoryInput(selected ? selected.name : "");
    } else {
      setCategoryInput("");
    }
  }, [form.category, categories]);

  useEffect(() => {
    if (form.subCategory) {
      const selected = subCategories.find(
        (sub) => sub._id === form.subCategory
      );
      setSubcategoryInput(selected ? selected.name : "");
    } else {
      setSubcategoryInput("");
    }
  }, [form.subCategory, subCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleHighlightChange = (idx, value) => {
    setForm((prev) => {
      const highlights = [...prev.keyHighLights];
      highlights[idx] = value;
      return { ...prev, keyHighLights: highlights };
    });
  };

  const addHighlight = () => {
    if (form.keyHighLights.length < 10)
      setForm((prev) => ({
        ...prev,
        keyHighLights: [...prev.keyHighLights, ""],
      }));
  };
  const removeHighlight = (idx) => {
    setForm((prev) => {
      const highlights = prev.keyHighLights.filter((_, i) => i !== idx);
      return { ...prev, keyHighLights: highlights };
    });
  };

  // Immediate upload for featured image
  const handleFeaturedImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await uploadFiles(API.IMAGE.UPLOAD, [file]);
      if (data.imageUrls && data.imageUrls.length > 0) {
        setForm((prev) => ({ ...prev, featuredImage: data.imageUrls[0] }));
      } else {
        setError("Failed to upload featured image");
      }
    } catch (err) {
      setError("Failed to upload featured image");
    } finally {
      setLoading(false);
    }
  };

  // Immediate upload for images
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await uploadFiles(API.IMAGE.UPLOAD, files);
      if (data.imageUrls && data.imageUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...data.imageUrls],
        }));
      } else {
        setError("Failed to upload images");
      }
    } catch (err) {
      setError("Failed to upload images");
    } finally {
      setLoading(false);
    }
  };

  // Immediate upload for file attachments
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    setError(null);
    try {
      const data = await uploadFiles(API.IMAGE.UPLOAD_FILE, files, "files");
      if (data.fileUrls && data.fileUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          files: [...prev.files, ...data.fileUrls],
        }));
      } else {
        setError("Failed to upload files");
      }
    } catch (err) {
      setError("Failed to upload files");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (idx) => {
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== idx);
      return { ...prev, images };
    });
  };
  const removeFile = (idx) => {
    setForm((prev) => {
      const files = prev.files.filter((_, i) => i !== idx);
      return { ...prev, files };
    });
  };

  const validateForm = () => {
    // Auto-trim and filter out empty highlights
    const trimmedHighlights = form.keyHighLights
      .map((h) => h.trim())
      .filter((h) => h);
    let errors = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.brand.trim()) errors.brand = "Brand is required";
    if (!form.model.trim()) errors.model = "Model is required";
    if (!form.category) errors.category = "Category is required";
    if (!form.subCategory) errors.subCategory = "Subcategory is required";
    if (!form.price || isNaN(form.price) || Number(form.price) < 0)
      errors.price = "Valid price is required";
    if (
      form.compareAtPrice &&
      (isNaN(form.compareAtPrice) || Number(form.compareAtPrice) < 0)
    )
      errors.compareAtPrice = "Compare At Price must be a positive number";
    if (form.compareAtPrice && Number(form.compareAtPrice) < Number(form.price))
      errors.compareAtPrice =
        "Compare At Price must be greater than or equal to Price";
    if (
      !form.quantityAvailable ||
      isNaN(form.quantityAvailable) ||
      Number(form.quantityAvailable) < 1
    )
      errors.quantityAvailable = "Valid quantity is required";
    if (!form.length || isNaN(form.length) || Number(form.length) < 0)
      errors.length = "Valid length is required";
    if (!form.breadth || isNaN(form.breadth) || Number(form.breadth) < 0)
      errors.breadth = "Valid breadth is required";
    if (!form.height || isNaN(form.height) || Number(form.height) < 0)
      errors.height = "Valid height is required";
    if (!form.weight || isNaN(form.weight) || Number(form.weight) < 0)
      errors.weight = "Valid weight is required";
    if (!form.description.trim())
      errors.description = "Description is required";
    if (!trimmedHighlights.length)
      errors.keyHighLights = "At least one key highlight is required";
    if (trimmedHighlights.some((h) => h.length > 100))
      errors.keyHighLights = "Each key highlight must be under 100 characters";
    if (!form.featuredImage)
      errors.featuredImage = "Featured image is required";
    if (form.images.length > 10)
      errors.images = "Maximum 10 other images allowed";
    if (
      form.images.some(
        (img) => img instanceof File && img.size > 2 * 1024 * 1024
      )
    )
      errors.images = "Each image must be under 2MB";
    if (
      form.images.some(
        (img) =>
          img instanceof File && !["image/jpeg", "image/png"].includes(img.type)
      )
    )
      errors.images = "Only JPG/PNG images allowed";
    if (
      form.featuredImage &&
      form.featuredImage instanceof File &&
      form.featuredImage.size > 2 * 1024 * 1024
    )
      errors.featuredImage = "Featured image must be under 2MB";
    if (
      form.featuredImage &&
      form.featuredImage instanceof File &&
      !["image/jpeg", "image/png"].includes(form.featuredImage.type)
    )
      errors.featuredImage = "Featured image must be JPG or PNG";
    if (
      form.files.some(
        (file) => file instanceof File && file.size > 5 * 1024 * 1024
      )
    )
      errors.files = "Each file must be under 5MB";
    if (
      form.files.some(
        (file) =>
          file instanceof File &&
          ![
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ].includes(file.type)
      )
    )
      errors.files = "Invalid file type for attachments";
    console.log("Validation errors:", errors, form);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    console.log("submit");
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }
    console.log("submit2");
    setLoading(true);
    try {
      // Prepare payload for backend
      const payload = {
        ...form,
        fileAttachments: form.files,
        files: undefined,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice
          ? Number(form.compareAtPrice)
          : undefined,
        quantityAvailable: Number(form.quantityAvailable),
        lotSize: form.lotSize ? Number(form.lotSize) : undefined,
        length: Number(form.length),
        breadth: Number(form.breadth),
        height: Number(form.height),
        weight: Number(form.weight),
      };
      console.log(payload);
      await api.post(API.PRODUCTS.ALL, payload);
      setSuccess("Product added successfully!");
      setForm(initialState);
      setValidationErrors({});
    } catch (err) {
      setError("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categoryInput.toLowerCase())
  );
  const filteredSubCategories = subCategories.filter((sub) =>
    sub.name.toLowerCase().includes(subcategoryInput.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Product</h2>
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-800 p-3 rounded mb-4">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Product Details
        </h3>
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.title && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.title}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              {form.category && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center bg-[#0c0b45] text-white text-xs px-2 py-1 rounded-full">
                    {categories.find((cat) => cat._id === form.category)
                      ?.name || form.category}
                    <button
                      type="button"
                      className="ml-2 text-white hover:text-gray-200 focus:outline-none"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          category: "",
                          subCategory: "",
                        }));
                        setCategoryInput("");
                      }}
                      aria-label="Clear category"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
              <div className="w-full flex items-center relative">
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    setCategoryDropdownOpen(true);
                  }}
                  onFocus={() => setCategoryDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => {
                      if (isCategoryOptionClicking.current) {
                        isCategoryOptionClicking.current = false;
                        return;
                      }
                      setCategoryDropdownOpen(false);
                      setCategoryInput("");
                    }, 150)
                  }
                  placeholder="Select category..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
                />
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2 absolute right-3 pointer-events-none" />
              </div>
              {categoryDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {filteredCategories.length === 0 && (
                    <div className="px-3 py-2 text-gray-400">
                      No results found
                    </div>
                  )}
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat._id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        form.category === cat._id
                          ? "bg-gray-100 font-semibold"
                          : ""
                      }`}
                      onMouseDown={() => {
                        isCategoryOptionClicking.current = true;
                        setForm((prev) => ({
                          ...prev,
                          category: cat._id,
                          subCategory: "",
                        }));
                        setCategoryDropdownOpen(false);
                        setCategoryInput("");
                        setTimeout(() => {
                          isCategoryOptionClicking.current = false;
                        }, 0);
                      }}
                    >
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
              {validationErrors.category && (
                <div className="text-red-500 text-xs mt-1">
                  {validationErrors.category}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory *
              </label>
              {form.subCategory && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center bg-[#0c0b45] text-white text-xs px-2 py-1 rounded-full">
                    {subCategories.find((sub) => sub._id === form.subCategory)
                      ?.name || form.subCategory}
                    <button
                      type="button"
                      className="ml-2 text-white hover:text-gray-200 focus:outline-none"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, subCategory: "" }));
                        setSubcategoryInput("");
                      }}
                      aria-label="Clear subcategory"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
              <div className="w-full flex items-center relative">
                <input
                  type="text"
                  value={subcategoryInput}
                  onChange={(e) => {
                    setSubcategoryInput(e.target.value);
                    setSubcategoryDropdownOpen(true);
                  }}
                  onFocus={() => setSubcategoryDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => {
                      if (isSubcategoryOptionClicking.current) {
                        isSubcategoryOptionClicking.current = false;
                        return;
                      }
                      setSubcategoryDropdownOpen(false);
                      setSubcategoryInput("");
                    }, 150)
                  }
                  placeholder="Select subcategory..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
                />
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2 absolute right-3 pointer-events-none" />
              </div>
              {subcategoryDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {filteredSubCategories.length === 0 && (
                    <div className="px-3 py-2 text-gray-400">
                      No results found
                    </div>
                  )}
                  {filteredSubCategories.map((sub) => (
                    <div
                      key={sub._id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        form.subCategory === sub._id
                          ? "bg-gray-100 font-semibold"
                          : ""
                      }`}
                      onMouseDown={() => {
                        isSubcategoryOptionClicking.current = true;
                        setForm((prev) => ({ ...prev, subCategory: sub._id }));
                        setSubcategoryDropdownOpen(false);
                        setSubcategoryInput("");
                        setTimeout(() => {
                          isSubcategoryOptionClicking.current = false;
                        }, 0);
                      }}
                    >
                      {sub.name}
                    </div>
                  ))}
                </div>
              )}
              {validationErrors.subCategory && (
                <div className="text-red-500 text-xs mt-1">
                  {validationErrors.subCategory}
                </div>
              )}
            </div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-6">
          Pricing Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.price && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.price}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare at Price *
            </label>
            <input
              type="number"
              name="compareAtPrice"
              value={form.compareAtPrice}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.compareAtPrice && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.compareAtPrice}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Available *
            </label>
            <input
              type="number"
              name="quantityAvailable"
              value={form.quantityAvailable}
              onChange={handleChange}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.quantityAvailable && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.quantityAvailable}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lot Size *
            </label>
            <input
              type="number"
              name="lotSize"
              value={form.lotSize}
              onChange={handleChange}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length (cm) *
            </label>
            <input
              type="number"
              name="length"
              value={form.length}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.length && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.length}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Breadth (cm) *
            </label>
            <input
              type="number"
              name="breadth"
              value={form.breadth}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.breadth && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.breadth}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm) *
            </label>
            <input
              type="number"
              name="height"
              value={form.height}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.height && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.height}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (g) *
            </label>
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.weight && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.weight}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-6">
          Description
        </h3>
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Highlights *
            </label>
            {form.keyHighLights.map((hl, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={hl}
                  onChange={(e) => handleHighlightChange(idx, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  maxLength={100}
                />
                {form.keyHighLights.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHighlight(idx)}
                    className="text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {validationErrors.keyHighLights && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.keyHighLights}
              </div>
            )}
            {form.keyHighLights.length < 10 && (
              <button
                type="button"
                onClick={addHighlight}
                className="text-blue-600 mt-1"
              >
                + Add Highlight
              </button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand *
            </label>
            <input
              type="text"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.brand && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.brand}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              name="model"
              value={form.model}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.model && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.model}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {validationErrors.description && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.description}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-6">
          Images
        </h3>
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Featured Image *
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition mb-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const file = Array.from(e.dataTransfer.files).find((f) =>
                f.type.startsWith("image/")
              );
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                setError("Featured image must be under 2MB");
                return;
              }
              setLoading(true);
              setError(null);
              try {
                const data = await uploadFiles(API.IMAGE.UPLOAD, [file]);
                if (data.imageUrls && data.imageUrls.length > 0) {
                  setForm((prev) => ({
                    ...prev,
                    featuredImage: data.imageUrls[0],
                  }));
                } else {
                  setError("Failed to upload featured image");
                }
              } catch (err) {
                setError("Failed to upload featured image");
              } finally {
                setLoading(false);
              }
            }}
            onClick={() =>
              document.getElementById("featured-image-input").click()
            }
          >
            <div className="text-gray-500 mb-2">
              Drag & drop a featured image here or click to select
            </div>
            <div className="text-xs text-gray-400">JPG/PNG only, under 2MB</div>
            <input
              id="featured-image-input"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFeaturedImageChange}
              className="hidden"
            />
          </div>
          {form.featuredImage && (
            <div className="relative inline-block mt-2">
              <img
                src={form.featuredImage}
                alt="Featured Preview"
                className="w-24 h-24 object-cover rounded"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, featuredImage: "" }))
                }
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
                title="Remove featured image"
              >
                ×
              </button>
            </div>
          )}
          {validationErrors.featuredImage && (
            <div className="text-red-500 text-xs mt-1">
              {validationErrors.featuredImage}
            </div>
          )}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Images (max 10)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition mb-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter((f) =>
                  f.type.startsWith("image/")
                );
                if (form.images.length + files.length > 10) {
                  setError("Maximum 10 images allowed");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  const data = await uploadFiles(API.IMAGE.UPLOAD, files);
                  if (data.imageUrls && data.imageUrls.length > 0) {
                    setForm((prev) => ({
                      ...prev,
                      images: [...prev.images, ...data.imageUrls],
                    }));
                  } else {
                    setError("Failed to upload images");
                  }
                } catch (err) {
                  setError("Failed to upload images");
                } finally {
                  setLoading(false);
                }
              }}
              onClick={() =>
                document.getElementById("other-images-input").click()
              }
            >
              <div className="text-gray-500 mb-2">
                Drag & drop images here or click to select
              </div>
              <div className="text-xs text-gray-400">
                Max 10 images, JPG/PNG only, each under 2MB
              </div>
              <input
                id="other-images-input"
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          {validationErrors.images && (
            <div className="text-red-500 text-xs mt-1">
              {validationErrors.images}
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-6">
          File Attachments
        </h3>
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File Attachments (xls, csv, pdf, doc, etc)
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition mb-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files).filter((f) =>
                [
                  "application/vnd.ms-excel",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  "text/csv",
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "application/vnd.ms-powerpoint",
                  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ].includes(f.type)
              );
              setForm((prev) => ({
                ...prev,
                files: [...prev.files, ...files],
              }));
            }}
            onClick={() =>
              document.getElementById("file-attachments-input").click()
            }
          >
            <div className="text-gray-500 mb-2">
              Drag & drop files here or click to select
            </div>
            <div className="text-xs text-gray-400">
              XLS, CSV, PDF, DOC, DOCX, PPT, PPTX only
            </div>
            <input
              id="file-attachments-input"
              type="file"
              accept=".xls,.xlsx,.csv,.pdf,.doc,.docx,.ppt,.pptx"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <ul className="mt-2">
            {form.files.map((file, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {validationErrors.files && (
            <div className="text-red-500 text-xs mt-1">
              {validationErrors.files}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#0c0b45] text-white rounded-lg font-semibold hover:bg-[#14136a] transition-colors disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
