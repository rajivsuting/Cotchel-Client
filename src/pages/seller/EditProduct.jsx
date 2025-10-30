import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  sku: "",
  isActive: true,
  files: [],
};

const uploadFiles = async (endpoint, files, fieldName = "images") => {
  const formData = new FormData();
  files.forEach((file) => formData.append(fieldName, file));
  const response = await api.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return response.data;
};

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get(API.CATEGORIES.ALL),
          api.get(`${API.PRODUCTS.ALL}/get/${id}`),
        ]);
        setCategories(catRes.data.data || []);
        const prod = prodRes.data.product;
        setForm({
          ...initialState,
          ...prod,
          category: prod.category?._id || prod.category,
          subCategory: prod.subCategory?._id || prod.subCategory,
          files: prod.fileAttachments || [],
          sku: prod.sku || "",
          isActive: prod.isActive !== undefined ? prod.isActive : true,
        });
      } catch (err) {
        setError("Failed to fetch product or categories");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [id]);

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
    const trimmedHighlights = form.keyHighLights
      .map((h) => h.trim())
      .filter((h) => h);
    let errors = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.brand.trim()) errors.brand = "Brand is required";
    if (!form.model.trim()) errors.model = "Model is required";
    if (!form.sku.trim()) errors.sku = "SKU is required";
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
    if (!form.lotSize || isNaN(form.lotSize) || Number(form.lotSize) < 1)
      errors.lotSize = "Lot size is required";
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
    // Check if images are File objects (for size validation)
    if (
      form.images.some(
        (img) =>
          img &&
          typeof img === "object" &&
          "size" in img &&
          img.size > 2 * 1024 * 1024
      )
    )
      errors.images = "Each image must be under 2MB";
    if (
      form.images.some(
        (img) =>
          img &&
          typeof img === "object" &&
          "type" in img &&
          !["image/jpeg", "image/png"].includes(img.type)
      )
    )
      errors.images = "Only JPG/PNG images allowed";
    if (
      form.featuredImage &&
      typeof form.featuredImage === "object" &&
      "size" in form.featuredImage &&
      form.featuredImage.size > 2 * 1024 * 1024
    )
      errors.featuredImage = "Featured image must be under 2MB";
    if (
      form.featuredImage &&
      typeof form.featuredImage === "object" &&
      "type" in form.featuredImage &&
      !["image/jpeg", "image/png"].includes(form.featuredImage.type)
    )
      errors.featuredImage = "Featured image must be JPG or PNG";
    if (
      form.files.some(
        (file) =>
          file &&
          typeof file === "object" &&
          "size" in file &&
          file.size > 5 * 1024 * 1024
      )
    )
      errors.files = "Each file must be under 5MB";
    if (
      form.files.some(
        (file) =>
          file &&
          typeof file === "object" &&
          "type" in file &&
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
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { files, ...rest } = form;
      const payload = {
        ...rest,
        files: files, // Send as 'files' to match server expectation
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
      await api.put(`${API.PRODUCTS.ALL}/${id}`, payload);
      setSuccess("Product updated successfully!");
      setTimeout(() => navigate("/seller/dashboard/products"), 1200);
    } catch (err) {
      setError("Failed to update product");
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Product</h2>
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
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Pricing and Inventory
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.price && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.price}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare At Price
            </label>
            <input
              type="number"
              name="compareAtPrice"
              value={form.compareAtPrice}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
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
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
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
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.lotSize && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.lotSize}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Dimensions and Weight
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length
            </label>
            <input
              type="number"
              name="length"
              value={form.length}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.length && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.length}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Breadth
            </label>
            <input
              type="number"
              name="breadth"
              value={form.breadth}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.breadth && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.breadth}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="number"
              name="height"
              value={form.height}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.height && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.height}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight
            </label>
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            />
            {validationErrors.weight && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.weight}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Product Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
              placeholder="Enter unique SKU"
            />
            {validationErrors.sku && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.sku}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Key Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {form.keyHighLights.map((highlight, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={highlight}
                onChange={(e) => handleHighlightChange(idx, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
              />
              <button
                type="button"
                onClick={() => removeHighlight(idx)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
                aria-label="Remove highlight"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addHighlight}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
          >
            Add Highlight
          </button>
          {validationErrors.keyHighLights && (
            <div className="text-red-500 text-xs mt-1">
              {validationErrors.keyHighLights}
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Images
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Featured Image *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {form.featuredImage && (
              <div className="mt-2 flex items-center">
                <img
                  src={form.featuredImage}
                  alt="Featured"
                  className="w-20 h-20 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, featuredImage: "" }))
                  }
                  className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label="Remove featured image"
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {form.images.map((image, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={image}
                    alt={`Other ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 focus:outline-none"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {validationErrors.images && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.images}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          File Attachments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Attachments
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {form.files.map((file, idx) => (
                <div key={idx} className="relative">
                  <span className="inline-flex items-center bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {file.name}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>
            {validationErrors.files && (
              <div className="text-red-500 text-xs mt-1">
                {validationErrors.files}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Description
        </h3>
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30"
            rows="4"
          />
          {validationErrors.description && (
            <div className="text-red-500 text-xs mt-1">
              {validationErrors.description}
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">
          Product Status
        </h3>
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="w-4 h-4 text-[#0c0b45] bg-gray-100 border-gray-300 rounded focus:ring-[#0c0b45] focus:ring-2"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Product is Active
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Uncheck to deactivate this product. Deactivated products won't be
            visible to customers.
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/seller/dashboard/products")}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#0c0b45] text-white py-3 px-6 rounded-lg hover:bg-[#14136a] focus:outline-none focus:ring-2 focus:ring-[#0c0b45] focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02]"
          >
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
