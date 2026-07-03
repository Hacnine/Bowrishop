import { baseApi } from '../api/baseApi';
import type { Order, PaginatedResponse, ShippingAddress } from '../../types';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => ({ url: '/orders', params: { limit: 100 } }),
      transformResponse: (res: { orders?: Order[] } | Order[]) =>
        Array.isArray(res) ? res : (res.orders ?? []),
      providesTags: ['Orders'],
    }),
    getOrderById: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_, __, id) => [{ type: 'Order', id }],
    }),
    getGuestOrder: builder.query<Order, string>({
      query: (id) => `/orders/guest/${id}`,
    }),
    createOrder: builder.mutation<Order, { shippingAddress: ShippingAddress; couponCode?: string; notes?: string }>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Orders', 'Cart'],
    }),
    createGuestOrder: builder.mutation<
      Order,
      {
        guestEmail: string;
        guestName: string;
        items: { productId: string; quantity: number }[];
        shippingAddress: ShippingAddress;
        couponCode?: string;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/orders/guest', method: 'POST', body }),
    }),
    getAdminOrders: builder.query<PaginatedResponse<Order>, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({ url: '/orders/admin', params }),
      transformResponse: (res: { orders?: Order[]; data?: Order[]; total: number; page: number; limit: number; totalPages: number }) => ({
        data: res.orders ?? res.data ?? [],
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
      }),
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useGetGuestOrderQuery,
  useCreateOrderMutation,
  useCreateGuestOrderMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
} = ordersApi;
