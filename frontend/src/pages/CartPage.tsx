import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from '../features/cart/cartApi';
import { useValidateCouponMutation } from '../features/coupons/couponsApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { updateGuestItem, removeGuestItem, clearGuestCart } from '../features/cart/guestCartSlice';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils';
import type { Coupon } from '../types';

export function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const guestItems = useAppSelector((s) => s.guestCart.items);

  // Server cart (auth users)
  const { data: cart, isLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart] = useClearCartMutation();
  const [validateCoupon, { isLoading: validatingCoupon }] = useValidateCouponMutation();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Unified items list
  const items = isAuthenticated
    ? (cart?.items ?? [])
    : guestItems.map((gi) => ({
        id: gi.productId,
        quantity: gi.quantity,
        product: { ...gi.product, categoryId: '' },
      }));

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = Math.max(0, subtotal - couponDiscount);

  const handleUpdateQty = (productId: string, quantity: number) => {
    if (isAuthenticated) {
      updateItem({ productId, quantity });
    } else {
      dispatch(updateGuestItem({ productId, quantity }));
    }
  };

  const handleRemove = (productId: string) => {
    if (isAuthenticated) {
      removeItem(productId);
    } else {
      dispatch(removeGuestItem(productId));
    }
  };

  const handleClear = async () => {
    if (isAuthenticated) {
      await clearCart();
    } else {
      dispatch(clearGuestCart());
    }
    toast.success('Cart cleared');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await validateCoupon({ code: couponCode, orderTotal: subtotal }).unwrap();
      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discount);
        toast.success(`Coupon applied! You save ${formatCurrency(result.discount)}`);
      } else {
        toast.error('Invalid or expired coupon');
      }
    } catch {
      toast.error('Could not apply coupon');
    }
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout', {
      state: { couponCode: appliedCoupon?.code, couponDiscount },
    });
  };

  if (isAuthenticated && isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products to get started.</p>
        <Link to="/products"><Button>Browse products</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-end">
            <button onClick={handleClear} className="text-sm text-red-500 hover:text-red-700">
              Clear all
            </button>
          </div>

          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4">
              <Link to={`/products/${item.product.slug}`} className="flex-shrink-0">
                <img
                  src={item.product.images[0] ?? '/placeholder.jpg'}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-indigo-600 line-clamp-2">
                  {item.product.name}
                </Link>
                <p className="text-indigo-600 font-semibold mt-1">{formatCurrency(item.product.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => handleRemove(item.product.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    className="px-2.5 py-1 hover:bg-gray-50 text-sm"
                    onClick={() => handleUpdateQty(item.product.id, Math.max(1, item.quantity - 1))}
                  >−</button>
                  <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                  <button
                    className="px-2.5 py-1 hover:bg-gray-50 text-sm"
                    onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                  >+</button>
                </div>
                <p className="text-sm text-gray-500">{formatCurrency(item.product.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span><span className="text-green-600">Free</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mb-5">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Coupon */}
            {!appliedCoupon && (
              <div className="flex gap-2 mb-5">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={handleApplyCoupon} isLoading={validatingCoupon}>
                  Apply
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <p className="text-xs text-gray-500 mb-4 text-center">
                Checking out as guest. <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link> to save your order history.
              </p>
            )}

            <Button className="w-full" onClick={handleProceedToCheckout}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

