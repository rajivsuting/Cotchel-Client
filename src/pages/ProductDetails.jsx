import React from "react";

const ProductDetails = () => {
  <div className="w-full xl:pt-[180px] 2xl:pt-[266px]">
    <section className="w-full md:w-[90%] lg:w-[84%] mx-auto px-4 md:px-0">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
        {/* Left: Images & Buttons - Full width on mobile, half on desktop */}
        <div className="flex flex-col w-full lg:w-[48%] h-auto gap-4 md:gap-6">
          <div className="flex w-full h-[300px] sm:h-[400px] md:h-[500px] gap-3 md:gap-4">
            {/* Thumbnails Column - Hidden on smallest screens */}
            <div className="hidden sm:flex flex-col w-[18%] gap-2 md:gap-3 overflow-y-auto custom-scrollbar">
              <img
                className={`w-full cursor-pointer border-2 ${
                  mainImage === product.featuredImage
                    ? "border-primary"
                    : "border-transparent"
                } rounded-md hover:border-primary transition-all aspect-square object-cover bg-white p-1`}
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
                      ? "border-primary"
                      : "border-transparent"
                  } rounded-md hover:border-primary transition-all aspect-square object-cover bg-white p-1`}
                  onClick={() => setMainImage(image)}
                />
              ))}
            </div>

            {/* Main Image */}
            <div className="w-full sm:w-[80%] h-full flex items-center justify-center bg-gray-100 p-2 sm:p-3 md:p-5 shadow-md rounded-md border">
              <img
                src={mainImage}
                alt="Main Product"
                className="object-contain h-full w-full hover:scale-105 transition-transform cursor-zoom-in"
              />
            </div>
          </div>

          {/* Mobile Thumbnails - Horizontal Scroll for Small Screens Only */}
          <div className="flex sm:hidden w-full gap-2 overflow-x-auto pb-2 custom-scrollbar-horizontal">
            <img
              className={`min-w-[60px] h-[60px] cursor-pointer border-2 ${
                mainImage === product.featuredImage
                  ? "border-primary"
                  : "border-transparent"
              } rounded-md hover:border-primary transition-all object-cover bg-white p-1`}
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
                  mainImage === image ? "border-primary" : "border-transparent"
                } rounded-md hover:border-primary transition-all object-cover bg-white p-1`}
                onClick={() => setMainImage(image)}
              />
            ))}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="w-full lg:w-[52%] lg:pl-4 mt-4 lg:mt-0">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2 md:mb-3">
            {product.title}
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
              <span className="text-primary">{product.lotSize}</span>
            </div>
            <div className="mt-1 md:mt-3 text-xs md:text-sm font-medium">
              <span className="text-gray-600">Seller: </span>
              <span className="text-primary">{product.user.fullName}</span>
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
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <span className="font-medium text-sm md:text-base">
                Quantity:
              </span>
              <div className="flex items-center gap-1 border rounded-sm">
                <button
                  onClick={() => handleQuantityChange("decrease")}
                  className="px-2 md:px-3 py-1 border-r hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-3 md:px-4 text-sm md:text-base">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange("increase")}
                  className="px-2 md:px-3 py-1 border-l hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={handleBuyNow}
                className="bg-primary text-white w-full sm:w-auto px-6 md:px-12 py-2 md:py-3 rounded font-medium hover:bg-gray-900 transition-colors text-sm md:text-base"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="border border-primary text-primary w-full sm:w-auto px-6 md:px-12 py-2 md:py-3 rounded font-medium hover:bg-gray-200 transition-colors text-sm md:text-base"
              >
                Add to Cart
              </button>
            </div>
          </div>

          <div className="border-t pt-3 md:pt-5">
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
        </div>
      </div>
    </section>

    <section className="w-full">
      {" "}
      {/* Tab Navigation */}
      <div className=" w-[31.77%] mx-auto mt-10 flex justify-between mb-10">
        <button
          className={`px-6 py-2 mr-4 border-b-2 2xl:text-[24px] xl:text-[18px] font-medium ${
            activeTab === "description"
              ? "border-primary"
              : "border-transparent"
          }`}
          onClick={() => handleTabChange("description")}
        >
          Description
        </button>
        <button
          className={`px-6 py-2 mr-4 border-b-2 2xl:text-[24px] xl:text-[18px] font-medium ${
            activeTab === "specification"
              ? "border-primary"
              : "border-transparent"
          }`}
          onClick={() => handleTabChange("specification")}
        >
          Attachments
        </button>
        <button
          className={`px-6 py-2 border-b-2 2xl:text-[24px] xl:text-[18px] font-medium ${
            activeTab === "reviews" ? "border-primary" : "border-transparent"
          }`}
          onClick={() => handleTabChange("reviews")}
        >
          Reviews
        </button>
      </div>
      {/* Tab Content */}
      {activeTab === "description" && (
        <div className="w-[61.6%]  text-center mt-[38px] mx-auto">
          {product.description ? (
            <p className="text-[#191919] 2xl:text-[18px] xl:text-[14px]">
              {product.description}
            </p>
          ) : (
            <p className="text-[#191919] 2xl:text-[18px] xl:text-[14px]">
              No description available.
            </p>
          )}
        </div>
      )}
      {/* "fileAttachments": [
  "https://cotchel-images.s3.ap-south-1.amazonaws.com/attachments/f918cadc-07aa-4af8-93ac-93f6752831b6_phone.pdf"
], */}
      {activeTab === "specification" && (
        <div className="w-[40%] bg-white  p-6 mt-10 mx-auto">
          {product.fileAttachments && product.fileAttachments.length > 0 ? (
            <ul className="space-y-3">
              {product.fileAttachments.map((file, index) => {
                const fileName = file
                  .split("/")
                  .pop()
                  .split("_")
                  .slice(1)
                  .join("_"); // Removes UUID prefix
                return (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition"
                  >
                    <span className="truncate max-w-[70%] text-gray-700">
                      {fileName}
                    </span>
                    <a
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 px-3 py-1  text-primary rounded-lg hover:text-gray-900  hover:underline transition"
                    >
                      View
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-600 text-center">
              No specifications available.
            </p>
          )}
        </div>
      )}
      {activeTab === "reviews" && (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg  overflow-hidden">
          {/* Ratings Summary Section */}
          <div className="border-b border-gray-200">
            <div className="flex flex-col md:flex-row">
              {/* Left side - Average rating */}
              <div className="flex flex-col items-center p-6 border-r border-gray-200 md:w-1/3 bg-gray-50">
                <div className="text-5xl font-bold text-[#0c0b45] mb-2">
                  {averageRating}
                </div>
                <div className="flex my-2">
                  {[...Array(5)].map((_, i) => {
                    const ratingValue = i + 1;
                    return (
                      <span key={i} className="mx-0.5">
                        {averageRating >= ratingValue ? (
                          <FaStar className="text-[#2e8e00] w-5 h-5" />
                        ) : averageRating >= ratingValue - 0.5 ? (
                          <FaStarHalfAlt className="text-[#2e8e00] w-5 h-5" />
                        ) : (
                          <FaRegStar className="text-gray-300 w-5 h-5" />
                        )}
                      </span>
                    );
                  })}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Based on {totalReviews} reviews
                </div>

                {/* {totalReviews > 0 && (
                <button className="mt-4 px-4 py-2 bg-[#0c0b45] text-white rounded text-sm font-medium hover:bg-opacity-90 transition-all">
                  WRITE A REVIEW
                </button>
              )} */}
              </div>

              {/* Right side - Rating distribution */}
              <div className="p-6 md:w-2/3">
                {[5, 4, 3, 2, 1].map((rating, index) => {
                  const count = ratingDistribution[rating - 1]; // Fixed index mapping
                  const percentage =
                    totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center mb-3">
                      <div className="flex items-center w-12">
                        <span className="font-medium text-gray-700">
                          {rating}
                        </span>
                        <FaStar className="text-[#2e8e00] w-3 h-3 ml-1" />
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full mx-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            percentage > 60 ? "bg-[#2e8e00]" : "bg-[#a2c500]"
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-12 text-xs text-gray-500 font-medium">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Individual Reviews Section */}
          <div className="divide-y divide-gray-200">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review, index) => (
                <div
                  key={index}
                  className="p-6 hover:bg-gray-50 transition-all"
                >
                  {/* Top row with rating and date */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => {
                        const ratingValue = i + 1;
                        return (
                          <span key={i} className="mr-0.5">
                            {review.rating >= ratingValue ? (
                              <FaStar className="text-[#2e8e00] w-4 h-4" />
                            ) : review.rating >= ratingValue - 0.5 ? (
                              <FaStarHalfAlt className="text-[#2e8e00] w-4 h-4" />
                            ) : (
                              <FaRegStar className="text-gray-300 w-4 h-4" />
                            )}
                          </span>
                        );
                      })}
                      {/* {review.verified && (
                      <div className="ml-2 flex items-center text-green-600 text-xs">
                        <FaCheck className="w-3 h-3 mr-1" />
                        <span className="font-medium">
                          Verified Purchase
                        </span>
                      </div>
                    )} */}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(review.date || new Date())}
                    </div>
                  </div>

                  {/* Review title and content */}
                  {review.title && (
                    <h3 className="text-base font-semibold text-gray-800 mb-2">
                      {review.title}
                    </h3>
                  )}

                  <div className="mb-4">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>

                  {/* Review images */}
                  {review.images && review.images.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {review.images.map((img, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="w-16 h-16 bg-gray-100 rounded overflow-hidden border border-gray-200"
                          >
                            <img
                              src={img}
                              alt="Review"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviewer info */}
                  <div className="flex items-center mt-2">
                    <div className="w-8 h-8 bg-[#0c0b45] rounded-full flex items-center justify-center text-white font-semibold mr-2">
                      {(review.user?.fullName || "A").charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium">
                      {review.user?.fullName || "Anonymous"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FaCamera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  No reviews yet. Be the first to share your experience!
                </p>
                <button className="px-6 py-3 bg-[#0c0b45] text-white rounded text-sm font-medium hover:bg-opacity-90 transition-all">
                  WRITE A REVIEW
                </button>
              </div>
            )}
          </div>

          {/* Pagination - Simplified */}
          {product.reviews && product.reviews.length > 4 && (
            <div className="p-4 border-t border-gray-200 flex justify-center">
              <div className="flex space-x-1">
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-50">
                  &lt;
                </button>
                <button className="w-8 h-8 flex items-center justify-center bg-[#0c0b45] text-white rounded text-sm">
                  1
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-50">
                  2
                </button>
                <button className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-sm hover:bg-gray-50">
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>

    <section className="w-[74%] 2xl:w-[1414px] 2xl:mt-[71px] xl:mt-[70px] mx-auto">
      <p className="2xl:text-[32px] xl:text-[24px] text-center font-medium">
        Related Products
      </p>

      {/* Cards */}
      <div className="grid grid-cols-4 justify-between w-full xl:mt-[50px] 2xl:mt-[90px] gap-y-[90px] mx-auto mb-[90px]">
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
              <Link to={`/product-details/${product._id}`} key={product._id}>
                <ProductCard
                  title={product.title}
                  image={product.featuredImage} // Displaying the first image
                  rating={4.5} // Replace with actual rating if available
                  price={product.price}
                  originalPrice={product.compareAtPrice}
                  discount={Math.round(
                    ((product.compareAtPrice - product.price) /
                      product.compareAtPrice) *
                      100
                  )}
                />
              </Link>
            ))}
      </div>

      {/* View all Button */}
      {products.length > 10 && (
        <div className="flex items-center justify-center">
          <Link
            to="/products"
            className="w-[181.52px] mx-auto border border-[#28A745] rounded text-[#28A745] px-[25px] py-[16px] text-center whitespace-nowrap"
          >
            View All Products
          </Link>
        </div>
      )}
    </section>
  </div>;
};

export default ProductDetails;
