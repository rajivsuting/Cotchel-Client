import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/apiService";
import Swal from "sweetalert2";
import { API, API_CONFIG } from "../../config/api";
import LoadingSpinner from "../../components/LoadingSpinner";

import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ArrowUpDown,
} from "lucide-react";

const SkeletonRow = () => (
  <tr className="animate-pulse opacity-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-md bg-gray-200 mr-3"></div>
        <div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-3 w-20 bg-gray-200 rounded mt-2"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-20 bg-gray-200 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="flex justify-end space-x-2">
        <div className="h-5 w-5 bg-gray-200 rounded"></div>
        <div className="h-5 w-5 bg-gray-200 rounded"></div>
      </div>
    </td>
  </tr>
);

const ProductRow = ({ product, onDelete, onEdit }) => {
  return (
    <tr className="hover:bg-gray-50 transition-opacity duration-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={product.featuredImage || "/placeholder-image.jpg"}
            alt={product.title}
            className="h-10 w-10 rounded-md object-cover mr-3"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">
              <Link
                to={`/seller/dashboard/products/${product._id}`}
                className="hover:underline"
              >
                {product.title}
              </Link>
            </div>
            <div className="text-xs text-gray-500">
              SKU: {product.sku || "N/A"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ₹{product.price.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {product.quantityAvailable}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            product.quantityAvailable > 0
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.quantityAvailable > 0 ? "In Stock" : "Out of Stock"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end items-center space-x-2">
          <button
            onClick={() => onEdit(product._id)}
            className="p-1 rounded-md text-gray-500 hover:text-[#0c0b45] hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label={`Edit ${product.title}`}
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(product._id)}
            className="p-1 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label={`Delete ${product.title}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const SellerStock = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get(API.PRODUCTS.ALL);
        setProducts(response.data.products);
      } catch (err) {
        setError("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to delete this item from stock?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "w-72 p-4 bg-gray-100 rounded-lg shadow-lg",
          icon: "w-12 h-12",
          title: "text-lg font-bold text-gray-800",
          htmlContainer: "text-sm text-gray-600",
          actions: "flex justify-center gap-5",
          confirmButton: "bg-primary text-white py-2 px-4 rounded-lg",
          cancelButton:
            "bg-gray-200 text-primary py-2 px-4 rounded-lg hover:bg-gray-300",
        },
        buttonsStyling: false,
      });

      if (result.isConfirmed) {
        const response = await api.delete(
          `${API.PRODUCTS.DELETE}/${productId}`
        );
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== productId)
        );

        Swal.fire({
          title: "Deleted!",
          text: "The item has been deleted successfully.",
          icon: "success",
          timer: 2000,
          customClass: {
            popup: "w-72 p-4 bg-gray-100 rounded-lg shadow-lg",
            title: "text-lg font-bold text-gray-800",
            htmlContainer: "text-sm text-gray-600",
          },
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = (productId) => {
    navigate(`/seller/dashboard/products/${productId}/edit`);
  };

  const handleExport = async () => {
    try {
      const res = await api.get(API.PRODUCTS.ALL);
      const products = res.data.products || res.data.data || [];
      if (!products.length) return alert("No products to export");
      const csvHeaders = [
        "Title,Brand,Model,Category,SubCategory,Price,CompareAtPrice,Quantity,LotSize,Length,Breadth,Height,Weight,Description,FeaturedImage,Images,FileAttachments,KeyHighlights",
      ];
      const csvRows = products.map((p) =>
        [
          p.title,
          p.brand,
          p.model,
          p.category?.name || p.category,
          p.subCategory?.name || p.subCategory,
          p.price,
          p.compareAtPrice,
          p.quantityAvailable,
          p.lotSize,
          p.length,
          p.breadth,
          p.height,
          p.weight,
          JSON.stringify(p.description),
          p.featuredImage,
          (p.images || []).join(";"),
          (p.fileAttachments || []).join(";"),
          (p.keyHighLights || []).join(";"),
        ]
          .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = csvHeaders.concat(csvRows).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export products");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Stock</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center transition-colors cursor-pointer"
              aria-label="Export products"
              onClick={handleExport}
            >
              <Download size={16} className="mr-2" />
              Export
            </button>
            <button
              onClick={() => navigate("/seller/dashboard/products/add")}
              className="flex items-center px-4 py-2 bg-[#0c0b45] text-white rounded-lg hover:bg-[#14136a] transition-colors cursor-pointer"
              aria-label="Add new product"
            >
              <Plus size={16} className="mr-2" />
              Add Product
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c0b45]/30 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search products"
              />
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-gray-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonRow key={index} />
                    ))
                  : filteredProducts.map((product) => (
                      <ProductRow
                        key={product._id}
                        product={product}
                        onDelete={handleDeleteProduct}
                        onEdit={handleEditProduct}
                      />
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 13H12"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 17H16"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No products found
              </h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your search or add a new product.
              </p>
              <button
                onClick={() => navigate("/add-products?user=seller")}
                className="mt-4 px-4 py-2 bg-[#0c0b45] text-white rounded-lg hover:bg-[#14136a] transition-colors cursor-pointer"
                aria-label="Add new product"
              >
                Add Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerStock;
