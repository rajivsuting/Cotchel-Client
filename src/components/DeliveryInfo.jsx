import { FiTruck, FiShield, FiClock } from "react-icons/fi";

const DeliveryInfo = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#0D0B46]/5 rounded-full flex items-center justify-center">
          <FiTruck className="w-6 h-6 text-[#0D0B46]" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">
            Fast & Reliable Delivery
          </h3>
          <p className="text-sm text-gray-500">Fast delivery all over India</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#0D0B46]/5 rounded-full flex items-center justify-center">
          <FiShield className="w-6 h-6 text-[#0D0B46]" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Secure Payment</h3>
          <p className="text-sm text-gray-500">100% secure checkout</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#0D0B46]/5 rounded-full flex items-center justify-center">
          <FiClock className="w-6 h-6 text-[#0D0B46]" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">24/7 Support</h3>
          <p className="text-sm text-gray-500">Dedicated support team</p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfo;
