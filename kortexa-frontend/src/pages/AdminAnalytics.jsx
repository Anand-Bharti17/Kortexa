import { useState, useEffect } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatPrice } from "../utils/currency";

function StatCard({ icon: Icon, label, value, accent }) {
  const colors = {
    indigo: "from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900",
    amber: "from-amber-50 to-amber-100 border-amber-200 text-amber-900",
    violet: "from-violet-50 to-violet-100 border-violet-200 text-violet-900",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${colors[accent]}`}>
      <div className="flex items-center gap-2 text-sm font-semibold opacity-80">
        <Icon size={16} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      window.location.href = "/";
    }
  }, [user]);

  useEffect(() => {
    api
      .get("/admin/analytics/overview")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading analytics..." />;
  }

  if (!data) {
    return (
      <p className="py-16 text-center text-gray-500">Could not load analytics.</p>
    );
  }

  const maxDailyRevenue = Math.max(
    ...(data.lastSevenDays || []).map((d) => Number(d.revenue) || 0),
    1,
  );

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform analytics</h1>
        <p className="mt-1 text-gray-600">
          GMV, orders, and category performance across Veluno
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total GMV"
          value={formatPrice(data.totalGmv)}
          accent="indigo"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue today"
          value={formatPrice(data.revenueToday)}
          accent="emerald"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total orders"
          value={data.totalOrders}
          accent="amber"
        />
        <StatCard
          icon={BarChart3}
          label="Est. commission (10%)"
          value={formatPrice(data.estimatedCommission)}
          accent="violet"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Orders today</p>
          <p className="text-2xl font-bold text-gray-900">{data.ordersToday}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Users size={14} /> Customers
          </p>
          <p className="text-2xl font-bold text-gray-900">{data.totalCustomers}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Package size={14} /> Products · active vendors
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {data.totalProducts} · {data.activeVendors}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Last 7 days</h2>
          {(data.lastSevenDays || []).length === 0 ? (
            <p className="text-sm text-gray-500">No paid orders in the last week.</p>
          ) : (
            <div className="space-y-3">
              {data.lastSevenDays.map((day) => {
                const pct = (Number(day.revenue) / maxDailyRevenue) * 100;
                return (
                  <div key={day.date}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(day.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-medium text-gray-900">
                        {day.orderCount} orders · {formatPrice(day.revenue)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Top categories</h2>
          {(data.topCategories || []).length === 0 ? (
            <p className="text-sm text-gray-500">No category sales yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-2 font-semibold">Category</th>
                    <th className="pb-2 font-semibold">Units</th>
                    <th className="pb-2 font-semibold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCategories.map((row) => (
                    <tr key={row.category} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium text-gray-900">
                        {row.category}
                      </td>
                      <td className="py-2.5 text-gray-600">{row.unitsSold}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">
                        {formatPrice(row.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
