import { useGetAdminStatsQuery } from '../../features/admin/adminApi';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils';
import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStatsQuery();

  const cards = [
    { label: 'Total Revenue', value: stats ? formatCurrency(stats.totalRevenue) : '—', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'Total Products', value: stats?.totalProducts ?? '—', icon: Package, color: 'bg-purple-500' },
    { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'bg-amber-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : <p className="text-2xl font-bold text-gray-900">{value}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Orders</h2>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-3 font-mono text-gray-700">#{order.id.slice(-8).toUpperCase()}</td>
                  <td className="py-3 text-gray-700">{order.user?.name ?? '—'}</td>
                  <td className="py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">No recent orders.</p>
        )}
      </div>
    </div>
  );
}
