import { useNavigate } from "react-router-dom";

const SellerVerification = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-200 flex flex-col items-center pt-20 px-4">
      <img
        src="/signup3.png"
        alt="Verification"
        className="w-32 h-32 mb-6 opacity-95"
      />
      <h1 className="text-3xl font-extrabold text-[#0D0B46] mb-3 text-center tracking-tight">
        Account Under Review
      </h1>
      <p className="text-gray-700 text-center mb-8 text-base leading-relaxed max-w-lg">
        Your seller account is being verified by{" "}
        <span className="font-semibold text-[#0D0B46]">Cotchel</span>.<br />
        This may take up to <span className="font-semibold">24 hours</span>.
        <br />
        You will be notified once your account is approved.
      </p>
      <button
        className="bg-[#0D0B46] text-white px-8 py-2.5 rounded-lg font-semibold text-base hover:bg-opacity-90 transition-colors cursor-pointer shadow-sm"
        onClick={() => navigate("/")}
      >
        Go to Home
      </button>
    </div>
  );
};

export default SellerVerification;
