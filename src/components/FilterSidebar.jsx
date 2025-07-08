import { useState, useEffect, useRef } from "react";
import { FaFilter, FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";

const FilterSidebar = ({ onFilterChange, initialFilters = {} }) => {
  // State for expanded sections
  const [expandedFilters, setExpandedFilters] = useState({
    price: true,
    brands: true,
    ratings: true,
    lotSize: true,
  });

  // Price range state
  const [priceRange, setPriceRange] = useState({
    min: initialFilters.minPrice || 0,
    max: initialFilters.maxPrice || 50000,
  });
  const [isDragging, setIsDragging] = useState(null);
  const priceSliderRef = useRef(null);

  // Brand and rating filters
  const [selectedBrands, setSelectedBrands] = useState(
    initialFilters.brands?.split(",") || []
  );
  const [selectedRating, setSelectedRating] = useState(
    initialFilters.rating || null
  );
  const [selectedLotSize, setSelectedLotSize] = useState(
    initialFilters.lotSize || null
  );

  // Active filters state
  const [activeFilters, setActiveFilters] = useState({
    price: null,
    brands: [],
    ratings: null,
    lotSize: null,
  });

  // Toggle filter section
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
      onFilterChange("price", priceRange);
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

  // Function to remove a filter
  const removeFilter = (filterType, value = null) => {
    switch (filterType) {
      case "price":
        setPriceRange({ min: 0, max: 50000 });
        onFilterChange("price", { min: 0, max: 50000 });
        break;
      case "brands":
        const newBrands = selectedBrands.filter((brand) => brand !== value);
        setSelectedBrands(newBrands);
        onFilterChange("brands", newBrands);
        break;
      case "ratings":
        setSelectedRating(null);
        onFilterChange("rating", null);
        break;
      case "lotSize":
        setSelectedLotSize(null);
        onFilterChange("lotSize", null);
        break;
    }
  };

  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-4">
        {/* Selected Filters */}
        {(activeFilters.price ||
          activeFilters.brands.length > 0 ||
          activeFilters.ratings ||
          activeFilters.lotSize) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
                onFilterChange("price", { min: 0, max: 50000 });
                onFilterChange("brands", []);
                onFilterChange("rating", null);
                onFilterChange("lotSize", null);
              }}
              className="mt-3 text-sm text-[#0D0B46] hover:text-[#23206a] font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Price Range Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                      style={{ left: `${(priceRange.min / 50000) * 100}%` }}
                      onMouseDown={(e) => handlePriceSliderMouseDown(e, "min")}
                    />

                    {/* Max Thumb */}
                    <div
                      className="absolute w-4 h-4 bg-white border-2 border-[#0D0B46] rounded-full -top-1.5 cursor-pointer hover:scale-110 transition-transform"
                      style={{ left: `${(priceRange.max / 50000) * 100}%` }}
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
                          setPriceRange((prev) => ({ ...prev, min: value }));
                          onFilterChange("price", {
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
                          setPriceRange((prev) => ({ ...prev, max: value }));
                          onFilterChange("price", {
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            className="w-full flex items-center justify-between p-4 text-gray-700 font-medium hover:bg-gray-50"
            onClick={() => toggleFilter("brands")}
          >
            <span>Brands</span>
            {expandedFilters.brands ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expandedFilters.brands && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {["Apple", "Samsung", "Sony", "LG", "Bose"].map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={(e) => {
                        const newBrands = e.target.checked
                          ? [...selectedBrands, brand]
                          : selectedBrands.filter((b) => b !== brand);
                        setSelectedBrands(newBrands);
                        onFilterChange("brands", newBrands);
                      }}
                      className="rounded border-gray-300 text-[#0D0B46] focus:ring-[#0D0B46]"
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ratings Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            className="w-full flex items-center justify-between p-4 text-gray-700 font-medium hover:bg-gray-50"
            onClick={() => toggleFilter("ratings")}
          >
            <span>Ratings</span>
            {expandedFilters.ratings ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expandedFilters.ratings && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer"
                  >
                    <input
                      type="radio"
                      checked={selectedRating === rating}
                      onChange={() => {
                        setSelectedRating(rating);
                        onFilterChange("rating", rating);
                      }}
                      className="border-gray-300 text-[#0D0B46] focus:ring-[#0D0B46]"
                    />
                    <span>{rating}★ & Up</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lot Size Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            className="w-full flex items-center justify-between p-4 text-gray-700 font-medium hover:bg-gray-50"
            onClick={() => toggleFilter("lotSize")}
          >
            <span>Lot Size</span>
            {expandedFilters.lotSize ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {expandedFilters.lotSize && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {["1-5", "6-10", "11-20", "21-50", "50+"].map((size) => (
                  <label
                    key={size}
                    className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer"
                  >
                    <input
                      type="radio"
                      checked={selectedLotSize === size}
                      onChange={() => {
                        setSelectedLotSize(size);
                        onFilterChange("lotSize", size);
                      }}
                      className="border-gray-300 text-[#0D0B46] focus:ring-[#0D0B46]"
                    />
                    <span>{size} items</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
