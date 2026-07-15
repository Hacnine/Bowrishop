import { baseApi } from "../api/baseApi";
import type { Cart } from "../../types/types.index";

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<Cart, void>({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),

    addToCart: builder.mutation<
      any,
      { productId: string; variantId?: string | null; quantity: number }
    >({
      query: (body) => ({ url: "/cart", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),

    updateCartItem: builder.mutation<
      any,
      { cartItemId: string; quantity: number }
    >({
      query: ({ cartItemId, quantity }) => ({
        url: `/cart/${cartItemId}`,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: ["Cart"],
    }),

    removeCartItem: builder.mutation<any, { cartItemId: string }>({
      query: ({ cartItemId }) => ({
        url: `/cart/${cartItemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),

    clearCart: builder.mutation<any, void>({
      query: () => ({ url: "/cart/clear", method: "DELETE" }),
      invalidatesTags: ["Cart"],
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
