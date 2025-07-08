import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { API } from "../config/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 10,
    category: searchParams.get("category") || "",
    subCategories: searchParams.get("subCategories") || "",
    sortBy: searchParams.get("sortBy") || "createdAt",
    order: searchParams.get("order") || "desc",
    search: searchParams.get("search") || "",
    ratings: searchParams.get("ratings") || "",
    lotSizeMin: searchParams.get("lotSizeMin") || "",
    lotSizeMax: searchParams.get("lotSizeMax") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    brands: searchParams.get("brands") || "",
    status: searchParams.get("status") || "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API.PRODUCTS.ALL}?${queryParams}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include", // Include cookies if needed
        });

        console.log(response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Oops, we haven't got JSON!");
        }

        const data = await response.json();

        if (data.success) {
          setProducts(data.products);
          setTotalPages(data.totalPages);
          setCurrentPage(data.currentPage);
        } else {
          throw new Error(data.message || "Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setError(error.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    setSearchParams(newFilters);
  };

  const handlePageChange = (page) => {
    handleFilterChange("page", page);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-medium">Error loading products</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Filters
              </h2>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D0B46] focus:ring-[#0D0B46]"
                />
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Price Range
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D0B46] focus:ring-[#0D0B46]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D0B46] focus:ring-[#0D0B46]"
                  />
                </div>
              </div>

              {/* Lot Size Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Lot Size
                </h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.lotSizeMin}
                    onChange={(e) =>
                      handleFilterChange("lotSizeMin", e.target.value)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D0B46] focus:ring-[#0D0B46]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.lotSizeMax}
                    onChange={(e) =>
                      handleFilterChange("lotSizeMax", e.target.value)
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D0B46] focus:ring-[#0D0B46]"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Status
                </h3>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D0B46] focus:ring-[#0D0B46]"
                >
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Sort By
                </h3>
                <select
                  value={`${filters.sortBy}-${filters.order}`}
                  onChange={(e) => {
                    const [sortBy, order] = e.target.value.split("-");
                    handleFilterChange("sortBy", sortBy);
                    handleFilterChange("order", order);
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D0B46] focus:ring-[#0D0B46]"
                >
                  <option value="createdAt-desc">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="ratings-desc">Highest Rated</option>
                  <option value="lotSize-desc">Largest Lot Size</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
                    >
                      <div className="aspect-w-1 aspect-h-1">
                        <img
                          src={product.featuredImage}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center mb-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, index) => (
                              <span key={index}>
                                {index < Math.floor(product.ratings) ? (
                                  <FaStar className="w-4 h-4" />
                                ) : (
                                  <FaRegStar className="w-4 h-4" />
                                )}
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            ({product.reviewsCount})
                          </span>
                        </div>
                        <p className="text-[#0D0B46] font-bold mb-2">
                          ${product.price}
                        </p>
                        {product.compareAtPrice && (
                          <p className="text-gray-500 line-through text-sm">
                            ${product.compareAtPrice}
                          </p>
                        )}
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Lot Size: {product.lotSize}</p>
                          <p>Available: {product.quantityAvailable}</p>
                        </div>
                        <button className="w-full mt-4 bg-[#0D0B46] text-white py-2 rounded-md hover:bg-[#23206a] transition-colors">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-4 py-2 rounded-md ${
                          currentPage === index + 1
                            ? "bg-[#0D0B46] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
