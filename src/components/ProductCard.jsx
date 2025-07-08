import { useState, memo } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FiHeart, FiStar } from "react-icons/fi";

const ProductCard = memo(
  ({
    id,
    image,
    title,
    rating,
    price,
    originalPrice,
    onAddToCart,
    onAddToWishlist,
    isWishlisted = false,
    isLoading,
    lotSize,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const calculateDiscount = () => {
      if (!originalPrice || originalPrice <= price) return 0;
      return Math.round(((originalPrice - price) / originalPrice) * 100);
    };

    const discount = calculateDiscount();

    const truncateTitle = (text) => {
      return text.length > 20 ? text.substring(0, 20) + "..." : text;
    };

    return (
      <Link
        to={`/product/${id}`}
        className="block w-full max-w-xs min-w-0 mx-auto"
      >
        <div
          className="group bg-white rounded-xl border hover:shadow transition-all duration-300 overflow-hidden border-gray-200 flex flex-col"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Product Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
            )}
            <img
              src={image}
              alt={title}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute top-0 right-0 bg-[#0D0B46] text-white px-2 py-1 text-sm font-bold rounded-bl-xl">
                <div>{discount}%</div>
                <div className="text-xs">OFF</div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-3 flex flex-col flex-grow">
            {/* Title and Rating */}
            <div className="flex justify-between items-start mb-2">
              <h2
                className="text-gray-800 font-medium text-sm flex-1 mr-2 group-hover:text-[#0D0B46] transition-colors"
                title={title}
              >
                {truncateTitle(title)}
              </h2>
              <div className="flex items-center bg-orange-400 px-2 py-1 rounded shrink-0">
                <FaStar className="w-3.5 h-3.5 text-white" />
                <span className="ml-1 text-xs font-medium text-white">
                  {rating}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[#0D0B46] font-bold text-base">
                  ₹{price.toFixed(2)}
                </span>
                {originalPrice && originalPrice > price && (
                  <span className="text-gray-400 line-through text-sm">
                    ₹{originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 mt-auto">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToWishlist();
                }}
                className="p-1.5 rounded-lg border border-gray-200 hover:border-[#0D0B46] hover:text-[#0D0B46] transition-colors duration-300"
              >
                {isWishlisted ? (
                  <FaHeart className="w-4 h-4 text-[#0D0B46]" />
                ) : (
                  <FaRegHeart className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCart();
                }}
                disabled={isLoading}
                className="flex-1 bg-[#0D0B46] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors duration-300 transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
