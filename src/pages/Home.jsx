import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { FiPackage, FiAward, FiCreditCard, FiHeadphones } from "react-icons/fi";
import "swiper/css";
import "swiper/css/pagination";
import ProductCard from "../components/ProductCard";
import LoadingState from "../components/LoadingState";
import ErrorBoundary from "../components/ErrorBoundary";
import { toast } from "react-hot-toast";
import { API } from "../config/api";
import api, { handleApiError } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { useDispatch } from "react-redux";
import { setCartCount, setCartItems } from "../redux/slices/cartSlice";
import { extractCartData } from "../utils/cartUtils";

// Memoized features array to prevent re-creation
const features = [
  {
    icon: <FiPackage className="w-8 h-8" />,
    title: "FASTED DELIVERY",
    description: "Delivery in 24/H",
  },
  {
    icon: <FiAward className="w-8 h-8" />,
    title: "24 HOURS RETURN",
    description: "100% money-back guarantee",
  },
  {
    icon: <FiCreditCard className="w-8 h-8" />,
    title: "SECURE PAYMENT",
    description: "Your money is safe",
  },
  {
    icon: <FiHeadphones className="w-8 h-8" />,
    title: "SUPPORT 24/7",
    description: "Live contact/message",
  },
];

// Memoized skeleton components
const BannerSkeleton = () => (
  <div className="h-[200px] sm:h-[300px] md:h-[400px] bg-gray-200 animate-pulse rounded-lg"></div>
);

const ProductSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
    <div className="relative aspect-square bg-gray-200 animate-pulse"></div>
    <div className="p-3 flex flex-col flex-grow">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-2/3"></div>
      <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="mt-auto flex gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 flex-1 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Memoized product skeletons
const ProductSkeletons = () => (
  <>
    {Array.from({ length: 20 }, (_, index) => (
      <ProductSkeleton key={index} />
    ))}
  </>
);

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerImagesLoaded, setBannerImagesLoaded] = useState({});
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    cart: false,
    wishlist: false,
  });
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  const abortControllerRef = useRef(null);
  const dataFetchedRef = useRef(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  // Memoized fetch data function
  const fetchData = useCallback(async () => {
    // Skip if data has already been fetched
    if (dataFetchedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Fetch public data without authentication
      const [bannersResponse, productsResponse] = await Promise.all([
        api
          .get(API.BANNERS.ALL, {
            signal: abortControllerRef.current.signal,
          })
          .catch(() => ({
            data: { data: [] },
          })),
        api
          .get(API.PRODUCTS.ALL + "?limit=20&sortBy=createdAt&order=desc", {
            signal: abortControllerRef.current.signal,
          })
          .catch(() => ({
            data: { products: [] },
          })),
      ]);

      // Handle banner data - backend returns { data: banners[] }
      const bannersData = bannersResponse.data?.data || [];
      setBanners(Array.isArray(bannersData) ? bannersData : []);

      // Handle product data
      const productsData = productsResponse.data?.products || [];
      setFeaturedProducts(Array.isArray(productsData) ? productsData : []);

      // Mark data as fetched
      dataFetchedRef.current = true;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      console.error("Error fetching data:", error);
      setError("Failed to load data. Please try again later.");
      setBanners([]);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to reset cache and refetch data
  const resetCacheAndFetch = useCallback(() => {
    dataFetchedRef.current = false;
    setError(null);
    fetchData();
  }, [fetchData]);

  // Memoized wishlist fetch
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated()) return;

    try {
      const response = await api.get(API.WISHLIST.ALL);
      const wishlistProductIds = new Set(
        response.data.wishlist.map((item) => item.productId._id)
      );
      setWishlistItems(wishlistProductIds);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Error fetching wishlist:", error);
      }
    }
  }, [isAuthenticated]);

  // Memoized categories fetch
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get(API.CATEGORIES.ALL);
      if (response.data.success && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
        setCategoriesError(
          response.data.message || "Failed to fetch categories"
        );
      }
    } catch (err) {
      setCategoriesError(
        err.response?.data?.message || "Failed to fetch categories"
      );
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Fetch initial wishlist data only if user is authenticated
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Memoized add to cart handler
  const handleAddToCart = useCallback(
    async (productId) => {
      if (actionLoading.cart) return;

      try {
        setActionLoading((prev) => ({ ...prev, cart: true }));
        setLoadingProductId(productId);
        const response = await api.post(API.CART.ADD_ITEM, {
          productId,
          quantity: 1,
        });

        if (response.status === 401) {
          toast.info("Please sign in to add items to cart");
          navigate("/login", { state: { from: "/" } });
          return;
        }

        if (response.data && response.data.success && response.data.data) {
          const { items, count } = extractCartData(response);
          dispatch(setCartItems(items));
          dispatch(setCartCount(count));
          toast.success(response.data.message);
        } else {
          toast.error(response.data?.message || "Failed to add item to cart");
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        // Check for authentication errors (401, 403) or if the error message indicates auth issues
        if (
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          error.message?.includes("Authentication required") ||
          error.message?.includes("Please log in")
        ) {
          toast.info("Please sign in to add items to cart");
          navigate("/login", { state: { from: "/" } });
        } else {
          toast.error(handleApiError(error));
        }
      } finally {
        setActionLoading((prev) => ({ ...prev, cart: false }));
        setLoadingProductId(null);
      }
    },
    [actionLoading.cart, navigate, dispatch]
  );

  // Memoized wishlist handler
  const handleWishlist = useCallback(
    async (productId) => {
      if (actionLoading.wishlist) return;

      try {
        setActionLoading((prev) => ({ ...prev, wishlist: true }));
        const isWishlisted = wishlistItems.has(productId);
        const endpoint = isWishlisted ? API.WISHLIST.REMOVE : API.WISHLIST.ADD;

        const response = await api.post(endpoint, { productId });

        if (response.status === 401) {
          toast.info("Please sign in to manage wishlist");
          navigate("/login", { state: { from: "/" } });
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
        // Check for authentication errors (401, 403) or if the error message indicates auth issues
        if (
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          error.message?.includes("Authentication required") ||
          error.message?.includes("Please log in")
        ) {
          toast.info("Please sign in to manage wishlist");
          navigate("/login", { state: { from: "/" } });
        } else {
          toast.error(handleApiError(error));
        }
      } finally {
        setActionLoading((prev) => ({ ...prev, wishlist: false }));
      }
    },
    [actionLoading.wishlist, wishlistItems, navigate]
  );

  // Memoized banner image load handler
  const handleBannerImageLoad = useCallback((bannerId) => {
    setBannerImagesLoaded((prev) => ({
      ...prev,
      [bannerId]: true,
    }));
  }, []);

  // Memoized categories for rendering
  const renderedCategories = useMemo(() => {
    return categories.slice(0, 6);
  }, [categories]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <button
            onClick={resetCacheAndFetch}
            className="bg-[#0D0B46] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with Banner Slider */}
        <section className="py-4 sm:py-6 md:py-8">
          <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
            {loading ? (
              <BannerSkeleton />
            ) : (
              <Swiper
                modules={[Autoplay, Pagination]}
                spaceBetween={0}
                slidesPerView={1}
                pagination={{ clickable: true }}
                autoplay={{
                  delay: 5000,
                  disableOnInteraction: false,
                }}
                className="rounded-lg overflow-hidden h-[200px] sm:h-[300px] md:h-[400px]"
              >
                {banners.map((banner) => (
                  <SwiperSlide key={banner._id} className="h-full">
                    <a
                      href={banner.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full relative"
                    >
                      {!bannerImagesLoaded[banner._id] && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                      )}
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className={`w-full h-full object-cover ${
                          !bannerImagesLoaded[banner._id]
                            ? "opacity-0"
                            : "opacity-100"
                        } transition-opacity duration-300`}
                        loading="lazy"
                        onLoad={() => handleBannerImageLoad(banner._id)}
                      />
                    </a>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="">
          <div className="bg-gray-50 py-6 sm:py-8 md:py-12 px-4">
            <div className="max-w-6xl mx-auto border border-gray-200 rounded-lg bg-white">
              {/* Mobile Layout - Clean horizontal badges */}
              <div className="flex justify-between items-center px-6 py-4 md:hidden">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center text-center"
                  >
                    <div className="text-[#0D0B46] mb-2 flex items-center justify-center w-5 h-5 sm:w-5 sm:h-5">
                      {feature.icon}
                    </div>
                    <span className="text-xs text-gray-700 font-medium text-center leading-tight">
                      {feature.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop Layout - Original horizontal */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-4 p-6 relative ${
                      index !== features.length - 1
                        ? "md:after:absolute md:after:right-0 md:after:top-4 md:after:bottom-4 md:after:w-px md:after:bg-gray-300"
                        : ""
                    } ${
                      index < features.length - 2 && index % 2 === 0
                        ? "md:before:absolute md:before:left-4 md:before:right-4 md:before:bottom-0 md:before:h-px md:before:bg-gray-300"
                        : ""
                    }`}
                  >
                    <div className="text-gray-600 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 tracking-wide">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="pt-0">
          <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 pt-4 pb-8 sm:pt-4 sm:pb-12">
            {/* Mobile Layout - 3 badges per row */}
            <div className="grid grid-cols-3 gap-3 md:hidden">
              {categoriesLoading ? (
                Array.from({ length: 6 }, (_, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center animate-pulse h-10"
                  />
                ))
              ) : categoriesError ? (
                <div className="col-span-3 text-center text-red-500">
                  {categoriesError}
                </div>
              ) : (
                renderedCategories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/category/${category.name.toLowerCase()}`}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center hover:border-[#0D0B46] hover:bg-[#0D0B46]/5 transition-all duration-200"
                  >
                    <span className="text-xs font-medium text-gray-700">
                      {category.name}
                    </span>
                  </Link>
                ))
              )}
            </div>

            {/* Desktop Layout - Original with icons */}
            <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {categoriesLoading ? (
                Array.from({ length: 6 }, (_, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border border-gray-200 rounded-lg flex items-center justify-center animate-pulse"
                  />
                ))
              ) : categoriesError ? (
                <div className="col-span-6 text-center text-red-500">
                  {categoriesError}
                </div>
              ) : (
                renderedCategories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/category/${category.name.toLowerCase()}`}
                    className="group flex flex-col items-center p-3 sm:p-4"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border border-gray-200 rounded-lg flex items-center justify-center mb-2 group-hover:border-[#0D0B46] transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#0D0B46] rounded-md flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm md:text-base font-bold">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-900 text-center group-hover:text-[#0D0B46] transition-colors">
                      {category.name}
                    </h3>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">
              Featured Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {loading ? (
                <ProductSkeletons />
              ) : (
                featuredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    id={product._id}
                    image={product.featuredImage}
                    title={product.title}
                    rating={product.ratings || 0}
                    price={product.price}
                    originalPrice={product.compareAtPrice}
                    onAddToCart={() => handleAddToCart(product._id)}
                    onAddToWishlist={() => handleWishlist(product._id)}
                    isWishlisted={wishlistItems.has(product._id)}
                    isLoading={
                      actionLoading.cart && loadingProductId === product._id
                    }
                    lotSize={product.lotSize}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
          <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
            <div className="bg-[#0D0B46] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-sm sm:text-base text-gray-200 mb-4 sm:mb-6 md:mb-8">
                Stay updated with our latest products and exclusive offers
              </p>
              <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-white text-[#0D0B46] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
};

export default Home;
