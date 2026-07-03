import { baseApi } from '../api/baseApi';
import type { Coupon } from '../../types';

export const couponsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    validateCoupon: builder.mutation<{ valid: boolean; coupon: Coupon; discount: number }, { code: string; orderTotal: number }>({
      query: (body) => ({ url: '/coupons/validate', method: 'POST', body }),
    }),
    getCoupons: builder.query<Coupon[], void>({
      query: () => '/coupons',
      providesTags: ['Coupons'],
    }),
    createCoupon: builder.mutation<Coupon, Partial<Coupon> & { discountType: string }>({
      query: (body) => ({ url: '/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupons'],
    }),
    updateCoupon: builder.mutation<Coupon, { code: string } & Partial<Coupon>>({
      query: ({ code, ...body }) => ({ url: `/coupons/${code}`, method: 'PATCH', body }),
      invalidatesTags: ['Coupons'],
    }),
    deleteCoupon: builder.mutation<void, string>({
      query: (code) => ({ url: `/coupons/${code}`, method: 'DELETE' }),
      invalidatesTags: ['Coupons'],
    }),
  }),
});

export const {
  useValidateCouponMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = couponsApi;
