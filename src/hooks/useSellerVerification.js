import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const useSellerVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (!user.isVerifiedSeller) {
        if (user.sellerDetails) {
          // User has submitted details but not verified yet
          navigate("/seller-verification");
          return;
        } else {
          // User hasn't submitted seller details yet
          navigate("/seller-details");
          return;
        }
      }
    }
  }, [user, navigate]);

  return {
    isVerified: user?.isVerifiedSeller || false,
    hasSellerDetails: !!user?.sellerDetails,
    user,
  };
};
