import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute, { NotSellerRoute } from "../components/ProtectedRoute";
import BuyerDashboardLayout from "../layouts/BuyerDashboardLayout";
import SellerDashboardLayout from "../layouts/SellerDashboardLayout";

// Lazy load components
const Home = lazy(() => import("../pages/Home"));
const Products = lazy(() => import("../pages/Products"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../pages/Checkout"));
const AddressSelection = lazy(() => import("../pages/AddressSelection"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const RequestReset = lazy(() => import("../pages/RequestReset"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Category = lazy(() => import("../pages/Category"));
const BecomeSeller = lazy(() => import("../pages/BecomeSeller"));
const BuyerProfile = lazy(() => import("../pages/buyer/Profile"));
const BuyerOrders = lazy(() => import("../pages/buyer/OrderHistory"));
const BuyerOrderDetails = lazy(() => import("../pages/buyer/OrderDetails"));
const BuyerWishlist = lazy(() => import("../pages/Wishlist"));
const BuyerManageAddress = lazy(() => import("../pages/buyer/ManageAddress"));
const BuyerSettings = lazy(() => import("../pages/buyer/Settings"));
const SellerDetails = lazy(() => import("../pages/SellerDetails"));
const SellerVerification = lazy(() => import("../pages/SellerVerification"));
const SellerDashboard = lazy(() => import("../pages/seller/SellerDashboard"));
const SellerOverview = lazy(() => import("../pages/seller/Overview"));
const SellerProducts = lazy(() => import("../pages/seller/Products"));
const SellerOrders = lazy(() => import("../pages/seller/Orders"));
const SellerEarnings = lazy(() => import("../pages/seller/Earnings"));
const SellerSettings = lazy(() => import("../pages/seller/Settings"));
const SellerCustomerSupport = lazy(() =>
  import("../pages/seller/CustomerSupport")
);
const SellerNotifications = lazy(() => import("../pages/seller/Notifications"));
const SellerAddProduct = lazy(() => import("../pages/seller/AddProduct"));
const SellerAllProducts = lazy(() => import("../pages/seller/AllProducts"));
const OrderConfirmation = lazy(() => import("../pages/OrderConfirmation"));
const Contact = lazy(() => import("../pages/Contact"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D0B46]"></div>
  </div>
);

// Route wrapper component for lazy loading
const LazyRoute = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
);

// Routes configuration
export const routes = [
  {
    path: "/",
    element: (
      <LazyRoute>
        <NotSellerRoute>
          <Home />
        </NotSellerRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/products",
    element: (
      <LazyRoute>
        <NotSellerRoute>
          <Products />
        </NotSellerRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/product/:id",
    element: (
      <LazyRoute>
        <NotSellerRoute>
          <ProductDetail />
        </NotSellerRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/category/:categoryName",
    element: (
      <LazyRoute>
        <NotSellerRoute>
          <Category />
        </NotSellerRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/category/:categoryName/:subCategoryName",
    element: (
      <LazyRoute>
        <NotSellerRoute>
          <Category />
        </NotSellerRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/cart",
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <Cart />
        </ProtectedRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/checkout",
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/address-selection",
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <AddressSelection />
        </ProtectedRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/order-confirmation/:orderId",
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <OrderConfirmation />
        </ProtectedRoute>
      </LazyRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <LazyRoute>
        <Login />
      </LazyRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <LazyRoute>
        <Register />
      </LazyRoute>
    ),
  },
  {
    path: "/request-reset",
    element: (
      <LazyRoute>
        <RequestReset />
      </LazyRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <LazyRoute>
        <ResetPassword />
      </LazyRoute>
    ),
  },
  {
    path: "/become-seller",
    element: (
      <LazyRoute>
        <BecomeSeller />
      </LazyRoute>
    ),
  },
  {
    path: "/contact",
    element: (
      <LazyRoute>
        <Contact />
      </LazyRoute>
    ),
  },
  // Buyer Dashboard Routes
  {
    path: "/buyer",
    element: (
      <LazyRoute>
        <ProtectedRoute allowedRoles={["Buyer"]}>
          <BuyerDashboardLayout />
        </ProtectedRoute>
      </LazyRoute>
    ),
    children: [
      {
        path: "profile",
        element: (
          <LazyRoute>
            <BuyerProfile />
          </LazyRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <LazyRoute>
            <BuyerOrders />
          </LazyRoute>
        ),
      },
      {
        path: "orders/:orderId",
        element: (
          <LazyRoute>
            <BuyerOrderDetails />
          </LazyRoute>
        ),
      },
      {
        path: "wishlist",
        element: (
          <LazyRoute>
            <BuyerWishlist />
          </LazyRoute>
        ),
      },
      {
        path: "manage-address",
        element: (
          <LazyRoute>
            <BuyerManageAddress />
          </LazyRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <LazyRoute>
            <BuyerSettings />
          </LazyRoute>
        ),
      },
    ],
  },
  {
    path: "/seller-details",
    element: (
      <LazyRoute>
        <SellerDetails />
      </LazyRoute>
    ),
  },
  {
    path: "/seller-verification",
    element: (
      <LazyRoute>
        <SellerVerification />
      </LazyRoute>
    ),
  },
  {
    path: "/seller",
    element: (
      <LazyRoute>
        <ProtectedRoute allowedRoles={["Seller"]}>
          <Navigate to="/seller/dashboard" replace />
        </ProtectedRoute>
      </LazyRoute>
    ),
  },
  // Seller Dashboard Routes
  {
    path: "/seller/dashboard",
    element: (
      <LazyRoute>
        <ProtectedRoute allowedRoles={["Seller"]}>
          <SellerDashboardLayout />
        </ProtectedRoute>
      </LazyRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyRoute>
            <SellerDashboard />
          </LazyRoute>
        ),
      },
      {
        path: "overview",
        element: (
          <LazyRoute>
            <SellerOverview />
          </LazyRoute>
        ),
      },
      {
        path: "products",
        element: (
          <LazyRoute>
            <SellerAllProducts />
          </LazyRoute>
        ),
      },
      {
        path: "products/add",
        element: (
          <LazyRoute>
            <SellerAddProduct />
          </LazyRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <LazyRoute>
            <SellerOrders />
          </LazyRoute>
        ),
      },
      {
        path: "earnings",
        element: (
          <LazyRoute>
            <SellerEarnings />
          </LazyRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <LazyRoute>
            <SellerSettings />
          </LazyRoute>
        ),
      },
      {
        path: "customer-support",
        element: (
          <LazyRoute>
            <SellerCustomerSupport />
          </LazyRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <LazyRoute>
            <SellerNotifications />
          </LazyRoute>
        ),
      },
    ],
  },
  {
    path: "/404",
    element: (
      <LazyRoute>
        <Navigate to="/" replace />
      </LazyRoute>
    ),
  },
  {
    path: "*",
    element: (
      <LazyRoute>
        <Navigate to="/" replace />
      </LazyRoute>
    ),
  },
];
