import { baseApi } from '../api/baseApi';
import type { Category } from '../../types/types.index';

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Tree structure — root categories + subCategories nested
    // Navigation sidebar, AdminCategories tree view তে ব্যবহার হয়
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    // Flat list — সব categories parent info সহ
    // Product form এর categoryId dropdown তে ব্যবহার হয়
    getFlatCategories: builder.query<Category[], void>({
      query: () => '/categories/flat',
      providesTags: ['Categories'],
    }),

    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: builder.mutation<Category, { id: string } & Partial<Category>>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetFlatCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
