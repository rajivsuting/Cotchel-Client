import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/apiService";
import { API } from "../../config/api";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Download,
  X,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const themeColor = "#0c0b45";

const SellerProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(API.PRODUCTS.DETAILS(id));
        setProduct(res.data.product);
      } catch (err) {
        setError(err.response?.data?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Skeleton loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Skeleton Header */}
          <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-4">
              <Skeleton circle width={40} height={40} />
              <div>
                <Skeleton width={200} height={24} />
                <Skeleton width={100} height={16} />
              </div>
            </div>
            <div className="flex space-x-3">
              <Skeleton width={100} height={36} />
              <Skeleton width={100} height={36} />
              <Skeleton width={100} height={36} />
            </div>
          </div>

          {/* Skeleton Content */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Skeleton Images */}
              <div className="space-y-4">
                <Skeleton width={100} height={24} />
                <Skeleton height={256} />
                <div className="flex space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} width={80} height={80} />
                  ))}
                </div>
              </div>

              {/* Skeleton Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i}>
                      <Skeleton width={80} height={16} />
                      <Skeleton width={120} height={20} />
                    </div>
                  ))}
                </div>
                <div>
                  <Skeleton width={120} height={16} />
                  <Skeleton width={200} height={20} />
                </div>
              </div>
            </div>

            {/* Skeleton Additional Sections */}
            <div className="mt-8 space-y-8 border-t border-gray-200 pt-8">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton width={150} height={24} />
                  <Skeleton count={3} height={20} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center border border-gray-200">
          <p className="text-red-600 mb-4 font-medium">
            {error || "Product not found"}
          </p>
          <button
            onClick={() => navigate("/seller/dashboard/products")}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const allImages = [product.featuredImage, ...(product.images || [])];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/seller/dashboard/products")}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{ color: themeColor }}
              >
                {product.title}
              </h1>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {/* Seller actions: edit, activate/deactivate, delete */}
            <button
              onClick={() => {}}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors duration-200 ${
                product.isActive
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {product.isActive ? (
                <ToggleRight size={18} className="mr-2" />
              ) : (
                <ToggleLeft size={18} className="mr-2" />
              )}
              {product.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() =>
                navigate(`/seller/dashboard/products/edit/${product._id}`)
              }
              className="flex items-center px-4 py-2 text-white rounded-md hover:bg-blue-900 text-sm font-medium shadow-sm transition-colors duration-200"
              style={{ backgroundColor: themeColor }}
            >
              <Edit size={18} className="mr-2" />
              Edit
            </button>
            <button
              onClick={() => {}}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium shadow-sm transition-colors duration-200"
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images */}
            <div className="space-y-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: themeColor }}
              >
                Images
              </h2>
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-md border border-gray-200 shadow-sm">
                  <img
                    src={allImages[selectedImage]}
                    alt={product.title}
                    className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {allImages.map((img, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={img}
                        alt={`${product.title} ${index + 1}`}
                        className={`w-20 h-20 object-cover rounded-md border cursor-pointer transition-all duration-200 ${
                          selectedImage === index
                            ? `border-2 shadow-md`
                            : "border-gray-200 hover:shadow-md"
                        }`}
                        style={{
                          borderColor:
                            selectedImage === index ? themeColor : undefined,
                        }}
                        onClick={() => setSelectedImage(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Price
                  </label>
                  <p className="mt-1 text-gray-900 font-semibold">
                    ₹{product.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Compare At Price
                  </label>
                  <p className="mt-1 text-gray-900 font-semibold">
                    {product.compareAtPrice
                      ? `₹${product.compareAtPrice.toFixed(2)}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Stock
                  </label>
                  <p className="mt-1 font-semibold">
                    {product.quantityAvailable} units
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <p className="mt-1 text-gray-600">
                    {typeof product.category === "object"
                      ? product.category?.name
                      : product.category}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Subcategory
                  </label>
                  <p className="mt-1 text-gray-600">
                    {typeof product.subCategory === "object"
                      ? product.subCategory?.name
                      : product.subCategory}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Brand
                  </label>
                  <p className="mt-1 text-gray-600">{product.brand}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <p className="mt-1 text-gray-600">{product.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Lot Size
                  </label>
                  <p className="mt-1 text-gray-600">{product.lotSize}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Dimensions & Weight
                </label>
                <p className="mt-1 text-gray-600">
                  {product.dimensions?.length} x {product.dimensions?.breadth} x{" "}
                  {product.dimensions?.height} cm, {product.dimensions?.weight}{" "}
                  kg
                </p>
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="mt-8 space-y-8 border-t border-gray-200 pt-8">
            {product.description && (
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: themeColor }}
                >
                  Description
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {product.keyHighLights?.length > 0 && (
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: themeColor }}
                >
                  Key Highlights
                </h2>
                <ul className="space-y-2">
                  {product.keyHighLights.map((highlight, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <span
                        className="w-2 h-2 rounded-full mr-3"
                        style={{ backgroundColor: themeColor }}
                      ></span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.fileAttachments?.length > 0 && (
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: themeColor }}
                >
                  Attachments
                </h2>
                <div className="space-y-3">
                  {product.fileAttachments.map((file, index) => (
                    <a
                      key={index}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200"
                      style={{ color: themeColor }}
                    >
                      <span className="flex items-center">
                        <Download size={18} className="mr-2" />
                        {file.split("/").pop()}
                      </span>
                      <span className="text-sm text-gray-500">Download</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProductDetail;
