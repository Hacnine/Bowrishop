'use client';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useGetCartQuery } from '../features/cart/cartApi';
import { useCreateOrderMutation, useCreateGuestOrderMutation } from '../features/orders/ordersApi';
import { useMetaPixel } from '../hooks/useMetaPixel';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { clearGuestCart } from '../features/cart/guestCartSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { formatCurrency } from '../utils';

// বাংলাদেশের ৮টি বিভাগের তালিকা
const BANGLADESH_DIVISIONS = [
  { value: 'Dhaka City', label: 'Dhaka City (Charge: ৳80)' },
  { value: 'Dhaka Division', label: 'Dhaka Division (outside city) (Charge: ৳150)' },
  { value: 'Chattogram', label: 'Chattogram (Charge: ৳150)' },
  { value: 'Rajshahi', label: 'Rajshahi (Charge: ৳150)' },
  { value: 'Khulna', label: 'Khulna (Charge: ৳150)' },
  { value: 'Barishal', label: 'Barishal (Charge: ৳150)' },
  { value: 'Sylhet', label: 'Sylhet (Charge: ৳150)' },
  { value: 'Rangpur', label: 'Rangpur (Charge: ৳150)' },
  { value: 'Mymensingh', label: 'Mymensingh (Charge: ৳150)' },
];

const schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  phoneNumber: z
    .string()
    .min(11, 'Enter a valid phone number')
    .regex(/^01[0-9]{9}$/, 'Enter a valid 11-digit phone number'),
  streetAddress: z.string().min(3, 'Street address required'),
  city: z.string().min(2, 'City/Division selection required'), // ড্রপডাউন ভ্যালিডেশন
  state: z.string().min(2, 'State / District required'),
  guestEmail: z.string().optional(),
  guestName: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const couponCode = searchParams.get('couponCode') ?? undefined;
  const couponDiscount = Number(searchParams.get('couponDiscount') ?? 0);

  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const guestItems = useAppSelector((s) => s.guestCart.items);

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();
  const [createGuestOrder, { isLoading: creatingGuest }] = useCreateGuestOrderMutation();
  const isLoading = creatingOrder || creatingGuest;

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      city: '', // ডিফল্ট ফাঁকা থাকবে যাতে ইউজার সিলেক্ট করতে বাধ্য হয়
    }
  });

  // 'city' ড্রপডাউনের সিলেক্টেড ভ্যালু লাইভ ট্র্যাক করা
  const selectedCity = useWatch({
    control,
    name: 'city',
    defaultValue: '',
  });

  const shippingCharge = selectedCity === 'Dhaka City' ? 80 : 150;

  const items = isAuthenticated
    ? (cart?.items ?? []).map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: Number(i.variant?.price ?? i.product.price),
        quantity: i.quantity,
      }))
    : guestItems.map((i) => ({
        id: i.productId,
        name: i.product.name,
        price: Number(i.variant?.price ?? i.product.price),
        quantity: i.quantity,
      }));

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Number.isFinite(couponDiscount) ? couponDiscount : 0;
  const total = Math.max(0, subtotal - discount + shippingCharge);
  const { getFbp, getFbc, generateEventId, firePixelEvent } = useMetaPixel();

  const onSubmit = async (data: FormValues) => {
    // generate event id and meta cookies
    const eventId = generateEventId('Purchase');
    const fbp = getFbp();
    const fbc = getFbc();

    // Helper function to fire Browser Pixel Purchase event with eventID
    const firePixelPurchase = (order: any) => {
      firePixelEvent(
        'Purchase',
        {
          value: Number(order.totalAmount || order.total || 0),
          currency: 'BDT',
          content_type: 'product',
          content_ids: order.items?.map((item: any) => (item.productId || item.product?.id || '').toString()) || [],
        },
        eventId,
      );
    };

    if (isAuthenticated) {
      try {
        const order = await createOrder({
          shippingAddress: {
            name: data.fullName,
            phone: data.phoneNumber,
            address: data.streetAddress,
            city: data.city,
            district: data.state,
            shippingCharge,
          },
          couponCode,
          // Meta fields for server-side conversions
          fbp,
          fbc,
          eventId,
          clientIp: undefined,
          clientUserAgent: navigator.userAgent,
        }).unwrap();

        firePixelPurchase(order); // 👈 রেজিস্টার্ড ইউজারের অর্ডার সফল হলে পিক্সেল ফায়ার
        navigate(`/orders/success/${order.id}`);
      } catch (err: unknown) {
        const e = err as { data?: { message?: string } };
        toast.error(e?.data?.message ?? 'Could not place order');
      }
    } else {
      if (!data.guestEmail || !data.guestEmail.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      try {
        const order = await createGuestOrder({
          guestEmail: data.guestEmail,
          guestName: data.guestName ?? data.fullName,
          items: guestItems.map((i) => ({ 
            productId: i.productId, 
            variantId: i.variant?.id ?? undefined,
            quantity: i.quantity 
          })),
          shippingAddress: {
            name: data.fullName,
            phone: data.phoneNumber,
            address: data.streetAddress,
            city: data.city,
            district: data.state,
            shippingCharge,
          },
          couponCode,
          // Meta fields
          fbp,
          fbc,
          eventId,
          clientIp: undefined,
          clientUserAgent: navigator.userAgent,
        }).unwrap();

        firePixelPurchase(order); // 👈 গেস্ট ইউজারের অর্ডার সফল হলে পিক্সেল ফায়ার
        dispatch(clearGuestCart());
        navigate(`/orders/guest-success/${order.id}`);
      } catch (err: unknown) {
        const e = err as { data?: { message?: string } };
        toast.error(e?.data?.message ?? 'Could not place order');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping form */}
        <div className="lg:col-span-2 space-y-6">
          {!isAuthenticated && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 mb-2">Contact information</h2>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={(errors as any).guestEmail?.message}
                {...register('guestEmail')}
              />
              <p className="text-xs text-gray-500 -mt-2">
                Order confirmation will be sent to this address.{' '}
                <a href="/login" className="text-indigo-600 hover:underline">Sign in</a> to save your order history.
              </p>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 mb-2">Shipping address</h2>
            <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
            <Input
              label="Phone number"
              type="tel"
              placeholder="01XXXXXXXXX"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
            <Input label="Street address" error={errors.streetAddress?.message} {...register('streetAddress')} />
            
            <div className="grid grid-cols-2 gap-4">
              {/* 👈 ড্রপডাউন সিলেক্ট ফিল্ড উইথ ট্র্যাডিশনাল টেইলউইন্ড ডিজাইন */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Delivery area</label>
                <select
                  {...register('city')}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">Select delivery area</option>
                  {BANGLADESH_DIVISIONS.map((div) => (
                    <option key={div.value} value={div.value}>
                      {div.label}
                    </option>
                  ))}
                </select>
                {errors.city?.message && (
                  <p className="text-xs text-red-500">{errors.city.message}</p>
                )}
              </div>

              <Input label="State / District" placeholder="e.g. Gazipur, Mirpur" error={errors.state?.message} {...register('state')} />
            </div>
            
            
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Order summary</h2>

            <div className="space-y-2 text-sm mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-gray-600">
                  <span className="line-clamp-1 flex-1 mr-2">{item.name} ×{item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm mb-5">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon</span><span>-{formatCurrency(discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                {!selectedCity ? (
                  <span className="text-gray-400">Select delivery area</span>
                ) : (
                  <span>{formatCurrency(shippingCharge)}</span>
                )}
              </div>

              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading} disabled={!selectedCity}>
              Place order
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
