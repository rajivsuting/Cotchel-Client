import { useState, useEffect, useRef } from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaClipboardList,
  FaPinterestP,
  FaHeadset,
  FaTimes,
  FaStore,
  FaHistory,
  FaFire,
  FaSearch,
  FaUserPlus,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import {
  BsSearch,
  BsCart3,
  BsHeart,
  BsPerson,
  BsChevronDown,
  BsList,
  BsTag,
  BsClock,
} from "react-icons/bs";
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import { IoMdMenu } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCategories } from "../hooks/useCategories";
import api from "../services/apiService";
import { API } from "../config/api";
import { useSelector, useDispatch } from "react-redux";
import { setCartCount } from "../redux/slices/cartSlice";
import { extractCartData } from "../utils/cartUtils";

const Navbar = () => {
  const { isAuthenticated, logout, user, checkAuth } = useAuth();
  console.log(user);
  const {
    categories = [],
    loading: categoriesLoading,
    error,
  } = useCategories();
  const navigate = useNavigate();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchProducts, setSearchProducts] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches] = useState([
    "iPhone 15",
    "Samsung Galaxy",
    "Laptop",
    "Headphones",
    "Smart Watch",
    "Camera",
    "Gaming Console",
    "Tablet",
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mobileOpenCategory, setMobileOpenCategory] = useState(null);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const categoriesRef = useRef(null);
  const categoriesButtonRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const dispatch = useDispatch();
  const cartCount = useSelector((state) => state.cart.count);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [searchError, setSearchError] = useState("");

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing recent searches:", error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const updated = [
      trimmedQuery,
      ...recentSearches.filter((q) => q !== trimmedQuery),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // Handle search input changes with debounce
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
    setSearchError(""); // Clear error on input change

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(async () => {
      if (query.trim().length > 0) {
        try {
          setIsLoadingSuggestions(true);
          // --- DEBUG: Log the query being sent
          console.log("Searching for:", query);

          const response = await api.get(
            `${API.PRODUCTS.ENHANCED_SUGGESTIONS}?query=${encodeURIComponent(
              query
            )}`
          );

          // --- DEBUG: Log the API response
          console.log("Search API response:", response);

          // Defensive: Check for data shape
          if (response.data && response.data.data) {
            setSearchSuggestions(response.data.data.suggestions || []);
            setSearchProducts(response.data.data.products || []);
          } else {
            setSearchSuggestions([]);
            setSearchProducts([]);
          }
        } catch (error) {
          console.error("Error fetching search suggestions:", error);
          setSearchSuggestions([]);
          setSearchProducts([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSearchSuggestions([]);
        setSearchProducts([]);
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchError("Type something.");
      setSearchQuery("");
      return;
    }
    setSearchError("");
    saveRecentSearch(searchQuery);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSuggestions(false);
    setSearchQuery("");
    setSelectedSuggestionIndex(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    saveRecentSearch(suggestion);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
    setSearchQuery("");
    setSelectedSuggestionIndex(-1);
  };

  // Handle recent search click
  const handleRecentSearchClick = (search) => {
    saveRecentSearch(search);
    navigate(`/search?q=${encodeURIComponent(search)}`);
    setShowSuggestions(false);
    setSearchQuery("");
  };

  // Handle popular search click
  const handlePopularSearchClick = (search) => {
    saveRecentSearch(search);
    navigate(`/search?q=${encodeURIComponent(search)}`);
    setShowSuggestions(false);
    setSearchQuery("");
  };

  // Update: Always navigate to /search?q=... for all search dropdown actions

  // Update handleProductCardClick to use product title and navigate to search
  const handleProductCardClick = (productTitle) => {
    saveRecentSearch(productTitle);
    navigate(`/search?q=${encodeURIComponent(productTitle)}`);
    setShowSuggestions(false);
    setSearchQuery("");
    setSelectedSuggestionIndex(-1);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const totalItems =
      searchProducts.length +
      searchSuggestions.length +
      recentSearches.length +
      popularSearches.length;

    if (!showSuggestions || totalItems === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex > -1) {
          if (selectedSuggestionIndex < searchProducts.length) {
            // Navigate to product
            const product = searchProducts[selectedSuggestionIndex];
            handleProductCardClick(product.title);
          } else if (
            selectedSuggestionIndex <
            searchProducts.length + searchSuggestions.length
          ) {
            const suggestionIndex =
              selectedSuggestionIndex - searchProducts.length;
            handleSuggestionClick(searchSuggestions[suggestionIndex]);
          } else if (
            selectedSuggestionIndex <
            searchProducts.length +
              searchSuggestions.length +
              recentSearches.length
          ) {
            const recentIndex =
              selectedSuggestionIndex -
              searchProducts.length -
              searchSuggestions.length;
            handleRecentSearchClick(recentSearches[recentIndex]);
          } else {
            const popularIndex =
              selectedSuggestionIndex -
              searchProducts.length -
              searchSuggestions.length -
              recentSearches.length;
            handlePopularSearchClick(popularSearches[popularIndex]);
          }
        } else {
          handleSearchSubmit(e);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close suggestions if clicking outside the search container
      // and not on a product card or suggestion item
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Check if the click is on a button or interactive element within the suggestions
        const isClickOnSuggestion =
          event.target.closest("button") ||
          event.target.closest("a") ||
          event.target.closest('[role="button"]');

        if (!isClickOnSuggestion) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Simple scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Handle clicks outside menu, search, and categories
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle search
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchActive(false);
      }

      // Handle mobile menu - but don't close if clicking on categories inside
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
        setIsMobileCategoriesOpen(false);
        setMobileOpenCategory(null);
      }

      // Handle categories dropdown - only for desktop, not mobile menu
      if (
        !isMobileMenuOpen && // Only handle categories dropdown outside clicks when mobile menu is closed
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target) &&
        !categoriesButtonRef.current?.contains(event.target) &&
        isCategoriesOpen
      ) {
        setIsCategoriesOpen(false);
        setHoveredCat(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen, isCategoriesOpen, isMobileCategoriesOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  // Simple mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsCategoriesOpen(false);
    setIsMobileCategoriesOpen(false);
    setMobileOpenCategory(null);
  };

  // Toggle mobile search
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
  };

  // Simple categories toggle
  const toggleCategories = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsCategoriesOpen((prev) => !prev);
    if (isCategoriesOpen) {
      setHoveredCat(null);
    }
  };

  // Handle category hover with error handling
  const handleCategoryHover = (categoryId) => {
    setHoveredCat(categoryId);
  };

  // Handle category leave with error handling
  const handleCategoryLeave = () => {
    setHoveredCat(null);
  };

  const handleProtectedAction = (path) => {
    if (!isAuthenticated()) {
      navigate("/login", { state: { from: path } });
    } else {
      navigate(path);
    }
  };

  const handleApiError = (err) => {
    if (err.response?.data?.message) {
      return err.response.data.message;
    } else if (err.message) {
      return err.message;
    } else {
      return "An unexpected error occurred.";
    }
  };

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await api.get(API.CART.GET, { withCredentials: true });
        const { count } = extractCartData(response);
        dispatch(setCartCount(count));
      } catch (error) {
        dispatch(setCartCount(0));
      }
    };

    if (
      isAuthenticated &&
      typeof isAuthenticated === "function" &&
      isAuthenticated()
    ) {
      fetchCartCount();
    } else {
      // Clear cart count when user is not authenticated
      dispatch(setCartCount(0));
    }
  }, [isAuthenticated, dispatch]);

  return (
    <nav
      className={`w-full font-sans sticky top-0 z-50 ${
        scrolled ? "shadow-lg" : ""
      }`}
    >
      {/* Top Layer - Welcome & Social (hidden on smaller screens) */}
      <div className="bg-[#0D0B46] text-white py-2 border-b border-[#23206a] hidden sm:block">
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-4 flex justify-between items-center">
          <p className="tracking-wide text-xs md:text-sm font-light">
            Welcome to Cotchel online eCommerce store
          </p>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden md:inline text-xs text-gray-300">
              Follow us:
            </span>
            <div className="flex gap-2">
              <a
                href="#"
                className="p-1 rounded-full hover:bg-white/20 transition-all transform hover:scale-110 cursor-pointer"
                aria-label="Facebook"
              >
                <FaFacebook className="text-xs md:text-sm" />
              </a>
              <a
                href="#"
                className="p-1 rounded-full hover:bg-white/20 transition-all transform hover:scale-110 cursor-pointer"
                aria-label="Twitter"
              >
                <FaTwitter className="text-xs md:text-sm" />
              </a>
              <a
                href="#"
                className="p-1 rounded-full hover:bg-white/20 transition-all transform hover:scale-110 cursor-pointer"
                aria-label="Pintrest"
              >
                <FaPinterestP className="text-xs md:text-sm" />
              </a>
              <a
                href="#"
                className="p-1 rounded-full hover:bg-white/20 transition-all transform hover:scale-110 cursor-pointer"
                aria-label="Instagram"
              >
                <FaInstagram className="text-xs md:text-sm" />
              </a>
              <a
                href="#"
                className="p-1 rounded-full hover:bg-white/20 transition-all transform hover:scale-110 cursor-pointer"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-xs md:text-sm" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layer - Logo, Search, Actions */}
      <div
        className={`bg-[#0D0B46] text-white py-3 transition-all duration-300 ${
          scrolled ? "py-2" : ""
        }`}
      >
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-4 flex items-center justify-between gap-2">
          {/* Left Side - Logo and Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <button
              className="md:hidden text-white flex items-center justify-center cursor-pointer"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <IoMdMenu className="text-xl" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 cursor-pointer">
              <img
                src="/logo.png"
                alt="Cotchel Logo"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Search Bar (hidden on mobile) */}
          <div className="hidden md:block w-full max-w-xl flex-1 mx-8">
            <div className="relative group" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder={
                    searchError
                      ? searchError
                      : "Search for products, brands and more..."
                  }
                  className={`w-full px-4 py-2 pl-10 rounded-md text-gray-800 focus:outline-none border-2 shadow-md transition-all group-hover:shadow-lg bg-white/95 ${
                    searchError
                      ? "border-red-500 placeholder-red-400"
                      : "border-transparent focus:border-[#0D0B46]"
                  }`}
                  value={searchError ? "" : searchQuery}
                  onChange={(e) => {
                    handleSearchChange(e);
                    if (searchError) setSearchError("");
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                />

                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-600  transition-all cursor-pointer"
                >
                  <BsSearch />
                </button>
              </form>

              {/* Enhanced Search Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-[600px] overflow-y-auto scrollbar-hide">
                  {/* Product Cards */}
                  {searchQuery.trim().length > 0 &&
                    searchProducts.length > 0 && (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FaSearch className="text-[#0D0B46]" />
                            Products
                          </h3>
                        </div>
                        <div className="py-1">
                          {searchProducts.map((product, index) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleProductCardClick(product.title); // Use title, not id
                              }}
                              className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-0 bg-transparent ${
                                index === selectedSuggestionIndex
                                  ? "bg-gray-50"
                                  : ""
                              }`}
                              onMouseEnter={() =>
                                setSelectedSuggestionIndex(index)
                              }
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image || "/placeholder.png"}
                                  alt={product.title}
                                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                  onError={(e) => {
                                    e.target.src = "/placeholder.png";
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {product.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 truncate">
                                    {product.brand} • {product.seller}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-semibold text-[#0D0B46]">
                                      ₹{product.price?.toLocaleString()}
                                    </span>
                                    {product.compareAtPrice &&
                                      product.compareAtPrice >
                                        product.price && (
                                        <span className="text-xs text-gray-500 line-through">
                                          ₹
                                          {product.compareAtPrice?.toLocaleString()}
                                        </span>
                                      )}
                                    {product.ratings > 0 && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-yellow-500">
                                          ★
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {product.ratings}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                  {/* Search Suggestions */}
                  {searchQuery.trim().length > 0 && (
                    <>
                      {isLoadingSuggestions ? (
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0D0B46]"></div>
                            <span className="text-sm text-gray-500">
                              Searching...
                            </span>
                          </div>
                        </div>
                      ) : searchSuggestions.length > 0 ? (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <FaSearch className="text-[#0D0B46]" />
                              Suggestions
                            </h3>
                          </div>
                          <div className="py-1">
                            {searchSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() =>
                                  handleSuggestionClick(suggestion)
                                }
                                className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 cursor-pointer ${
                                  index + searchProducts.length ===
                                  selectedSuggestionIndex
                                    ? "bg-gray-50"
                                    : ""
                                }`}
                                onMouseEnter={() =>
                                  setSelectedSuggestionIndex(
                                    index + searchProducts.length
                                  )
                                }
                              >
                                <div className="flex items-center gap-3">
                                  <BsSearch className="text-gray-400 flex-shrink-0" />
                                  <span className="truncate">{suggestion}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-500">
                            No suggestions found
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FaHistory className="text-[#0D0B46]" />
                            Recent Searches
                          </h3>
                          <button
                            onClick={clearRecentSearches}
                            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <div className="py-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentSearchClick(search)}
                            className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors duration-200 cursor-pointer ${
                              index +
                                searchProducts.length +
                                searchSuggestions.length ===
                              selectedSuggestionIndex
                                ? "bg-gray-50"
                                : ""
                            }`}
                            onMouseEnter={() =>
                              setSelectedSuggestionIndex(
                                index +
                                  searchProducts.length +
                                  searchSuggestions.length
                              )
                            }
                          >
                            <div className="flex items-center gap-3">
                              <BsClock className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{search}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = recentSearches.filter(
                                  (_, i) => i !== index
                                );
                                setRecentSearches(updated);
                                localStorage.setItem(
                                  "recentSearches",
                                  JSON.stringify(updated)
                                );
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Popular Searches */}
                  {(!searchQuery.trim() || searchQuery.trim().length === 0) && (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FaFire className="text-[#0D0B46]" />
                          Popular Searches
                        </h3>
                      </div>
                      <div className="py-1">
                        {popularSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handlePopularSearchClick(search)}
                            className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 cursor-pointer ${
                              index +
                                searchProducts.length +
                                searchSuggestions.length +
                                recentSearches.length ===
                              selectedSuggestionIndex
                                ? "bg-gray-50"
                                : ""
                            }`}
                            onMouseEnter={() =>
                              setSelectedSuggestionIndex(
                                index +
                                  searchProducts.length +
                                  searchSuggestions.length +
                                  recentSearches.length
                              )
                            }
                          >
                            <div className="flex items-center gap-3">
                              <FaFire className="text-orange-400 flex-shrink-0" />
                              <span className="truncate">{search}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Search Action */}
                  {searchQuery.trim().length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full text-left text-sm text-gray-500 hover:text-[#0D0B46] transition-colors"
                      >
                        Press Enter to search for "{searchQuery}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-5">
            {(!isAuthenticated() || (user && !user.sellerDetails)) && (
              <button
                type="button"
                className="hidden md:flex items-center text-white  px-4 py-2 rounded-md font-semibold shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
                onClick={() => {
                  navigate("/become-seller");
                }}
              >
                <span>Become a Seller</span>
              </button>
            )}

            {/* Mobile Search Toggle */}
            <button
              className="md:hidden p-2 text-white cursor-pointer"
              onClick={toggleSearch}
              aria-label="Toggle search"
            >
              <BsSearch className="text-lg" />
            </button>

            <div className="flex items-center gap-1 sm:gap-3">
              <button
                className="relative p-2 rounded-full text-white hover:text-gray-200 transition-all cursor-pointer"
                onClick={() => handleProtectedAction("/cart")}
                aria-label="Cart"
              >
                <BsCart3 className="text-lg" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                className="p-2 rounded-full text-white hover:text-gray-200 transition-all hidden sm:block cursor-pointer"
                onClick={() => handleProtectedAction("/buyer/wishlist")}
                aria-label="Wishlist"
              >
                <BsHeart className="text-lg" />
              </button>

              <button
                className="p-2 rounded-full text-white hover:text-gray-200 transition-all cursor-pointer"
                onClick={() => handleProtectedAction("/buyer/profile")}
                aria-label="Account"
              >
                <BsPerson className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (slides down when active) */}
      <div
        className={`bg-[#0D0B46] transition-all duration-300 md:hidden overflow-visible ${
          isSearchActive
            ? "max-h-16 pb-3 px-4 opacity-100"
            : "max-h-0 opacity-0"
        }`}
        ref={searchRef}
      >
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder={searchError ? searchError : "Search products..."}
            className="w-full px-4 py-2 pl-10 rounded-md text-gray-800 focus:outline-none border-2 shadow-md transition-all group-hover:shadow-lg bg-white/95"
            value={searchError ? "" : searchQuery}
            onChange={(e) => {
              handleSearchChange(e);
              if (searchError) setSearchError("");
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <BsSearch />
          </div>
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-[#0D0B46] text-white shadow hover:bg-[#23206a] transition-all cursor-pointer"
          >
            <BsSearch />
          </button>

          {/* Mobile Search Suggestions */}
          {showSuggestions && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999] max-h-[600px] overflow-y-auto scrollbar-hide"
              style={{ zIndex: 9999 }}
            >
              {/* Product Cards */}
              {searchQuery.trim().length > 0 && searchProducts.length > 0 && (
                <>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaSearch className="text-[#0D0B46]" />
                      Products
                    </h3>
                  </div>
                  <div className="py-1">
                    {searchProducts.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleProductCardClick(product.title);
                        }}
                        className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-0 bg-transparent ${
                          index === selectedSuggestionIndex ? "bg-gray-50" : ""
                        }`}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || "/placeholder.png"}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.target.src = "/placeholder.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {product.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {product.brand} • {product.seller}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-semibold text-[#0D0B46]">
                                ₹{product.price?.toLocaleString()}
                              </span>
                              {product.compareAtPrice &&
                                product.compareAtPrice > product.price && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₹{product.compareAtPrice?.toLocaleString()}
                                  </span>
                                )}
                              {product.ratings > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-yellow-500">
                                    ★
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {product.ratings}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Search Suggestions */}
              {searchQuery.trim().length > 0 && (
                <>
                  {isLoadingSuggestions ? (
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0D0B46]"></div>
                        <span className="text-sm text-gray-500">
                          Searching...
                        </span>
                      </div>
                    </div>
                  ) : searchSuggestions.length > 0 ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FaSearch className="text-[#0D0B46]" />
                          Suggestions
                        </h3>
                      </div>
                      <div className="py-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 cursor-pointer ${
                              index + searchProducts.length ===
                              selectedSuggestionIndex
                                ? "bg-gray-50"
                                : ""
                            }`}
                            onMouseEnter={() =>
                              setSelectedSuggestionIndex(
                                index + searchProducts.length
                              )
                            }
                          >
                            <div className="flex items-center gap-3">
                              <BsSearch className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{suggestion}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-500">
                        No suggestions found
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FaHistory className="text-[#0D0B46]" />
                        Recent Searches
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="py-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors duration-200 cursor-pointer ${
                          index +
                            searchProducts.length +
                            searchSuggestions.length ===
                          selectedSuggestionIndex
                            ? "bg-gray-50"
                            : ""
                        }`}
                        onMouseEnter={() =>
                          setSelectedSuggestionIndex(
                            index +
                              searchProducts.length +
                              searchSuggestions.length
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <BsClock className="text-gray-400 flex-shrink-0" />
                          <span className="truncate">{search}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = recentSearches.filter(
                              (_, i) => i !== index
                            );
                            setRecentSearches(updated);
                            localStorage.setItem(
                              "recentSearches",
                              JSON.stringify(updated)
                            );
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Popular Searches */}
              {(!searchQuery.trim() || searchQuery.trim().length === 0) && (
                <>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaFire className="text-[#0D0B46]" />
                      Popular Searches
                    </h3>
                  </div>
                  <div className="py-1">
                    {popularSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handlePopularSearchClick(search)}
                        className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200 cursor-pointer ${
                          index +
                            searchProducts.length +
                            searchSuggestions.length +
                            recentSearches.length ===
                          selectedSuggestionIndex
                            ? "bg-gray-50"
                            : ""
                        }`}
                        onMouseEnter={() =>
                          setSelectedSuggestionIndex(
                            index +
                              searchProducts.length +
                              searchSuggestions.length +
                              recentSearches.length
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <FaFire className="text-orange-400 flex-shrink-0" />
                          <span className="truncate">{search}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Search Action */}
              {searchQuery.trim().length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full text-left text-sm text-gray-500 hover:text-[#0D0B46] transition-colors"
                  >
                    Press Enter to search for "{searchQuery}"
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Bottom Layer - Categories & Links */}
      <div
        className={`bg-white shadow-sm border-b border-gray-200 transition-all duration-300 hidden sm:block ${
          scrolled ? "py-1" : "py-2"
        }`}
      >
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          {/* Left Side - Categories & Track Order */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={categoriesRef}>
              <button
                ref={categoriesButtonRef}
                className="flex items-center gap-2 text-[#0D0B46] font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
                onClick={toggleCategories}
              >
                <span>All Categories</span>
                <BsChevronDown
                  className={`ml-1 transition-transform duration-300 ${
                    isCategoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Categories Dropdown */}
              {isCategoriesOpen && (
                <div
                  ref={categoriesRef}
                  className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                >
                  {categoriesLoading ? (
                    <div className="px-4 py-2 text-gray-500">
                      Loading categories...
                    </div>
                  ) : error ? (
                    <div className="px-4 py-2 text-red-500">{error}</div>
                  ) : Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((category) => (
                      <div
                        key={category._id}
                        className="relative group"
                        onMouseEnter={() => handleCategoryHover(category._id)}
                        onMouseLeave={handleCategoryLeave}
                      >
                        <Link
                          to={`/category/${category.name.toLowerCase()}`}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                          onClick={() => {
                            setIsCategoriesOpen(false);
                            setHoveredCat(null);
                          }}
                        >
                          <span className="text-gray-700">{category.name}</span>
                          {Array.isArray(category.subCategories) &&
                            category.subCategories.length > 0 && (
                              <BsChevronDown className="text-gray-400 group-hover:rotate-180 transition-transform" />
                            )}
                        </Link>

                        {/* Subcategories Dropdown */}
                        {Array.isArray(category.subCategories) &&
                          category.subCategories.length > 0 &&
                          hoveredCat === category._id && (
                            <div className="absolute left-full top-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                              {category.subCategories.map((subCategory) => (
                                <Link
                                  key={subCategory._id}
                                  to={`/category/${category.name.toLowerCase()}/${subCategory.name.toLowerCase()}`}
                                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                                  onClick={() => {
                                    setIsCategoriesOpen(false);
                                    setHoveredCat(null);
                                  }}
                                >
                                  {subCategory.name}
                                </Link>
                              ))}
                            </div>
                          )}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      No categories found
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link
              to="/buyer/orders"
              className="text-[#0D0B46] font-medium hover:text-[#23206a] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FaClipboardList className="h-4 w-4" />
              <span>Track Order</span>
            </Link>
          </div>

          {/* Right Side - Support */}
          <div className="flex items-center gap-4">
            <Link
              to="/customer-support"
              className="text-[#0D0B46] font-medium hover:text-[#23206a] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FaHeadset className="h-4 w-4" />
              <span>Customer Support</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          ref={menuRef}
          className={`bg-white h-full w-72 max-w-[80%] shadow-lg transition-transform duration-300 overflow-y-auto ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-bold text-[#0D0B46]">Menu</h2>
              <button
                className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer"
                onClick={toggleMobileMenu}
                aria-label="Close menu"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
          </div>

          <div className="px-2 py-4">
            {/* User Actions */}
            <div className="flex flex-col gap-2 mb-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <BsPerson className="text-xl text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Welcome</p>
                  {isAuthenticated() ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProtectedAction("/account")}
                        className="text-[#0D0B46] font-medium text-sm cursor-pointer"
                      >
                        My Account
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={logout}
                        className="text-[#0D0B46] font-medium text-sm cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        to="/login"
                        className="text-[#0D0B46] font-medium text-sm cursor-pointer"
                      >
                        Sign In
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        to="/register"
                        className="text-[#0D0B46] font-medium text-sm cursor-pointer"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="space-y-1">
              {/* Categories with accordion */}
              <div className="py-1">
                <button
                  className="w-full text-left py-2.5 px-4 text-[#0D0B46] hover:bg-gray-50 rounded-lg flex items-center justify-between font-medium cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileCategoriesOpen(!isMobileCategoriesOpen);
                  }}
                >
                  <span>Categories</span>
                  <BsChevronDown
                    className={`transition-transform duration-300 ${
                      isMobileCategoriesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isMobileCategoriesOpen && (
                  <div className="mt-1 pl-4 space-y-0.5 animate-fadeIn">
                    {categoriesLoading ? (
                      <div className="px-4 py-2 text-gray-500">
                        Loading categories...
                      </div>
                    ) : error ? (
                      <div className="px-4 py-2 text-red-500">{error}</div>
                    ) : Array.isArray(categories) && categories.length > 0 ? (
                      categories.map((category) => (
                        <div key={category._id} className="mb-1">
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/category/${category.name.toLowerCase()}`}
                              className="block py-2 px-4 text-[#0D0B46] hover:bg-gray-50 rounded-lg font-medium flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Only navigate if clicking on the text, not the chevron
                                if (!e.target.closest("button")) {
                                  setIsMobileCategoriesOpen(false);
                                  setHoveredCat(null);
                                  setMobileOpenCategory(null);
                                  setIsMobileMenuOpen(false);
                                }
                              }}
                            >
                              {category.name}
                            </Link>
                            {Array.isArray(category.subCategories) &&
                              category.subCategories.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMobileOpenCategory(
                                      mobileOpenCategory === category._id
                                        ? null
                                        : category._id
                                    );
                                  }}
                                  className="p-2 text-gray-500 hover:text-[#0D0B46]"
                                >
                                  <BsChevronDown
                                    className={`transition-transform duration-300 ${
                                      mobileOpenCategory === category._id
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>
                              )}
                          </div>
                          {Array.isArray(category.subCategories) &&
                            category.subCategories.length > 0 &&
                            mobileOpenCategory === category._id && (
                              <div className="pl-4 mt-1">
                                {category.subCategories.map((subCategory) => (
                                  <Link
                                    key={subCategory._id}
                                    to={`/category/${category.name.toLowerCase()}/${subCategory.name.toLowerCase()}`}
                                    className="block py-1.5 px-4 text-gray-600 hover:text-[#0D0B46] hover:bg-gray-50 rounded-lg text-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsMobileCategoriesOpen(false);
                                      setHoveredCat(null);
                                      setMobileOpenCategory(null);
                                      setIsMobileMenuOpen(false);
                                    }}
                                  >
                                    {subCategory.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        No categories found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link
                to="/buyer/orders"
                className="flex items-center gap-2 py-2.5 px-4 text-[#0D0B46] hover:bg-gray-50 rounded-lg font-medium cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaClipboardList className="h-4 w-4" />
                <span>Track Order</span>
              </Link>

              <Link
                to="/customer-support"
                className="flex items-center gap-2 py-2.5 px-4 text-[#0D0B46] hover:bg-gray-50 rounded-lg font-medium cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaHeadset className="h-4 w-4" />
                <span>Customer Support</span>
              </Link>

              <Link
                to="/buyer/wishlist"
                className="flex items-center gap-2 py-2.5 px-4 text-[#0D0B46] hover:bg-gray-50 rounded-lg font-medium cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BsHeart className="h-4 w-4" />
                <span>Wishlist</span>
              </Link>
              {/* Addresses link for buyers only */}
              {user && user.role === "Buyer" && (
                <Link
                  to="/buyer/manage-address"
                  className="flex items-center gap-2 py-2.5 px-4 text-[#0D0B46] hover:bg-gray-50 rounded-lg font-medium cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaMapMarkerAlt className="h-4 w-4" />
                  <span>Addresses</span>
                </Link>
              )}

              <button
                className="flex items-center gap-2 py-2.5 px-4 text-[#0D0B46] hover:bg-gray-50 rounded-lg font-medium cursor-pointer w-full text-left"
                onClick={() => {
                  handleProtectedAction("/cart");
                  setIsMobileMenuOpen(false);
                }}
              >
                <BsCart3 className="h-4 w-4" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="ml-auto bg-red-500 text-xs text-white rounded-full px-2 py-0.5 font-bold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Switch to Seller (Mobile Only) */}
              {user?.isVerifiedSeller && (
                <>
                  <button
                    className="w-full bg-[#0D0B46] text-white hover:bg-[#23206a] py-2.5 px-4 rounded-lg font-medium shadow-md transition-all text-center cursor-pointer block mt-4 disabled:opacity-60 flex items-center justify-center gap-2"
                    disabled={switching}
                    onClick={async () => {
                      setSwitching(true);
                      setSwitchError("");
                      try {
                        // Make the PUT request
                        await api.put(API.USER.UPDATE_ROLE, { role: "Seller" });
                        await checkAuth();
                        navigate("/seller/dashboard");
                        setIsMobileMenuOpen(false);
                      } catch (err) {
                        if (err.response?.status === 403) {
                          setSwitchError(
                            "Authentication issue. Please refresh the page and try again."
                          );
                        } else {
                          setSwitchError(handleApiError(err));
                        }
                      } finally {
                        setSwitching(false);
                      }
                    }}
                  >
                    <FaUserPlus className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {switching ? "Switching..." : "Switch to Seller"}
                    </span>
                  </button>
                  {switchError && (
                    <p className="text-red-500 text-xs mt-2 text-center">
                      {switchError}
                    </p>
                  )}
                </>
              )}

              {/* Logout Button (Mobile Only) */}
              {isAuthenticated() && (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-4"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              )}
            </div>

            {/* Become a Seller (Mobile Menu) */}
            {(!isAuthenticated() || (user && !user.sellerDetails)) && (
              <div className="mt-6 px-4">
                <button
                  type="button"
                  className="w-full bg-[#0D0B46] text-white hover:bg-[#23206a] py-2.5 px-4 rounded-lg font-medium shadow-md transition-all text-center cursor-pointer block"
                  onClick={() => {
                    navigate("/become-seller");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Become a Seller
                </button>
              </div>
            )}

            {/* Social Links */}
            <div className="mt-6 border-t border-gray-100 pt-4 px-4">
              <p className="text-sm text-gray-500 mb-2">Follow us:</p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0D0B46] transition-all cursor-pointer"
                  aria-label="Facebook"
                >
                  <FaFacebook />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0D0B46] transition-all cursor-pointer"
                  aria-label="Twitter"
                >
                  <FaTwitter />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0D0B46] transition-all cursor-pointer"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
                <a
                  href="#"
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-[#0D0B46] transition-all cursor-pointer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// Move style tags here for global effect and to avoid JSX errors
const style = document.createElement("style");
style.innerHTML = `
  .rotate-180 { transform: rotate(180deg); }
  .rotate-270 { transform: rotate(-90deg); }
  .animate-fadeIn { animation: fadeIn 0.2s ease-in-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("navbar-global-style")
) {
  style.id = "navbar-global-style";
  document.head.appendChild(style);
}
