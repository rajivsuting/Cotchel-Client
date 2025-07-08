import { apiGet } from "./apiService";
import { API, API_BASE_URL } from "../config/api";

const sellerDashboardService = {
  getDashboardData: async () => {
    const result = await apiGet(
      API.USER.SELLER_DASHBOARD.replace(API_BASE_URL, "")
    );
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  },
};

export default sellerDashboardService;
