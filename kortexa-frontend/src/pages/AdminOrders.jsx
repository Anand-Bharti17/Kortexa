import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Store,
  User,
  MapPin,
} from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatPrice } from "../utils/currency";

const PAGE_SIZE = 10;

const statusStyles = {
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      window.location.href = "/";
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/orders", {
        params: { page, size: PAGE_SIZE },
      });
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("Failed to fetch admin orders", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (orderId) => {
    setExpandedOrder((current) => (current === orderId ? null : orderId));
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner label="Loading orders..." />;
  }

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All orders</h1>
        <p className="mt-1 text-gray-600">
          Platform-wide order history with customer and seller details
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Package size={48} className="mx-auto text-gray-300" />
          <p className="mt-4 text-lg text-gray-600">No orders placed yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.orderId;
            const statusClass =
              statusStyles[order.status] || "bg-gray-100 text-gray-700";

            return (
              <div
                key={order.orderId}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(order.orderId)}
                  className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      Order #{order.orderId}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {order.orderDate
                        ? format(new Date(order.orderDate), "MMM d, yyyy · h:mm a")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </div>
                </button>

                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <User size={14} className="text-indigo-600" />
                      <span className="font-medium">Customer:</span>
                      {order.customerName || order.customerEmail}
                      {order.customerName && (
                        <span className="text-gray-500">
                          ({order.customerEmail})
                        </span>
                      )}
                    </span>
                    {order.couponCode && (
                      <span className="text-gray-600">
                        Coupon: <strong>{order.couponCode}</strong>
                        {order.discountAmount > 0 && (
                          <span className="text-emerald-600">
                            {" "}
                            (−{formatPrice(order.discountAmount)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {order.shippingSummary && (
                      <p className="mb-4 flex items-start gap-2 text-sm text-gray-600">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-indigo-600" />
                        <span>
                          <span className="font-medium text-gray-800">
                            Ship to:{" "}
                          </span>
                          {order.shippingSummary}
                        </span>
                      </p>
                    )}

                    <h3 className="mb-3 text-sm font-semibold text-gray-800">
                      Line items
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-left">
                            <th className="px-4 py-2.5 font-semibold text-gray-700">
                              Product
                            </th>
                            <th className="px-4 py-2.5 font-semibold text-gray-700">
                              Seller
                            </th>
                            <th className="px-4 py-2.5 font-semibold text-gray-700">
                              Qty
                            </th>
                            <th className="px-4 py-2.5 font-semibold text-gray-700">
                              Unit price
                            </th>
                            <th className="px-4 py-2.5 font-semibold text-gray-700">
                              Line total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(order.items || []).map((item, idx) => (
                            <tr
                              key={`${order.orderId}-${item.productId}-${idx}`}
                              className="border-b border-gray-100 last:border-0"
                            >
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {item.productName}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Store size={14} className="text-violet-600" />
                                  {item.vendorName || item.vendorEmail || "—"}
                                </span>
                                {item.vendorName && item.vendorEmail && (
                                  <span className="block text-xs text-gray-500">
                                    {item.vendorEmail}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {formatPrice(item.priceAtPurchase)}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {formatPrice(item.lineTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-600">
            Showing page {page + 1} of {totalPages} ({totalElements} orders)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
