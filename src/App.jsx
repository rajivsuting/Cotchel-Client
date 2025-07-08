import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import BuyerDashboardLayout from "./layouts/BuyerDashboardLayout";
import AddressSelection from "./pages/AddressSelection";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { Toaster } from "react-hot-toast";
import ManageAddress from "./pages/buyer/ManageAddress";
import BuyerBottomNav from "./components/BuyerBottomNav";
import SellerDashboardLayout from "./layouts/SellerDashboardLayout";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes/index";
import axios from "axios";
import { initializeCSRFToken } from "./services/apiService";
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";

import { NotificationProvider } from "./context/NotificationContext";
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerOverview = lazy(() => import("./pages/seller/Overview"));
const SellerProducts = lazy(() => import("./pages/seller/Products"));
const SellerOrders = lazy(() => import("./pages/seller/Orders"));
const SellerEarnings = lazy(() => import("./pages/seller/Earnings"));
const SellerSettings = lazy(() => import("./pages/seller/Settings"));

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Report = lazy(() => import("./pages/Report"));
const Scan = lazy(() => import("./pages/Scan"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Category = lazy(() => import("./pages/Category"));
const Search = lazy(() => import("./pages/Search"));
const Checkout = lazy(() => import("./pages/Checkout"));
const BecomeSeller = lazy(() => import("./pages/BecomeSeller"));
// Buyer dashboard pages
const BuyerProfile = lazy(() => import("./pages/buyer/Profile"));
const BuyerOrderHistory = lazy(() => import("./pages/buyer/OrderHistory"));
const BuyerOrderDetails = lazy(() => import("./pages/buyer/OrderDetails"));
const SellerDetails = lazy(() => import("./pages/SellerDetails"));
const SellerVerification = lazy(() => import("./pages/SellerVerification"));

function AppRoutes() {
  return useRoutes(routes);
}

function AppContent() {
  const location = useLocation();
  const isSellerDashboard = location.pathname.startsWith("/seller");

  // Initialize CSRF token on app startup
  useEffect(() => {
    initializeCSRFToken();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {!isSellerDashboard && <Navbar />}
      <main
        className={`flex-grow${!isSellerDashboard ? " pb-20 md:pb-0" : ""}`}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <AppRoutes />
        </Suspense>
      </main>
      {!isSellerDashboard && <Footer />}
      <Toaster position="top-center" />
      {/* Global bottom nav for mobile only */}
      {!isSellerDashboard && (
        <div className="md:hidden">
          <BuyerBottomNav />
        </div>
      )}
    </div>
  );
}

function App() {
  useEffect(() => {
    initializeCSRFToken();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <ScrollToTop />
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
