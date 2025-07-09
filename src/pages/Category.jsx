import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useCategories } from "../hooks/useCategories";
import api from "../services/apiService";
import { API } from "../config/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import {
  addToCart,
  setCartCount,
  setCartItems,
} from "../redux/slices/cartSlice";
import { handleApiError } from "../config/api";
import {
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaSort,
  FaTimes,
} from "react-icons/fa";

const Category = () => {
  const { categoryName, subCategoryName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubCategory, setCurrentSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [actionLoading, setActionLoading] = useState({
    cart: false,
    wishlist: false,
  });
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [expandedFilters, setExpandedFilters] = useState({
    price: true,
    brands: true,
    ratings: true,
    lotSize: true,
  });
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get("minPrice") || 0,
    max: searchParams.get("maxPrice") || 50000,
  });
  const [selectedBrands, setSelectedBrands] = useState(
    searchParams.get("brands")?.split(",") || []
  );
  const [selectedRating, setSelectedRating] = useState(
    searchParams.get("rating") || ""
  );
  const [selectedLotSize, setSelectedLotSize] = useState(
    searchParams.get("lotSize") || ""
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const priceSliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);
  const [pricePoints] = useState([
    0, 500, 1000, 2000, 5000, 10000, 20000, 50000,
  ]);

  // Add state for tracking active filters
  const [activeFilters, setActiveFilters] = useState({
    price: null,
    brands: [],
    ratings: null,
    lotSize: null,
  });

  // Update active filters when filters change
  useEffect(() => {
    const newActiveFilters = {
      price:
        priceRange.min > 0 || priceRange.max < 50000
          ? `${priceRange.min.toLocaleString(
              "en-IN"
            )} - ₹${priceRange.max.toLocaleString("en-IN")}`
          : null,
      brands: selectedBrands,
      ratings: selectedRating,
      lotSize: selectedLotSize,
    };
    setActiveFilters(newActiveFilters);
  }, [priceRange, selectedBrands, selectedRating, selectedLotSize]);

  // Fetch initial wishlist data only if user is authenticated
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated()) return; // Don't fetch if not authenticated

      try {
        const response = await api.get(API.WISHLIST.ALL);
        const wishlistProductIds = new Set(
          response.data.wishlist.map((item) => item.productId._id)
        );
        setWishlistItems(wishlistProductIds);
      } catch (error) {
        // Only log non-401 errors
        if (error.response?.status !== 401) {
          console.error("Error fetching wishlist:", error);
        }
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  const handleAddToCart = async (productId) => {
    if (actionLoading.cart) return;

    try {
      setActionLoading((prev) => ({ ...prev, cart: true }));
      setLoadingProductId(productId);
      const response = await api.post(
        API.CART.ADD_ITEM,
        { productId, quantity: 1 },
        { withCredentials: true }
      );

      if (response.status === 401) {
        toast.info("Please sign in to add items to cart");
        navigate("/login", { state: { from: window.location.pathname } });
        return;
      }

      if (response.data && response.data.success && response.data.data) {
        const cartData = response.data.data;
        if (cartData.items && Array.isArray(cartData.items)) {
          dispatch(setCartItems(cartData.items));
          dispatch(setCartCount(cartData.items.length));
          toast.success(response.data.message);
        }
      } else {
        toast.error(response.data?.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.response?.status === 401) {
        toast.info("Please sign in to add items to cart");
        navigate("/login", { state: { from: window.location.pathname } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, cart: false }));
      setLoadingProductId(null);
    }
  };

  const handleWishlist = async (productId) => {
    if (actionLoading.wishlist) return;

    try {
      setActionLoading((prev) => ({ ...prev, wishlist: true }));
      const isWishlisted = wishlistItems.has(productId);
      const endpoint = isWishlisted ? API.WISHLIST.REMOVE : API.WISHLIST.ADD;

      const response = await api.post(endpoint, { productId });

      if (response.status === 401) {
        toast.info("Please sign in to manage wishlist");
        navigate("/login", { state: { from: window.location.pathname } });
        return;
      }

      setWishlistItems((prev) => {
        const newSet = new Set(prev);
        if (isWishlisted) {
          newSet.delete(productId);
          toast.success("Removed from wishlist");
        } else {
          newSet.add(productId);
          toast.success("Added to wishlist");
        }
        return newSet;
      });
    } catch (error) {
      console.error("Error updating wishlist:", error);
      if (error.response?.status === 401) {
        toast.info("Please sign in to manage wishlist");
        navigate("/login", { state: { from: window.location.pathname } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, wishlist: false }));
    }
  };

  // Function to remove a filter
  const removeFilter = (filterType, value = null) => {
    switch (filterType) {
      case "price":
        setPriceRange({ min: 0, max: 50000 });
        handleFilterChange("price", { min: 0, max: 50000 });
        break;
      case "brands":
        const newBrands = selectedBrands.filter((brand) => brand !== value);
        setSelectedBrands(newBrands);
        handleFilterChange("brands", newBrands);
        break;
      case "ratings":
        setSelectedRating(null);
        handleFilterChange("rating", null);
        break;
      case "lotSize":
        setSelectedLotSize(null);
        handleFilterChange("lotSize", null);
        break;
    }
  };

  // Fetch category and subcategory data
  useEffect(() => {
    if (categories && categoryName) {
      const category = categories.find(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      setCurrentCategory(category);

      if (category && subCategoryName) {
        const subCategory = category.subCategories?.find(
          (subCat) =>
            subCat.name.toLowerCase() === subCategoryName.toLowerCase()
        );
        setCurrentSubCategory(subCategory);
      } else {
        setCurrentSubCategory(null);
      }
    }
  }, [categories, categoryName, subCategoryName]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Build params object with proper conditional handling
        const paramsObj = {
          page: currentPage,
          limit: 12,
        };

        // Add category if available
        if (currentCategory?._id) {
          paramsObj.category = currentCategory._id;
        }

        // Add subcategory if available
        if (currentSubCategory?._id) {
          paramsObj.subCategories = currentSubCategory._id;
        }

        // Add sort parameters if available
        const sortByParam = searchParams.get("sortBy");
        if (sortByParam) {
          paramsObj.sortBy = sortByParam;
        }

        const orderParam = searchParams.get("order");
        if (orderParam) {
          paramsObj.order = orderParam;
        }

        // Add price range if set
        if (priceRange.min > 0) {
          paramsObj.minPrice = priceRange.min;
        }
        if (priceRange.max < 50000) {
          paramsObj.maxPrice = priceRange.max;
        }

        // Add brands if selected
        if (selectedBrands.length > 0) {
          paramsObj.brands = selectedBrands.join(",");
        }

        // Add rating if selected
        if (selectedRating) {
          paramsObj.rating = selectedRating;
        }

        // Add lot size if selected
        if (selectedLotSize) {
          paramsObj.lotSize = selectedLotSize;
        }

        const params = new URLSearchParams(paramsObj);
        const response = await api.get(`${API.PRODUCTS.ALL}?${params}`);

        if (response.data.success) {
          setProducts(response.data.products);
          setTotalProducts(response.data.totalProducts);
          setTotalPages(response.data.totalPages);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.response?.data?.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };

    if (currentCategory) {
      fetchProducts();
    }
  }, [
    currentCategory,
    currentSubCategory,
    currentPage,
    searchParams,
    priceRange,
    selectedBrands,
    selectedRating,
    selectedLotSize,
  ]);

  const handleFilterChange = (type, value) => {
    switch (type) {
      case "price":
        setPriceRange(value);
        break;
      case "brands":
        setSelectedBrands(value);
        break;
      case "rating":
        setSelectedRating(value);
        break;
      case "lotSize":
        setSelectedLotSize(value);
        break;
      case "sort":
        setSortBy(value);
        break;
    }
    setCurrentPage(1);
  };

  const toggleFilter = (filter) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }));
  };

  // Handle price slider mouse events
  const handlePriceSliderMouseDown = (e, type) => {
    e.preventDefault();
    setIsDragging(type);
  };

  const handlePriceSliderMouseMove = (e) => {
    if (!isDragging || !priceSliderRef.current) return;

    const slider = priceSliderRef.current;
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newValue = Math.round(percentage * 50000);

    if (isDragging === "min") {
      const newMin = Math.min(newValue, priceRange.max - 500);
      setPriceRange((prev) => ({ ...prev, min: newMin }));
    } else {
      const newMax = Math.max(newValue, priceRange.min + 500);
      setPriceRange((prev) => ({ ...prev, max: newMax }));
    }
  };

  const handlePriceSliderMouseUp = () => {
    if (isDragging) {
      handleFilterChange("price", priceRange);
    }
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handlePriceSliderMouseMove);
      document.addEventListener("mouseup", handlePriceSliderMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handlePriceSliderMouseMove);
      document.removeEventListener("mouseup", handlePriceSliderMouseUp);
    };
  }, [isDragging, priceRange]);

  // Hide sort bar
  const showSortBar = false;

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // FilterControls (reuse for sidebar and modal)
  const FilterControls = (
    <>
      {/* Selected Filters */}
      {(activeFilters.price ||
        activeFilters.brands.length > 0 ||
        activeFilters.ratings ||
        activeFilters.lotSize) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selected Filters
          </h3>
          <div className="space-y-2">
            {activeFilters.price && (
              <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-1.5">
                <span className="text-sm text-gray-600">
                  Price: {activeFilters.price}
                </span>
                <button
                  onClick={() => removeFilter("price")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            )}
            {activeFilters.brands.map((brand) => (
              <div
                key={brand}
                className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-1.5"
              >
                <span className="text-sm text-gray-600">Brand: {brand}</span>
                <button
                  onClick={() => removeFilter("brands", brand)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            ))}
            {activeFilters.ratings && (
              <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-1.5">
                <span className="text-sm text-gray-600">
                  Rating: {activeFilters.ratings}★ & Up
                </span>
                <button
                  onClick={() => removeFilter("ratings")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            )}
            {activeFilters.lotSize && (
              <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-1.5">
                <span className="text-sm text-gray-600">
                  Lot Size: {activeFilters.lotSize}
                </span>
                <button
                  onClick={() => removeFilter("lotSize")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setPriceRange({ min: 0, max: 50000 });
              setSelectedBrands([]);
              setSelectedRating(null);
              setSelectedLotSize(null);
              handleFilterChange("price", { min: 0, max: 50000 });
              handleFilterChange("brands", []);
              handleFilterChange("rating", null);
              handleFilterChange("lotSize", null);
            }}
            className="mt-3 text-sm text-[#0D0B46] hover:text-[#23206a] font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}
      {/* Price Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaFilter className="text-[#0D0B46]" />
            Filters
          </h2>
        </div>
        <div className="border-b border-gray-200">
          <button
            className="w-full flex items-center justify-between p-4 text-gray-700 font-medium hover:bg-gray-50"
            onClick={() => toggleFilter("price")}
          >
            <span>Price Range</span>
            {expandedFilters.price ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expandedFilters.price && (
            <div className="px-4 pb-4">
              <div className="space-y-6">
                {/* Price Range Slider */}
                <div className="relative pt-6">
                  <div
                    ref={priceSliderRef}
                    className="relative h-1 bg-gray-200 rounded-full cursor-pointer"
                  >
                    {/* Track */}
                    <div
                      className="absolute h-full bg-[#0D0B46] rounded-full"
                      style={{
                        left: `${(priceRange.min / 50000) * 100}%`,
                        right: `${100 - (priceRange.max / 50000) * 100}%`,
                      }}
                    />
                    {/* Min Thumb */}
                    <div
                      className="absolute w-4 h-4 bg-white border-2 border-[#0D0B46] rounded-full -top-1.5 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `${(priceRange.min / 50000) * 100}%`,
                      }}
                      onMouseDown={(e) => handlePriceSliderMouseDown(e, "min")}
                    />
                    {/* Max Thumb */}
                    <div
                      className="absolute w-4 h-4 bg-white border-2 border-[#0D0B46] rounded-full -top-1.5 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `${(priceRange.max / 50000) * 100}%`,
                      }}
                      onMouseDown={(e) => handlePriceSliderMouseDown(e, "max")}
                    />
                  </div>
                  {/* Price Points */}
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-between">
                    <div className="text-xs text-gray-500">
                      ₹{priceRange.min.toLocaleString("en-IN")}
                    </div>
                    <div className="flex-1 flex justify-center items-center">
                      <div className="flex justify-between w-full px-4">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gray-300"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      ₹{priceRange.max.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
                {/* Price Inputs */}
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      Min Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => {
                          const value = Math.min(
                            Number(e.target.value),
                            priceRange.max - 500
                          );
                          setPriceRange((prev) => ({
                            ...prev,
                            min: value,
                          }));
                          handleFilterChange("price", {
                            ...priceRange,
                            min: value,
                          });
                        }}
                        className="w-full pl-7 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0D0B46]"
                        min="0"
                        max={priceRange.max - 500}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      Max Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => {
                          const value = Math.max(
                            Number(e.target.value),
                            priceRange.min + 500
                          );
                          setPriceRange((prev) => ({
                            ...prev,
                            max: value,
                          }));
                          handleFilterChange("price", {
                            ...priceRange,
                            max: value,
                          });
                        }}
                        className="w-full pl-7 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0D0B46]"
                        min={priceRange.min + 500}
                        max="50000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Brands Filter */}
        <div className="border-b border-gray-200">
          <button
            className="w-full flex items-center justify-between p-4 text-gray-700 font-medium hover:bg-gray-50"
            onClick={() => toggleFilter("brands")}
          >
            <span>Brands</span>
            {expandedFilters.brands ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expandedFilters.brands && (
            <div className="px-4 pb-4 space-y-2">
              {["Apple", "Samsung", "Sony", "LG", "Bose"].map((brand) => (
                <label key={brand} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={(e) => {
                      const newBrands = e.target.checked
                        ? [...selectedBrands, brand]
                        : selectedBrands.filter((b) => b !== brand);
                      handleFilterChange("brands", newBrands);
                    }}
                    className="rounded text-[#0D0B46] focus:ring-[#0D0B46]"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Lot Size Filter */}
        <div className="border-b border-gray-200">
          <button
            className="w-full flex items-center justify-between p-4 text-gray-700 font-medium hover:bg-gray-50"
            onClick={() => toggleFilter("lotSize")}
          >
            <span>Lot Size</span>
            {expandedFilters.lotSize ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expandedFilters.lotSize && (
            <div className="px-4 pb-4 space-y-2">
              {[
                { value: "1", label: "Single Item" },
                { value: "2-5", label: "2-5 Items" },
                { value: "6-10", label: "6-10 Items" },
                { value: "10+", label: "10+ Items" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="lotSize"
                    checked={selectedLotSize === option.value}
                    onChange={(e) =>
                      handleFilterChange("lotSize", e.target.value)
                    }
                    value={option.value}
                    className="text-[#0D0B46] focus:ring-[#0D0B46]"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Ratings Filter */}
        <div>
          <button
            className="w-full flex items-center justify-between p-4 text-gray-700 font-medium hover:bg-gray-50"
            onClick={() => toggleFilter("ratings")}
          >
            <span>Ratings</span>
            {expandedFilters.ratings ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expandedFilters.ratings && (
            <div className="px-4 pb-4 space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <label key={rating} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    checked={selectedRating === rating.toString()}
                    onChange={(e) =>
                      handleFilterChange("rating", e.target.value)
                    }
                    value={rating}
                    className="text-[#0D0B46] focus:ring-[#0D0B46]"
                  />
                  <span className="text-sm">{rating}★ & Up</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (categoriesLoading) {
    return <LoadingSpinner />;
  }

  if (categoriesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {categoriesError}</div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Category not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 py-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0D0B46]">
            {currentCategory?.name}
            {currentSubCategory && ` > ${currentSubCategory.name}`}
          </h1>
        </div>
      </div>

      <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 py-6">
        {/* Sort Controls */}
        {showSortBar && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaSort className="text-[#0D0B46]" />
              <span className="text-gray-700 font-medium">Sort by:</span>
            </div>
            <div className="flex gap-4">
              {[
                { value: "newest", label: "Newest" },
                { value: "price_low", label: "Price: Low to High" },
                { value: "price_high", label: "Price: High to Low" },
                { value: "rating", label: "Rating" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange("sort", option.value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? "bg-[#0D0B46] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-4">{FilterControls}</div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <button
              className="md:hidden w-full mb-4 flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg p-3 text-gray-700 font-medium hover:bg-gray-50"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <FaFilter className="text-[#0D0B46]" />
              Filters
            </button>

            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      id={product._id}
                      image={product.featuredImage}
                      title={product.title}
                      price={product.price}
                      originalPrice={product.compareAtPrice}
                      rating={product.ratings || 0}
                      lotSize={product.lotSize}
                      isWishlisted={wishlistItems.has(product._id)}
                      onAddToCart={() => handleAddToCart(product._id)}
                      onAddToWishlist={() => handleWishlist(product._id)}
                      isLoading={
                        actionLoading.cart && loadingProductId === product._id
                      }
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No products found in this category
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black bg-opacity-40 lg:hidden">
          <div className="w-full max-w-md bg-white rounded-t-2xl shadow-lg p-0 animate-slideUp relative">
            {/* Sticky header with close button */}
            <div className="sticky top-0 z-10 bg-white px-6 pt-6 pb-2 flex justify-between items-center border-b border-gray-200 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
              <button
                className="text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            {/* Scrollable filter content */}
            <div className="overflow-y-auto max-h-[70vh] px-6 pb-4">
              {FilterControls}
            </div>
            <button
              className="w-full mt-4 py-3 bg-[#0D0B46] text-white rounded-lg font-semibold text-lg hover:bg-[#23206a] transition"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
