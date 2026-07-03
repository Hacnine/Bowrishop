import { baseApi } from '../api/baseApi';
import type { Product, PaginatedResponse } from '../../types';

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
    getFeaturedProducts: builder.query<Product[], number | number | void>({
      query: (limit) => ({ url: '/products/featured', params: limit ? { limit } : {} }),
      providesTags: ['Products'],
    }),
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => `/products/${slug}`,
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
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
