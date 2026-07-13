import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, X, Package, MapPin, Phone, Mail, CreditCard, CheckCheck } from 'lucide-react';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../../features/orders/ordersApi';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../utils';
import type { Order } from '../../types/types.index';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <div className="flex items-center flex-1 min-w-0">
        <span className="text-sm text-gray-900 font-medium break-all">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const addr = order.shippingAddress as any;
  const txId = addr?.paymentTransactionId ?? (order as any).paymentTransactionId ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-semibold text-gray-900">Order Details</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Customer */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Customer</h3>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-1">
              <DetailRow label="Name" value={order.user?.name ?? order.guestName} />
              <DetailRow label="Email" value={order.user?.email ?? order.guestEmail} />
            </div>
          </div>

          {/* Shipping address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Shipping Address</h3>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-1">
              <DetailRow label="Full name"     value={addr?.fullName} />
              <DetailRow label="Phone"         value={addr?.phoneNumber} />
              <DetailRow label="Street"        value={addr?.streetAddress} />
              <DetailRow label="City"          value={addr?.city} />
              <DetailRow label="State/Region"  value={addr?.state} />
              <DetailRow label="Zip code"      value={addr?.zipCode} />
              <DetailRow label="Country"       value={addr?.country} />
            </div>
          </div>

          {/* Payment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Payment</h3>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-1">
              <DetailRow label="Transaction ID" value={txId} />
              <DetailRow label="Coupon code"    value={order.couponCode} />
              <DetailRow label="Subtotal"       value={formatCurrency(order.subtotal)} />
              {Number(order.discount) > 0 && (
                <DetailRow label="Discount" value={`-${formatCurrency(order.discount)}`} />
              )}
              <DetailRow label="Total" value={formatCurrency(order.total)} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Items ({order.items?.length ?? 0})
              </h3>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-2 space-y-2">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-4">
                    {formatCurrency(Number(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">Note</p>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-4 font-medium">Order</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.data.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-gray-700">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {order.user?.name ?? order.guestName ?? '—'}
                      <br />
                      <span className="text-xs text-gray-400">{order.user?.email ?? order.guestEmail}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {(order.shippingAddress as any)?.phoneNumber ?? '—'}
                    </td>
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
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order as any)}
                        className="text-xs text-indigo-600 font-medium hover:underline whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}