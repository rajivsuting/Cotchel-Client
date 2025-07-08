import api from "../../services/apiService";

export const axiosBaseQuery =
  ({ baseUrl = "" } = {}) =>
  async (args) => {
    let { url, method, data, body, params, headers } = args;
    if (!url) {
      return {
        error: {
          status: 400,
          data: "No URL provided to axiosBaseQuery",
        },
      };
    }
    // Remove double slashes in URL
    let fullUrl = baseUrl.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
    try {
      const result = await api({
        url: fullUrl,
        method,
        data: data ?? body,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      let err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
