import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
} from "lucide-react";
import api from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { formatPrice } from "../utils/currency";

const statusStyles = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const response = await api.get("/orders/history");
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch order history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderHistory();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading orders..." />;
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <Package size={48} className="mx-auto text-slate-300" />
        <h2 className="mt-4 text-2xl font-bold text-slate-900">No orders yet</h2>
        <p className="mt-2 text-slate-500">
          Your order history will appear here after your first purchase.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex">
          <ShoppingBag size={18} />
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="section-title mb-8">Order history</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order.id;
          const statusClass =
            statusStyles[order.status] ||
            "bg-indigo-50 text-indigo-700 border-indigo-200";

          return (
            <div
              key={order.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedOrder(isExpanded ? null : order.id)
                }
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
              >
                <div className="min-w-0 flex-1 space-y-2 sm:space-y-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Order
                      </p>
                      <p className="font-bold text-slate-900">#{order.id}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Calendar size={14} />
                      {format(new Date(order.orderDate), "MMM dd, yyyy")}
                    </div>
                    <p className="font-bold text-slate-900">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="shrink-0 text-slate-400" size={20} />
                ) : (
                  <ChevronDown className="shrink-0 text-slate-400" size={20} />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
                  {order.items?.length > 0 ? (
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 border-b border-slate-200/80 pb-4 last:border-0 last:pb-0"
                        >
                          {item.product?.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product?.name}
                              className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-slate-900">
                              {item.product?.name}
                            </h4>
                            <p className="text-sm text-slate-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-bold text-slate-900">
                              {formatPrice(
                                parseFloat(item.priceAtPurchase) * item.quantity,
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No items in this order</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
