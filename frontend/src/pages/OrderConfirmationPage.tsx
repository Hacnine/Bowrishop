import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';
import { useGetOrderByIdQuery, useGetGuestOrderQuery } from '../features/orders/ordersApi';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrency } from '../utils';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const isGuest = pathname.includes('guest-success');

  const { data: authOrder, isLoading: authLoading } = useGetOrderByIdQuery(id!, { skip: isGuest });
  const { data: guestOrder, isLoading: guestLoading } = useGetGuestOrderQuery(id!, { skip: !isGuest });

  const isLoading = isGuest ? guestLoading : authLoading;
  const order = isGuest ? guestOrder : authOrder;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-4">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">Order not found.</p>
        {!isGuest && <Link to="/profile/orders"><Button variant="outline">My Orders</Button></Link>}
        <Link to="/products"><Button className="ml-2">Continue Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order placed!</h1>
      <p className="text-gray-500 mb-8">
        Thank you for your purchase. Order <span className="font-mono font-medium text-gray-700">#{order.id.slice(-8).toUpperCase()}</span> is being processed.
      </p>

      {isGuest && order.guestEmail && (
        <p className="text-sm text-gray-500 mb-8">
          Confirmation sent to <span className="font-medium text-gray-700">{order.guestEmail}</span>
        </p>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Order details</h2>
        </div>

        <div className="space-y-3 mb-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-700">{item.product?.name ?? 'Product'} ×{item.quantity}</span>
              <span className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span><span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        {!isGuest && <Link to="/profile/orders"><Button variant="outline">My Orders</Button></Link>}
        {isGuest && <Link to="/login"><Button variant="outline">Sign in to track orders</Button></Link>}
        <Link to="/products"><Button>Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
