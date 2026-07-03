import { baseApi } from '../api/baseApi';
import type { Review } from '../../types';

interface ReviewsResponse { reviews: Review[]; averageRating: number; count: number; }

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductReviews: builder.query<ReviewsResponse, string>({
      query: (productId) => `/products/${productId}/reviews`,
      providesTags: (_, __, id) => [{ type: 'Reviews', id }],
    }),
    createReview: builder.mutation<Review, { productId: string; rating: number; comment?: string }>({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_, __, { productId }) => [{ type: 'Reviews', id: productId }],
    }),
    updateReview: builder.mutation<Review, { productId: string; reviewId: string; rating?: number; comment?: string }>({
      query: ({ productId, reviewId, ...body }) => ({
        url: `/products/${productId}/reviews/${reviewId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_, __, { productId }) => [{ type: 'Reviews', id: productId }],
    }),
    deleteReview: builder.mutation<void, { productId: string; reviewId: string }>({
      query: ({ productId, reviewId }) => ({
        url: `/products/${productId}/reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { productId }) => [{ type: 'Reviews', id: productId }],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewsApi;
