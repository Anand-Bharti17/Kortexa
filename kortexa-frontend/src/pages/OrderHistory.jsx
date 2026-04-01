import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Package, Calendar, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import api from "../services/api";

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

  const toggleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <div className="animate-pulse text-gray-400">Loading order history...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
        <p className="text-gray-600">You haven't placed any orders yet. Start shopping to see your order history here!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center space-x-3 mb-8">
        <Package size={32} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Order Header */}
            <button
              onClick={() => toggleExpandOrder(order.id)}
              className="w-full px-6 py-4 hover:bg-gray-50 transition flex items-center justify-between"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order #</p>
                    <p className="text-lg font-semibold text-gray-900">{order.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {format(new Date(order.orderDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign size={16} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      ${order.totalAmount}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === "PAID" || order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                {expandedOrder === order.id ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>
            </button>

            {/* Order Items (Expanded View) */}
            {expandedOrder === order.id && (
              <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                <div className="space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                        {item.product?.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product?.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.product?.name}</h4>
                          <p className="text-sm text-gray-600">Category: {item.product?.category}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Unit Price</p>
                          <p className="font-semibold text-gray-900">${item.priceAtPurchase}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Total: ${(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No items in this order</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
