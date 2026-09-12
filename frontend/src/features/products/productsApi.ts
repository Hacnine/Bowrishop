import { baseApi } from "../api/baseApi";
import { getSessionId } from "../../utils/session";
import type {
  CreateVariantPayload,
  ProductVariant,
  UpdateVariantPayload,
  PaginatedResponse,
  Product,
} from "../../types/types.index";

interface ProductsQuery {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  preOrder?: boolean;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

type BackendProductsResponse = Omit<PaginatedResponse<Product>, "data"> & {
  products: Product[];
};

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductsQuery>({
      query: (params) => ({ url: "/products", params }),
      transformResponse: (res: BackendProductsResponse) => ({
        data: res.products,
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
      }),
      providesTags: ["Products"],
    }),

    getAdminProducts: builder.query<PaginatedResponse<Product>, ProductsQuery>({
      query: (params) => ({ url: "/products/admin/search", params }),
      transformResponse: (res: BackendProductsResponse) => ({
        data: res.products,
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
      }),
      providesTags: ["Products"],
    }),

    getFeaturedProducts: builder.query<Product[], number | void>({
      query: (limit) => ({
        url: "/products/featured",
        params: limit ? { limit } : {},
      }),
      providesTags: ["Products"],
    }),

    getBestSellingProducts: builder.query<Product[], number | void>({
      query: (limit) => ({
        url: "/products/best-selling",
        params: limit ? { limit } : {},
      }),
      providesTags: ["Products"],
    }),

    getOnSaleProducts: builder.query<Product[], number | void>({
      query: (limit) => ({
        url: "/products/on-sale",
        params: limit ? { limit } : {},
      }),
      providesTags: ["Products"],
    }),

    getNewArrivalProducts: builder.query<Product[], number | void>({
      query: (limit) => ({
        url: "/products/new-arrivals",
        params: limit ? { limit } : {},
      }),
      providesTags: ["Products"],
    }),

    getMostViewedProducts: builder.query<Product[], number | void>({
      query: (limit) => ({
        url: "/products/most-viewed",
        params: limit ? { limit } : {},
      }),
      providesTags: ["Products"],
    }),

    getRelatedProducts: builder.query<
      Product[],
      { productId: string; limit?: number }
    >({
      query: ({ productId, limit = 20 }) => ({
        url: `/products/${productId}/related`,
        params: { limit },
      }),
      providesTags: ["Products"],
    }),

    // Sends x-session-id header so the backend can record the view
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => ({
        url: `/products/${slug}`,
        headers: { "x-session-id": getSessionId() },
      }),
      providesTags: (_, __, slug) => [{ type: "Product", id: slug }],
    }),

    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Products"],
    }),

    updateProduct: builder.mutation<Product, { id: string } & Partial<Product>>(
      {
        query: ({ id, ...body }) => ({
          url: `/products/${id}`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: (_, __, { id }) => [
          "Products",
          { type: "Product", id },
        ],
      },
    ),

    removeProductImage: builder.mutation<Product, { id: string; url: string }>({
      query: ({ id, url }) => ({
        url: `/products/${id}/images`,
        method: "DELETE",
        body: { url },
      }),
      invalidatesTags: ["Products", "Product"],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products"],
    }),
    // ─── Variant endpoints ────────────────────────────────────────────────────
    getVariants: builder.query<ProductVariant[], string>({
      query: (productId) => `/products/${productId}/variants`,
      providesTags: (_, __, productId) => [{ type: "Product", id: productId }],
    }),
    createVariant: builder.mutation<
      ProductVariant,
      { productId: string; data: CreateVariantPayload }
    >({
      query: ({ productId, data }) => ({
        url: `/products/${productId}/variants`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_, __, { productId }) => [
        { type: "Product", id: productId },
        "Products",
      ],
    }),
    updateVariant: builder.mutation<
      ProductVariant,
      { productId: string; variantId: string; data: UpdateVariantPayload }
    >({
      query: ({ productId, variantId, data }) => ({
        url: `/products/${productId}/variants/${variantId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_, __, { productId }) => [
        { type: "Product", id: productId },
        "Products",
      ],
    }),
    deleteVariant: builder.mutation<
      void,
      { productId: string; variantId: string }
    >({
      query: ({ productId, variantId }) => ({
        url: `/products/${productId}/variants/${variantId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, { productId }) => [
        { type: "Product", id: productId },
        "Products",
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetAdminProductsQuery,
  useGetFeaturedProductsQuery,
  useGetBestSellingProductsQuery,
  useGetOnSaleProductsQuery,
  useGetNewArrivalProductsQuery,
  useGetMostViewedProductsQuery,
  useGetRelatedProductsQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useRemoveProductImageMutation,
  useDeleteProductMutation,
  useGetVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} = productsApi;
