import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaCamera,
  FaCheck,
} from "react-icons/fa";
import { AiOutlineStar } from "react-icons/ai";
import { FiHeart, FiShare2 } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { MdCheckCircle } from "react-icons/md";
import { toast } from "react-hot-toast";
import api from "../services/apiService";
import { API, handleApiError } from "../config/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";
import ErrorBoundary from "../components/ErrorBoundary";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  setCartCount,
  setCartItems,
} from "../redux/slices/cartSlice";
import { extractCartData, fetchAndSyncCart } from "../utils/cartUtils";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

// Custom Magnifier component
function Magnifier({ src, zoom = 2, alt }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef(null);

  const handleMouseEnter = (e) => {
    setShow(true);
    const { width, height } = imgRef.current.getBoundingClientRect();
    setImgSize({ width, height });
  };

  const handleMouseMove = (e) => {
    const { left, top } = imgRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    setPos({ x, y });
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  // Mobile: tap to zoom (show full image)
  const [mobileZoom, setMobileZoom] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

  // Calculate magnifier position so it doesn't overflow viewport
  const getMagnifierStyle = () => {
    const base = {
      position: "absolute",
      pointerEvents: "none",
      top: 0,
      left: imgSize.width + 24, // 24px gap
      width: imgSize.width,
      height: imgSize.height,
      border: "2px solid #0c0b45",
      background: `url(${src}) no-repeat`,
      backgroundSize: `${imgSize.width * zoom}px ${imgSize.height * zoom}px`,
      backgroundPosition: `-${pos.x * (zoom - 1)}px -${pos.y * (zoom - 1)}px`,
      zIndex: 10,
      boxShadow: "0 4px 24px rgba(44,62,80,0.18)",
      borderRadius: 12,
      transition: "opacity 0.18s cubic-bezier(.4,0,.2,1)",
      opacity: show ? 1 : 0,
      backgroundColor: "#fff",
      cursor: "crosshair",
      overflow: "hidden",
    };
    // Prevent overflow on right
    if (typeof window !== "undefined" && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const rightEdge = rect.left + rect.width + 24 + imgSize.width;
      if (rightEdge > window.innerWidth) {
        base.left = -imgSize.width - 24;
      }
    }
    return base;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="object-contain h-full w-full cursor-crosshair"
        style={{
          maxHeight: "100%",
          maxWidth: "100%",
          borderRadius: 12,
          boxShadow: show ? "0 2px 12px rgba(44,62,80,0.10)" : undefined,
          transition: "box-shadow 0.18s cubic-bezier(.4,0,.2,1)",
        }}
        onMouseEnter={isMobile ? undefined : handleMouseEnter}
        onMouseMove={isMobile ? undefined : handleMouseMove}
        onMouseLeave={isMobile ? undefined : handleMouseLeave}
        onClick={isMobile ? () => setMobileZoom(true) : undefined}
      />
      {/* Magnifier glass (desktop only) */}
      {show && !isMobile && <div style={getMagnifierStyle()} />}
      {/* Mobile full image modal */}
      {mobileZoom && isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setMobileZoom(false)}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 12,
              boxShadow: "0 4px 24px rgba(44,62,80,0.18)",
            }}
          />
        </div>
      )}
    </div>
  );
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    cart: false,
    wishlist: false,
  });
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [wishlistedProducts, setWishlistedProducts] = useState(new Set());
  const [canReview, setCanReview] = useState(false);

  // Calculate average rating and distribution
  const averageRating = product?.reviews?.length
    ? (
        product.reviews.reduce(
          (acc, review) => acc + (Number(review.rating) || 0),
          0
        ) / product.reviews.length
      ).toFixed(1)
    : product?.ratings || 0;
  const totalReviews = product?.reviews?.length || product?.reviewsCount || 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count =
      product?.reviews?.filter((review) => {
        // Ensure rating is a number and handle edge cases
        const reviewRating = Number(review.rating) || 0;
        const matches = Math.floor(reviewRating) === rating;
        return matches;
      }).length || 0;
    return count;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if user can review this product
  const checkReviewEligibility = async (productData = null) => {
    console.log("checkReviewEligibility called");
    console.log("isAuthenticated():", isAuthenticated());
    console.log("product:", productData || product);
    if (!isAuthenticated() || !(productData || product)) {
      console.log(
        "Exiting early - user not authenticated or product not loaded"
      );
      return;
    }

    const productToCheck = productData || product;

    try {
      const response = await api.get(API.ORDERS.ALL);
      const userOrders = response.data.orders || [];

      console.log("=== REVIEW ELIGIBILITY DEBUG ===");
      console.log(
        "Product ID:",
        productToCheck._id,
        "Type:",
        typeof productToCheck._id
      );
      console.log("Total user orders:", userOrders.length);

      // Check if user has any completed or shipped order for this product
      const hasEligibleOrder = userOrders.some((order) => {
        console.log("Checking order:", order._id);
        console.log("Order status:", order.status);
        console.log("Payment status:", order.paymentStatus);
        console.log("Order products:", order.products);

        const statusMatch =
          order.status === "Completed" || order.status === "Shipped";
        const paymentMatch = order.paymentStatus === "Paid";
        const productMatch = order.products.some((productItem) => {
          console.log("Product item:", productItem);
          console.log(
            "Comparing:",
            productItem.productId,
            "with",
            productToCheck._id
          );
          console.log(
            "Types:",
            typeof productItem.productId,
            typeof productToCheck._id
          );
          return productItem.productId === productToCheck._id;
        });

        console.log("Status match:", statusMatch);
        console.log("Payment match:", paymentMatch);
        console.log("Product match:", productMatch);

        return statusMatch && paymentMatch && productMatch;
      });

      console.log("Final eligibility result:", hasEligibleOrder);
      console.log("=== END REVIEW ELIGIBILITY DEBUG ===");

      setCanReview(hasEligibleOrder);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      setCanReview(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;

    // Calculate maximum available lots
    const maxLots = Math.floor(product.quantityAvailable / product.lotSize);

    // Check if new quantity exceeds maximum available lots
    if (newQuantity > maxLots) {
      toast.error(`Only ${maxLots} lots available for this product.`);
      return;
    }

    setQuantity(newQuantity);
  };

  // Check if product is out of stock
  const isOutOfStock =
    product?.quantityAvailable !== undefined &&
    product.quantityAvailable < product.lotSize;

  const handleBuyNow = async () => {
    if (!isAuthenticated()) {
      // Redirect to login without showing any toast or error
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, cart: true }));
      setLoadingProductId(product._id);

      // Store buy now data in sessionStorage (not cart)
      const buyNowData = {
        productId: id,
        quantity: quantity,
        product: {
          _id: product._id,
          title: product.title,
          price: product.price,
          featuredImage: product.featuredImage,
          lotSize: product.lotSize,
        },
        timestamp: Date.now(),
      };

      sessionStorage.setItem("buyNowData", JSON.stringify(buyNowData));

      // Navigate directly to address selection for buy now
      navigate("/address-selection", {
        state: {
          from: "buy-now",
          productId: id,
          quantity: quantity,
        },
      });
    } catch (error) {
      console.error("Error in Buy Now:", error);
      if (error.response?.status === 401) {
        toast.info("Please sign in to continue");
        navigate("/login", { state: { from: `/product/${id}` } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, cart: false }));
      setLoadingProductId(null);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(API.PRODUCTS.DETAILS(id));

        const { product: productData, relatedProducts } = response.data;

        // Ensure reviews array exists and has proper structure
        if (productData && !productData.reviews) {
          productData.reviews = [];
        }

        setProduct(productData);
        setMainImage(productData.featuredImage);
        setSimilarProducts(relatedProducts || []);

        // Check if product is in wishlist if user is authenticated
        if (isAuthenticated()) {
          const wishlistResponse = await api.get(API.WISHLIST.ALL);
          const wishlistItems = wishlistResponse.data.wishlist;
          setIsWishlisted(
            wishlistItems.some((item) => item.productId._id === id)
          );
          // Store all wishlisted product IDs for related products
          const wishlistedIds = new Set(
            wishlistItems.map((item) => item.productId._id)
          );
          setWishlistedProducts(wishlistedIds);
        }

        // Check review eligibility after product is loaded
        if (isAuthenticated()) {
          await checkReviewEligibility(productData);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isAuthenticated]);

  const handleAddToCart = async () => {
    if (actionLoading.cart) return;

    try {
      setActionLoading((prev) => ({ ...prev, cart: true }));
      setLoadingProductId(product._id);

      if (!isAuthenticated()) {
        // Redirect to login without showing any toast or error
        navigate("/login", { state: { from: `/product/${id}` } });
        return;
      }

      const response = await api.post(API.CART.ADD_ITEM, {
        productId: id,
        quantity,
      });

      if (response.data.success) {
        await fetchAndSyncCart(dispatch);
        toast.success("Item added to cart successfully");
      } else {
        toast.error(response.data.message || "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.response?.status === 401) {
        toast.info("Please sign in to add items to cart");
        navigate("/login", { state: { from: `/product/${id}` } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, cart: false }));
      setLoadingProductId(null);
    }
  };

  const handleWishlist = async () => {
    if (actionLoading.wishlist) return;

    try {
      setActionLoading((prev) => ({ ...prev, wishlist: true }));

      if (!isAuthenticated()) {
        // Redirect to login without showing any toast or error
        navigate("/login", { state: { from: `/product/${id}` } });
        return;
      }

      const endpoint = isWishlisted ? API.WISHLIST.REMOVE : API.WISHLIST.ADD;
      await api.post(endpoint, { productId: id });

      setIsWishlisted(!isWishlisted);
      toast.success(
        isWishlisted ? "Removed from wishlist" : "Added to wishlist"
      );
    } catch (error) {
      console.error("Error updating wishlist:", error);
      if (error.response?.status === 401) {
        toast.info("Please sign in to manage wishlist");
        navigate("/login", { state: { from: `/product/${id}` } });
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, wishlist: false }));
    }
  };

  // Add review submit handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      // Redirect to login without showing any toast or error
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please enter a review comment.");
      return;
    }
    setReviewSubmitting(true);
    try {
      const response = await api.post(API.REVIEWS.ADD(id), {
        rating: reviewRating,
        comment: reviewComment,
      });

      console.log("Review submission response:", response.data);
      console.log("Current user data:", user);

      if (response.data && response.data.success) {
        // Use the returned review, but inject the current user's info for display
        const newReview = {
          ...response.data.review,
          user: {
            _id: user._id,
            fullName: user.fullName || user.name || "Anonymous",
          },
          createdAt: response.data.review.createdAt || new Date().toISOString(),
        };

        setProduct((prev) => {
          const updatedReviews = [newReview, ...(prev.reviews || [])];
          const updatedCount = (prev.reviewsCount || 0) + 1;
          const updatedRatings = (
            updatedReviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
            updatedReviews.length
          ).toFixed(1);

          return {
            ...prev,
            reviews: updatedReviews,
            reviewsCount: updatedCount,
            ratings: updatedRatings,
          };
        });
        setShowReviewForm(false);
        setReviewComment("");
        setReviewRating(5);
        toast.success("Review submitted successfully!");
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Review submit error:", error?.response?.data || error);
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already reviewed")
      ) {
        toast.error(
          "You have already reviewed this product. You can only review each product once."
        );
      } else {
        toast.error(handleApiError(error));
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Find if the current user has already reviewed
  const userReview = product?.reviews?.find((r) => r.user?._id === user?._id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 py-8">
          <section className="w-full">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
              {/* Left: Images & Buttons */}
              <div className="flex flex-col w-full lg:w-[48%] h-auto gap-4 md:gap-6">
                <div className="flex w-full h-[300px] sm:h-[400px] md:h-[500px] gap-3 md:gap-4">
                  {/* Thumbnails Column */}
                  <div className="hidden sm:flex flex-col w-[18%] gap-2 md:gap-3">
                    {[...Array(4)].map((_, index) => (
                      <Skeleton key={index} className="aspect-square" />
                    ))}
                  </div>

                  {/* Main Image */}
                  <div className="w-full sm:w-[80%] h-full">
                    <Skeleton className="w-full h-full" />
                  </div>
                </div>

                {/* Mobile Thumbnails */}
                <div className="flex sm:hidden w-full gap-2 overflow-x-auto pb-2">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="min-w-[60px] h-[60px]" />
                  ))}
                </div>
              </div>

              {/* Right: Product Details */}
              <div className="w-full lg:w-[52%] lg:pl-4 mt-4 lg:mt-0">
                <Skeleton height={40} className="mb-4" />
                <Skeleton height={24} width={200} className="mb-4" />

                {/* Price Section */}
                <div className="bg-blue-50 p-3 md:p-5 rounded-md mb-4 md:mb-6 shadow-sm">
                  <Skeleton height={32} width={150} className="mb-2" />
                  <Skeleton height={20} width={100} className="mb-2" />
                  <Skeleton height={20} width={80} />
                </div>

                {/* Key Highlights */}
                <div className="mb-4 md:mb-6">
                  <Skeleton height={24} width={120} className="mb-3" />
                  <div className="space-y-2">
                    {[...Array(4)].map((_, index) => (
                      <Skeleton key={index} height={20} />
                    ))}
                  </div>
                </div>

                {/* Quantity and Buttons */}
                <div className="mb-4 md:mb-6">
                  <Skeleton height={32} width={200} className="mb-4" />
                  <div className="flex gap-3">
                    <Skeleton height={40} width={120} />
                    <Skeleton height={40} width={120} />
                  </div>
                </div>

                {/* Specifications */}
                <div className="border-t pt-3 md:pt-5">
                  <Skeleton height={24} width={120} className="mb-3" />
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(4)].map((_, index) => (
                      <Skeleton key={index} height={20} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Related Products Section */}
          <section className="w-full mt-12">
            <Skeleton height={32} width={200} className="mx-auto mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 h-full flex flex-col"
                >
                  <Skeleton className="aspect-square" />
                  <div className="p-3 flex flex-col flex-grow">
                    <Skeleton height={20} className="mb-2" />
                    <Skeleton height={16} width={80} className="mb-2" />
                    <Skeleton height={24} width={100} className="mb-2" />
                    <div className="mt-auto flex gap-2">
                      <Skeleton height={32} width={32} />
                      <Skeleton height={32} className="flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
            <button className="bg-[#0D0B46] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Product not found
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 py-8">
          <section className="w-full">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
              {/* Left: Images & Buttons - Full width on mobile, half on desktop */}
              <div className="flex flex-col w-full lg:w-[48%] h-auto gap-4 md:gap-6">
                <div className="flex w-full h-[300px] sm:h-[400px] md:h-[500px] gap-3 md:gap-4">
                  {/* Thumbnails Column - Hidden on smallest screens */}
                  <div className="hidden sm:flex flex-col w-[18%] gap-2 md:gap-3 overflow-y-auto custom-scrollbar">
                    <img
                      className={`w-full cursor-pointer border-2 ${
                        mainImage === product.featuredImage
                          ? "border-[#0c0b45]"
                          : "border-transparent"
                      } rounded-md hover:border-[#0c0b45] transition-all aspect-square object-cover bg-white p-1`}
                      src={product.featuredImage}
                      alt="Featured"
                      onClick={() => setMainImage(product.featuredImage)}
                    />
                    {product.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-full cursor-pointer border-2 ${
                          mainImage === image
                            ? "border-[#0c0b45]"
                            : "border-transparent"
                        } rounded-md hover:border-[#0c0b45] transition-all aspect-square object-cover bg-white p-1`}
                        onClick={() => setMainImage(image)}
                      />
                    ))}
                  </div>

                  {/* Main Image */}
                  <div className="w-full sm:w-[80%] h-full flex items-center justify-center bg-gray-100 p-2 sm:p-3 md:p-5 shadow-md rounded-md border-gray-500 relative">
                    <Magnifier src={mainImage} alt="Main Product" zoom={2.2} />
                    {/* Wishlist and Share Icons */}
                    <div className="absolute top-2 right-2 flex z-10">
                      <button
                        onClick={handleWishlist}
                        disabled={actionLoading.wishlist}
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center"
                        aria-label={
                          isWishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        {isWishlisted ? (
                          <AiFillHeart
                            className="!w-6 !h-6 text-red-500 transition-colors"
                            style={{ fontSize: "3rem" }}
                          />
                        ) : (
                          <FiHeart
                            className="!w-6 !h-6 text-gray-400 transition-colors"
                            style={{ fontSize: "3rem" }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Thumbnails - Horizontal Scroll for Small Screens Only */}
                <div className="flex sm:hidden w-full gap-2 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                  <img
                    className={`min-w-[60px] h-[60px] cursor-pointer border-2 ${
                      mainImage === product.featuredImage
                        ? "border-[#0c0b45]"
                        : "border-transparent"
                    } rounded-md hover:border-[#0c0b45] transition-all object-cover bg-white p-1`}
                    src={product.featuredImage}
                    alt="Featured"
                    onClick={() => setMainImage(product.featuredImage)}
                  />
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className={`min-w-[60px] h-[60px] cursor-pointer border-2 ${
                        mainImage === image
                          ? "border-[#0c0b45]"
                          : "border-transparent"
                      } rounded-md hover:border-[#0c0b45] transition-all object-cover bg-white p-1`}
                      onClick={() => setMainImage(image)}
                    />
                  ))}
                </div>
              </div>

              {/* Right: Product Details */}
              <div className="w-full lg:w-[52%] lg:pl-4 mt-4 lg:mt-0 lg:max-h-[600px] lg:overflow-y-auto lg:pr-2 hide-scrollbar">
                <h1 className="text-2xl md:text-3xl font-semibold mb-2 md:mb-3 flex items-center gap-3">
                  {product.title}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product.title,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Product link copied to clipboard!");
                      }
                    }}
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center"
                    aria-label="Share product"
                  >
                    <FiShare2
                      className="!w-6 !h-6 text-gray-500"
                      style={{ fontSize: "3rem" }}
                    />
                  </button>
                </h1>

                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, index) => {
                      const ratingValue = index + 1;
                      return (
                        <span key={index}>
                          {product.ratings >= ratingValue ? (
                            <FaStar className="w-4 h-4 md:w-5 md:h-5 text-[#2e8e00]" />
                          ) : product.ratings >= ratingValue - 0.5 ? (
                            <FaStarHalfAlt className="w-4 h-4 md:w-5 md:h-5 text-[#2e8e00]" />
                          ) : (
                            <AiOutlineStar className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-blue-600 text-xs md:text-sm font-medium">
                    {product.reviewsCount} Ratings
                  </span>
                </div>

                <div className="bg-blue-50 p-3 md:p-5 rounded-md mb-4 md:mb-6 shadow-sm">
                  <div className="flex items-baseline gap-2 md:gap-4 flex-wrap">
                    <span className="text-2xl md:text-4xl font-bold text-gray-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500 line-through text-base md:text-lg">
                      ₹{product.compareAtPrice.toLocaleString()}
                    </span>
                    <span className="text-green-600 text-base md:text-lg font-medium">
                      {Math.round(
                        ((product.compareAtPrice - product.price) /
                          product.compareAtPrice) *
                          100
                      )}
                      % off
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                    Inclusive of all taxes
                  </p>
                  <div className="mt-2 md:mt-3 text-xs md:text-sm font-medium">
                    <span className="text-gray-600">Lot size: </span>
                    <span className="text-[#0c0b45]">{product.lotSize}</span>
                  </div>
                  <div className="mt-1 md:mt-3 text-xs md:text-sm font-medium">
                    <span className="text-gray-600">Seller: </span>
                    <span className="text-[#0c0b45]">
                      {product.user.fullName}
                    </span>
                  </div>
                </div>

                {/* Key Highlights Section */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-medium mb-2 md:mb-3">
                    Key Highlights
                  </h3>
                  <ul className="text-xs md:text-sm space-y-1 md:space-y-2 bg-gray-50 p-3 md:p-4 rounded-md shadow-sm">
                    {product.keyHighLights.map((highlight, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <MdCheckCircle className="text-green-600 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quantity and Buttons */}
                <div className="mb-4 md:mb-6">
                  {isOutOfStock ? (
                    <div className="mb-3 md:mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm md:text-base text-red-600">
                          Out of Stock
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                      <span className="font-medium text-sm md:text-base">
                        Quantity:
                      </span>
                      <div className="flex items-center gap-1 border  rounded-sm">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="px-2 md:px-3 py-1 border-r hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="px-3 md:px-4 text-sm md:text-base">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={
                            quantity >=
                            Math.floor(
                              product.quantityAvailable / product.lotSize
                            )
                          }
                          className="px-2 md:px-3 py-1 border-l hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            quantity >=
                            Math.floor(
                              product.quantityAvailable / product.lotSize
                            )
                              ? `Maximum ${Math.floor(
                                  product.quantityAvailable / product.lotSize
                                )} lots available`
                              : "Increase quantity"
                          }
                        >
                          +
                        </button>
                      </div>
                      {quantity >=
                        Math.floor(
                          product.quantityAvailable / product.lotSize
                        ) && (
                        <span className="text-xs text-orange-600">
                          Max{" "}
                          {Math.floor(
                            product.quantityAvailable / product.lotSize
                          )}{" "}
                          lots
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className="bg-[#0c0b45] text-white w-full sm:w-auto px-6 md:px-12 py-2 md:py-3 rounded font-medium hover:bg-gray-900 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isOutOfStock ? "Out of Stock" : "Buy Now"}
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={
                        isOutOfStock ||
                        (actionLoading.cart && loadingProductId === product._id)
                      }
                      className="border border-[#0c0b45] text-[#0c0b45] w-full sm:w-auto px-6 md:px-12 py-2 md:py-3 rounded font-medium hover:bg-gray-200 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading.cart && loadingProductId === product._id
                        ? "Adding..."
                        : isOutOfStock
                        ? "Out of Stock"
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-300 pt-3 md:pt-5">
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                    Specifications
                  </h3>
                  <div className="grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
                    <div className="text-gray-500">Brand</div>
                    <div className="col-span-2">{product.brand}</div>
                    <div className="text-gray-500">Model</div>
                    <div className="col-span-2">{product.model}</div>
                  </div>
                </div>

                {/* Product Description */}
                <div className="border-t border-gray-300 pt-3 md:pt-5">
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                    Description
                  </h3>
                  {product.description ? (
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-xs md:text-sm text-gray-500 italic">
                      No description available.
                    </p>
                  )}
                </div>

                {/* File Attachments */}
                <div className="border-t border-gray-300 pt-3 md:pt-5">
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                    Attachments
                  </h3>
                  {product.fileAttachments &&
                  product.fileAttachments.length > 0 ? (
                    <div className="space-y-2">
                      {product.fileAttachments.map((file, index) => {
                        const fileName = file
                          .split("/")
                          .pop()
                          .split("_")
                          .slice(1)
                          .join("_");
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                          >
                            <span className="text-xs md:text-sm text-gray-700 truncate flex-1">
                              {fileName}
                            </span>
                            <a
                              href={file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 px-2 py-1 text-xs text-[#0c0b45] bg-white border border-[#0c0b45] rounded hover:bg-[#0c0b45] hover:text-white transition-colors"
                            >
                              View
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-gray-500 italic">
                      No attachments available.
                    </p>
                  )}
                </div>

                {/* Customer Reviews Summary */}
                <div className="border-t border-gray-300 pt-3 md:pt-5">
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                    Customer Reviews
                  </h3>

                  {/* Rating Summary */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl md:text-3xl font-bold text-[#0c0b45]">
                      {averageRating}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => {
                          const ratingValue = i + 1;
                          return (
                            <span key={i} className="mr-0.5">
                              {averageRating >= ratingValue ? (
                                <FaStar className="text-[#2e8e00] w-3 h-3 md:w-4 md:h-4" />
                              ) : averageRating >= ratingValue - 0.5 ? (
                                <FaStarHalfAlt className="text-[#2e8e00] w-3 h-3 md:w-4 md:h-4" />
                              ) : (
                                <FaRegStar className="text-gray-300 w-3 h-3 md:w-4 md:h-4" />
                              )}
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-xs text-gray-600">
                        {totalReviews} reviews
                      </span>
                    </div>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-1">
                    {[5, 4, 3, 2, 1].map((rating, index) => {
                      const count = ratingDistribution[index];
                      const percentage =
                        totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-3">
                            {rating}
                          </span>
                          <FaStar className="text-[#2e8e00] w-2 h-2" />
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-[#0c0b45]"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-6">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Write Review Button */}
                  {isAuthenticated() ? (
                    userReview ? (
                      <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-xs text-blue-700">
                          You have already reviewed this product
                        </p>
                      </div>
                    ) : canReview ? (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="mt-3 w-full py-2 px-3 bg-[#0c0b45] text-white text-xs rounded hover:bg-gray-900 transition-colors"
                      >
                        Write a Review
                      </button>
                    ) : (
                      <p className="mt-3 text-xs text-gray-500">
                        Purchase to review
                      </p>
                    )
                  ) : (
                    <button
                      onClick={() =>
                        navigate("/login", {
                          state: { from: `/product/${id}` },
                        })
                      }
                      className="mt-3 w-full py-2 px-3 bg-[#0c0b45] text-white text-xs rounded hover:bg-gray-900 transition-colors"
                    >
                      Sign In to Review
                    </button>
                  )}

                  {/* Recent Reviews Preview */}
                  {product.reviews && product.reviews.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Recent Reviews
                      </h4>
                      {product.reviews.slice(0, 2).map((review, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 bg-[#0c0b45] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {(review.user?.fullName || "A")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => {
                                const ratingValue = i + 1;
                                const reviewRating = review.rating || 0;
                                return (
                                  <span key={i}>
                                    {reviewRating >= ratingValue ? (
                                      <FaStar className="text-[#2e8e00] w-2 h-2" />
                                    ) : reviewRating >= ratingValue - 0.5 ? (
                                      <FaStarHalfAlt className="text-[#2e8e00] w-2 h-2" />
                                    ) : (
                                      <FaRegStar className="text-gray-300 w-2 h-2" />
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {review.comment}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(
                              review.createdAt || review.date || new Date()
                            )}
                          </p>
                        </div>
                      ))}
                      {product.reviews.length > 2 && (
                        <button className="text-xs text-[#0c0b45] hover:underline">
                          View all {product.reviews.length} reviews
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="w-full mt-12">
            <p className="2xl:text-[32px] xl:text-[24px] text-center font-medium">
              Related Products
            </p>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {loading
                ? Array(8)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className="relative w-[306px] h-[407px] border border-[#E7E6E6] rounded-lg bg-gray-200 animate-pulse"
                      >
                        {/* Discount Badge */}
                        <div className="absolute text-[16px] top-0 right-0 w-[63px] h-[64px] bg-gray-300 flex flex-col items-center justify-center rounded-bl-3xl rounded-tr-lg"></div>

                        {/* Image Section */}
                        <div className="w-full h-[270.04px] bg-gray-300 rounded-t-lg"></div>

                        {/* Placeholder Text and Buttons */}
                        <div className="pl-[22px] pr-[15px] pb-[21px]">
                          {/* Title Placeholder */}
                          <div className="mt-[20.96px] h-[18px] bg-gray-300 rounded w-[60%]"></div>

                          {/* Rating Placeholder */}
                          <div className="flex items-center bg-gray-300 text-white text-[14px] w-[48px] h-[21px] justify-center rounded-sm mt-[5px]"></div>

                          {/* Price Placeholder */}
                          <div className="w-[136px] h-[15px] mt-[5px] flex items-center space-x-2">
                            <div className="h-[18px] w-[40px] bg-gray-300 rounded"></div>
                            <div className="h-[16px] w-[50px] bg-gray-300 rounded"></div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-[21px] h-[29px] flex items-center space-x-[9px]">
                            <div className="flex justify-center items-center h-[29px] w-[29px] bg-gray-300 rounded"></div>
                            <div className="w-[131px] h-[29px] bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))
                : similarProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      id={product._id}
                      title={product.title}
                      image={product.featuredImage}
                      rating={product.ratings || 0}
                      price={product.price}
                      originalPrice={product.compareAtPrice}
                      discount={Math.round(
                        ((product.compareAtPrice - product.price) /
                          product.compareAtPrice) *
                          100
                      )}
                      onAddToCart={async () => {
                        if (!isAuthenticated()) {
                          // Redirect to login without showing any toast or error
                          navigate("/login", {
                            state: { from: `/product/${id}` },
                          });
                          return;
                        }
                        try {
                          const response = await api.post(API.CART.ADD_ITEM, {
                            productId: product._id,
                            quantity: 1,
                          });
                          if (response.data.success) {
                            await fetchAndSyncCart(dispatch);
                            toast.success("Item added to cart successfully");
                          }
                        } catch (error) {
                          if (error.response?.status === 401) {
                            toast.info("Please sign in to add items to cart");
                            navigate("/login", {
                              state: { from: `/product/${id}` },
                            });
                          } else {
                            toast.error(handleApiError(error));
                          }
                        }
                      }}
                      onAddToWishlist={async () => {
                        if (!isAuthenticated()) {
                          // Redirect to login without showing any toast or error
                          navigate("/login", {
                            state: { from: `/product/${id}` },
                          });
                          return;
                        }
                        try {
                          const isProductWishlisted = wishlistedProducts.has(
                            product._id
                          );
                          const endpoint = isProductWishlisted
                            ? API.WISHLIST.REMOVE
                            : API.WISHLIST.ADD;
                          await api.post(endpoint, { productId: product._id });

                          // Update local wishlist state
                          setWishlistedProducts((prev) => {
                            const newSet = new Set(prev);
                            if (isProductWishlisted) {
                              newSet.delete(product._id);
                            } else {
                              newSet.add(product._id);
                            }
                            return newSet;
                          });

                          toast.success(
                            isProductWishlisted
                              ? "Removed from wishlist"
                              : "Added to wishlist"
                          );
                        } catch (error) {
                          if (error.response?.status === 401) {
                            toast.info("Please sign in to manage wishlist");
                            navigate("/login", {
                              state: { from: `/product/${id}` },
                            });
                          } else {
                            toast.error(handleApiError(error));
                          }
                        }
                      }}
                      isWishlisted={wishlistedProducts.has(product._id)}
                    />
                  ))}
            </div>

            {/* View all Button */}
            {similarProducts.length > 10 && (
              <div className="flex items-center justify-center mt-8">
                <Link
                  to={`/product/${id}`}
                  className="w-[181.52px] mx-auto border border-[#28A745] rounded text-[#28A745] px-[25px] py-[16px] text-center whitespace-nowrap"
                >
                  View All Products
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductDetail;
