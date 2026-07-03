import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useGetOrdersQuery } from '../features/orders/ordersApi';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate, getOrderStatusColor } from '../utils';

export function OrdersPage() {
  const { data: orders, isLoading } = useGetOrdersQuery();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
        <Link to="/products"><Button>Start Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-mono font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getOrderStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{order.items?.length ?? 0} item(s)</p>
              <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
