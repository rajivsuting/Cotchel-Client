import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import {
  FaStore,
  FaChartLine,
  FaShieldAlt,
  FaHeadset,
  FaCheckCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaGlobe,
  FaFileAlt,
  FaStar,
  FaQuoteLeft,
  FaArrowRight,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { API, handleApiError } from "../config/api";
import api from "../services/apiService";

const BecomeSeller = () => {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [promotionalBanner, setPromotionalBanner] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Debug: Monitor promotionalBanner state changes
  useEffect(() => {
    console.log("promotionalBanner state changed to:", promotionalBanner);
  }, [promotionalBanner]);

  const steps = [
    {
      number: 1,
      title: "Sign Up",
      description: "Create your seller account with basic information",
    },
    {
      number: 2,
      title: "Complete Profile",
      description: "Add your business details and verification documents",
    },
    {
      number: 3,
      title: "Start Selling",
      description: "List your products and start earning from day one",
    },
  ];

  const successStories = [
    {
      name: "Priya Sharma",
      business: "Handmade Jewelry",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      story:
        "Started with just ₹5000 investment, now earning ₹50,000+ monthly through our platform.",
      rating: 5,
      sales: "₹50K+ monthly",
    },
    {
      name: "Rajesh Kumar",
      business: "Electronics",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      story:
        "From a small shop to online success. Our platform helped me reach customers nationwide.",
      rating: 5,
      sales: "₹2L+ monthly",
    },
    {
      name: "Suresh Reddy",
      business: "Home Decor",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      story:
        "Started during lockdown, now running a successful home decor business with customers across India.",
      rating: 5,
      sales: "₹3L+ monthly",
    },
  ];

  const faqs = [
    {
      question: "What documents do I need to become a seller?",
      answer:
        "You'll need your business registration documents, GST certificate (if applicable), PAN card, bank account details, and address proof. For individual sellers, Aadhaar card and PAN card are sufficient.",
    },
    {
      question: "How long does the approval process take?",
      answer:
        "The approval process typically takes 2-3 business days. We review your application and documents thoroughly to ensure quality standards.",
    },
    {
      question: "What are the commission rates?",
      answer:
        "Commission rates vary by category, ranging from 5% to 15%. Electronics and fashion have different rates. We offer transparent pricing with no hidden fees.",
    },
    {
      question: "Can I sell internationally?",
      answer:
        "Currently, we support domestic sales across India. International shipping features are coming soon. You can reach customers nationwide with our extensive logistics network.",
    },
    {
      question: "What support do you provide to sellers?",
      answer:
        "We provide 24/7 seller support, marketing tools, analytics dashboard, inventory management, and promotional opportunities. Our team helps you optimize your listings and grow your business.",
    },
    {
      question: "How do I get paid for my sales?",
      answer:
        "Payments are processed weekly. We transfer funds directly to your registered bank account. You can track all transactions in your seller dashboard.",
    },
  ];

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  useEffect(() => {
    const fetchPromotionalBanner = async () => {
      try {
        setBannerLoading(true);
        console.log(
          "Fetching promotional banner from:",
          API.BANNERS.PROMOTIONAL
        );

        const response = await api.get(API.BANNERS.PROMOTIONAL);
        console.log("Banner response:", response.data);

        if (
          response.data &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          // Get the first promotional banner
          const banner = response.data.data[0];
          console.log("Banner object:", banner);
          console.log("Banner imageUrl:", banner.imageUrl);

          if (banner.imageUrl && banner.imageUrl.trim() !== "") {
            console.log("Setting banner image:", banner.imageUrl);
            setPromotionalBanner(banner.imageUrl);
          } else {
            console.log("Banner imageUrl is empty or invalid, using fallback");
          }
        } else {
          console.log("No promotional banners found, using fallback");
        }
      } catch (error) {
        console.error("Error fetching promotional banner:", error);
        console.log("Using fallback image due to error");
        // Keep the default fallback image
      } finally {
        setBannerLoading(false);
      }
    };

    fetchPromotionalBanner();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="py-4 sm:py-6 md:py-8">
        <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4">
          <div
            className="relative bg-cover bg-center bg-no-repeat rounded-lg overflow-hidden h-[200px] sm:h-[300px] md:h-[400px]"
            style={{
              backgroundImage: promotionalBanner
                ? `url(${promotionalBanner})`
                : "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
            }}
          >
            {bannerLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-12 md:py-16">
        <div className="bg-gray-50 py-8 sm:py-12 md:py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-start">
              {/* Left side - Text content */}
              <div className="space-y-6 sm:space-y-8 ">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-black leading-tight">
                  Get started in <span className="text-blue-600">3</span>
                  <br />
                  simple <span className="text-blue-600">steps</span>
                </h2>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed max-w-md">
                  Getting started is often the hardest part, but taking small
                  steps can help you build momentum and achieve your goals.
                </p>
              </div>

              {/* Right side - Steps timeline */}
              <div className="relative max-w-lg mx-auto lg:mx-0">
                <div className="space-y-0">
                  {steps.map((step, index) => (
                    <div key={index} className="relative pb-8 sm:pb-10">
                      {/* Step content */}
                      <div className="flex items-center">
                        {/* Step number badge */}
                        <div className="flex items-center justify-center w-16 sm:w-19 h-6 sm:h-8 bg-blue-600 text-white font-bold text-xs rounded shadow-sm mr-3 sm:mr-4 flex-shrink-0 relative z-10">
                          <span className="text-xs sm:text-xs">
                            STEP {step.number}
                          </span>
                        </div>

                        {/* Step content */}
                        <div className="flex-1">
                          <h3 className="font-bold text-black text-sm sm:text-base mb-1">
                            {step.title}
                          </h3>
                          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Connecting line and circle for all steps except the last one */}
                      {index < steps.length - 1 && (
                        <>
                          {/* Vertical line starting from bottom border of current step */}
                          <div className="absolute left-8 sm:left-10 top-6 sm:top-8 w-px h-8 sm:h-10 bg-gray-300"></div>
                          {/* Circle at the bottom of the line */}
                          <div className="absolute left-8 sm:left-10 top-14 sm:top-18 w-2 sm:w-3 h-2 sm:h-3 bg-gray-300 rounded-full transform -translate-x-1/2"></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Get Started button */}
                <div className="mt-4 sm:mt-4">
                  <button
                    type="button"
                    className="block w-full bg-[#0c0b45] hover:bg-blue-800 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-colors duration-300 text-sm sm:text-base shadow-lg text-center cursor-pointer"
                    onClick={() => {
                      if (!isAuthenticated()) {
                        navigate("/register?role=seller");
                      } else {
                        navigate("/seller-details");
                      }
                    }}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Success Stories */}
      <div className="bg-white py-8 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Seller Success Stories
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Hear from our successful sellers who have transformed their
              businesses with our platform
            </p>
          </div>

          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
            }}
            className="pb-8 sm:pb-12"
          >
            {successStories.map((story, index) => (
              <SwiperSlide key={index}>
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 h-full">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <img
                      src={story.image}
                      alt={story.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {story.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {story.business}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(story.rating)].map((_, i) => (
                          <FaStar
                            key={i}
                            className="text-yellow-400 text-xs sm:text-sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <FaQuoteLeft className="text-[#0D0B46] text-xl sm:text-2xl mb-2" />
                    <p className="text-gray-700 italic text-sm sm:text-base">
                      "{story.story}"
                    </p>
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-[#0D0B46]">
                    {story.sales} monthly sales
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Everything you need to know about becoming a seller
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {faq.question}
                  </span>
                  {activeFAQ === index ? (
                    <FaMinus className="text-[#0D0B46] text-sm sm:text-base" />
                  ) : (
                    <FaPlus className="text-[#0D0B46] text-sm sm:text-base" />
                  )}
                </button>
                {activeFAQ === index && (
                  <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
