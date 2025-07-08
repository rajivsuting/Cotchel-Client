import { Outlet } from "react-router-dom";
import BuyerSidebar from "../components/BuyerSidebar";

const BuyerDashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-[100%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-6xl 2xl:max-w-7xl mx-auto px-1 sm:px-4 py-1 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Sidebar - only show on large screens */}
          <div className="hidden lg:block lg:col-span-1">
            <BuyerSidebar />
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3 pb-20 lg:pb-0 flex justify-center lg:justify-start">
            <div className="w-full max-w-full lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl bg-white border border-gray-200 sm:border-0 rounded-none sm:rounded-xl p-2 sm:p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboardLayout;
