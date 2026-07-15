import { baseApi } from '../api/baseApi';
import type { Cart } from '../../types/types.index';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<Cart, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),

    addToCart: builder.mutation<any, { productId: string; variantId?: string | null; quantity: number }>({
      query: (body) => ({ url: '/cart', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),

    updateCartItem: builder.mutation<
      any, 
      { productId: string; variantId?: string | null; quantity: number }
    >({
      query: ({ productId, variantId, quantity }) => ({
        url: `/cart/${productId}`,
        method: 'PATCH',
        body: { quantity, variantId }, 
      }),
      invalidatesTags: ['Cart'],
    }),

    removeCartItem: builder.mutation<any, { productId: string; variantId?: string | null }>({
      query: ({ productId, variantId }) => ({ 
        url: `/cart/${productId}`, 
        method: 'DELETE',
        body: { variantId } 
      }),
      invalidatesTags: ['Cart'],
    }),

    clearCart: builder.mutation<any, void>({
      query: () => ({ url: '/cart/clear', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;