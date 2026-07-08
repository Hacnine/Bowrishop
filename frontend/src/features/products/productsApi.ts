import { baseApi } from '../api/baseApi';
import type { Product, PaginatedResponse } from '../../types';
import { getSessionId } from '../../utils/session';

interface ProductsQuery {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

type BackendProductsResponse = Omit<PaginatedResponse<Product>, 'data'> & { products: Product[] };

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductsQuery>({
      query: (params) => ({ url: '/products', params }),
      transformResponse: (res: BackendProductsResponse) => ({
        data: res.products,
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
      }),
      providesTags: ['Products'],
    }),

    getFeaturedProducts: builder.query<Product[], number | void>({
      query: (limit) => ({ url: '/products/featured', params: limit ? { limit } : {} }),
      providesTags: ['Products'],
    }),

    getBestSellingProducts: builder.query<Product[], number | void>({
      query: (limit) => ({ url: '/products/best-selling', params: limit ? { limit } : {} }),
      providesTags: ['Products'],
    }),

    getOnSaleProducts: builder.query<Product[], number | void>({
      query: (limit) => ({ url: '/products/on-sale', params: limit ? { limit } : {} }),
      providesTags: ['Products'],
    }),

    getNewArrivalProducts: builder.query<Product[], number | void>({
      query: (limit) => ({ url: '/products/new-arrivals', params: limit ? { limit } : {} }),
      providesTags: ['Products'],
    }),

    getMostViewedProducts: builder.query<Product[], number | void>({
      query: (limit) => ({ url: '/products/most-viewed', params: limit ? { limit } : {} }),
      providesTags: ['Products'],
    }),

    // Sends x-session-id header so the backend can record the view
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => ({
        url: `/products/${slug}`,
        headers: { 'x-session-id': getSessionId() },
      }),
      providesTags: (_, __, slug) => [{ type: 'Product', id: slug }],
    }),

    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Products'],
    }),

    updateProduct: builder.mutation<Product, { id: string } & Partial<Product>>({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Products'],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetFeaturedProductsQuery,
  useGetBestSellingProductsQuery,
  useGetOnSaleProductsQuery,
  useGetNewArrivalProductsQuery,
  useGetMostViewedProductsQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
