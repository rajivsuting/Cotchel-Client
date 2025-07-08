import { apiSlice } from "./apiSlice";

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({
        page = 1,
        limit = 10,
        category,
        subCategory,
        minPrice,
        maxPrice,
        sortBy = "createdAt",
        order = "desc",
      }) => ({
        url: "/products",
        params: {
          page,
          limit,
          category,
          subCategory,
          minPrice,
          maxPrice,
          sortBy,
          order,
        },
      }),
      providesTags: ["Product"],
    }),
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    getCategories: builder.query({
      query: () => "/products/categories",
    }),
    getSubCategories: builder.query({
      query: (category) => `/products/categories/${category}/subcategories`,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
} = productApi;
