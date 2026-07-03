import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useGetCartQuery } from '../features/cart/cartApi';
import { useCreateOrderMutation, useCreateGuestOrderMutation } from '../features/orders/ordersApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { clearGuestCart } from '../features/cart/guestCartSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../utils';

const schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  streetAddress: z.string().min(3, 'Street address required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  country: z.string().min(2, 'Country required'),
  zipCode: z.string().min(3, 'Zip code required'),
  guestEmail: z.string().optional(),
  guestName: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const state = location.state as { couponCode?: string; couponDiscount?: number } | null;

  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const guestItems = useAppSelector((s) => s.guestCart.items);

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();
  const [createGuestOrder, { isLoading: creatingGuest }] = useCreateGuestOrderMutation();
  const isLoading = creatingOrder || creatingGuest;

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const items = isAuthenticated
    ? (cart?.items ?? []).map((i) => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity }))
    : guestItems.map((i) => ({ id: i.productId, name: i.product.name, price: i.product.price, quantity: i.quantity }));

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = state?.couponDiscount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const onSubmit = async (data: FormValues) => {
    if (isAuthenticated) {
      try {
        const order = await createOrder({
          shippingAddress: {
            fullName: data.fullName,
            streetAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
          },
          couponCode: state?.couponCode,
        }).unwrap();
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
          items: guestItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: {
            fullName: data.fullName,
            streetAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
          },
          couponCode: state?.couponCode,
        }).unwrap();
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
            <Input label="Street address" error={errors.streetAddress?.message} {...register('streetAddress')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" error={errors.city?.message} {...register('city')} />
              <Input label="State / Region" error={errors.state?.message} {...register('state')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Zip code" error={errors.zipCode?.message} {...register('zipCode')} />
              <Input label="Country" error={errors.country?.message} {...register('country')} />
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
                <span>Shipping</span><span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-800">
              This is a demo store. No real payment is processed.
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Place order
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}


