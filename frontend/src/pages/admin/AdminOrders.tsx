import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../../features/orders/ordersApi';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../utils';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function AdminOrders() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAdminOrdersQuery({ page, limit: 20 });
  const [updateStatus] = useUpdateOrderStatusMutation();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success('Status updated');
    } catch {
      toast.error('Could not update status');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Orders</h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-gray-700">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-6 py-4 text-gray-700">{order.user?.name ?? '—'}<br /><span className="text-xs text-gray-400">{order.user?.email}</span></td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-full border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${getOrderStatusColor(order.status)}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
