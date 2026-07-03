import { baseApi } from '../api/baseApi';
import type { Inquiry } from '../../types';

export const inquiriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createInquiry: builder.mutation<Inquiry, { subject: string; message: string; name?: string; email?: string }>({
      query: (body) => ({ url: '/inquiries', method: 'POST', body }),
    }),
    getInquiries: builder.query<Inquiry[], void>({
      query: () => '/inquiries',
      providesTags: ['Inquiries'],
    }),
    respondInquiry: builder.mutation<Inquiry, { id: string; response: string; status?: string }>({
      query: ({ id, ...body }) => ({
        url: `/inquiries/${id}/respond`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Inquiries'],
    }),
  }),
});

export const {
  useCreateInquiryMutation,
  useGetInquiriesQuery,
  useRespondInquiryMutation,
} = inquiriesApi;
