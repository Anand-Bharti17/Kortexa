import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  PackagePlus,
  UploadCloud,
  Edit2,
  BarChart3,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  Wallet,
  RotateCcw,
} from "lucide-react";
import OrderStatusTimeline from "../components/OrderStatusTimeline";
import OrderRequestResolvePanel from "../components/OrderRequestResolvePanel";
import api from "../services/api";
import { formatPrice } from "../utils/currency";

export default function VendorDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "products";
  // Form state for creating new products
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [featured, setFeatured] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Products list state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStockQuantity, setEditStockQuantity] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [fulfillmentOrders, setFulfillmentOrders] = useState([]);
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false);
  const [settlement, setSettlement] = useState(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [orderRequests, setOrderRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);


  const categories = [
    "Electronics",
    "Clothing & Apparel",
    "Home & Garden",
    "Sports & Outdoors",
    "Books & Media",
    "Beauty & Personal Care",
    "Toys & Games",
    "Food & Beverages",
    "Health & Wellness",
    "Other",
  ];

  // Fetch vendor's products & stats
  useEffect(() => {
    fetchMyProducts();
    if (tab === "stats") {
      fetchStats();
    } else if (tab === "fulfillment") {
      fetchFulfillment();
    } else if (tab === "wallet") {
      fetchSettlement();
    } else if (tab === "requests") {
      fetchOrderRequests();
    }
  }, [tab]);

  const fetchOrderRequests = async () => {
    try {
      setRequestsLoading(true);
      const { data } = await api.get("/orders/vendor/requests");
      setOrderRequests(data || []);
    } catch (error) {
      console.error("Failed to fetch order requests", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get("/orders/vendor/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFulfillment = async () => {
    try {
      setFulfillmentLoading(true);
      const { data } = await api.get("/orders/vendor/fulfillment");
      setFulfillmentOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch fulfillment orders", error);
    } finally {
      setFulfillmentLoading(false);
    }
  };

  const fetchSettlement = async () => {
    try {
      setSettlementLoading(true);
      const [settlementRes, payoutsRes] = await Promise.all([
        api.get("/vendor/settlement"),
        api.get("/vendor/payout-requests").catch(() => ({ data: [] })),
      ]);
      setSettlement(settlementRes.data);
      setPayoutRequests(payoutsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch settlement", error);
    } finally {
      setSettlementLoading(false);
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < 1) {
      setMessage({ type: "error", text: "Enter a valid withdrawal amount." });
      return;
    }
    setPayoutSubmitting(true);
    try {
      await api.post("/vendor/payout-requests", {
        amount,
        paymentNote: payoutNote.trim() || null,
      });
      setMessage({ type: "success", text: "Payout request submitted for admin review." });
      setPayoutAmount("");
      setPayoutNote("");
      fetchSettlement();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to submit payout request.",
      });
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    setStatusUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setMessage({ type: "success", text: `Order #${orderId} marked as ${status}` });
      fetchFulfillment();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not update order status",
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const fetchMyProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await api.get("/products/my-store");
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleEditFileChange = (e) => {
    if (e.target.files[0]) {
      setEditImageFile(e.target.files[0]);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const formData = new FormData();
    const productData = {
      name: name,
      category: category,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10),
      featured,
    };

    formData.append(
      "product",
      new Blob([JSON.stringify(productData)], { type: "application/json" }),
    );

    if (imageFile) {
      formData.append("file", imageFile);
    }

    try {
      await api.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({
        type: "success",
        text: "Product created successfully!",
      });

      setName("");
      setCategory("");
      setPrice("");
      setStockQuantity("");
      setFeatured(false);
      setImageFile(null);

      // Refresh products list
      fetchMyProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create product.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditCategory(product.category);
    setEditPrice(product.price.toString());
    setEditStockQuantity(product.stockQuantity.toString());
    setEditFeatured(Boolean(product.featured));
    setEditImageFile(null);
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    const formData = new FormData();
    const productData = {
      name: editName,
      category: editCategory,
      price: parseFloat(editPrice),
      stockQuantity: parseInt(editStockQuantity, 10),
      description: editingProduct.description,
      featured: editFeatured,
    };

    formData.append(
      "product",
      new Blob([JSON.stringify(productData)], { type: "application/json" }),
    );

    if (editImageFile) {
      formData.append("file", editImageFile);
    }

    try {
      await api.put(`/products/${editingProduct.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({
        type: "success",
        text: "Product updated successfully!",
      });

      setEditingProduct(null);
      fetchMyProducts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update product.",
      });
    } finally {
      setEditLoading(false);
    }
  };



  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center space-x-3 mb-8">
        <PackagePlus size={32} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Vendor Portal</h1>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg font-semibold ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8`}>
        {/* Conditionally show Add Product, Products List, or Stats based on tab */}
        {tab === "wallet" ? (
          <div className="lg:col-span-3 space-y-6">
            {settlementLoading ? (
              <div className="p-12 text-center text-gray-400">Loading wallet...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex items-center space-x-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="rounded-lg bg-violet-100 p-4 text-violet-600">
                      <Wallet size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Wallet balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPrice(settlement?.walletBalance || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="rounded-lg bg-amber-100 p-4 text-amber-600">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Platform commission</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {settlement?.platformCommissionRate != null
                          ? `${(Number(settlement.platformCommissionRate) * 100).toFixed(0)}%`
                          : "10%"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800">Request withdrawal</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Submit a payout request. Admin will approve and transfer funds offline.
                  </p>
                  <form onSubmit={handlePayoutRequest} className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-gray-700">Amount (₹)</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-gray-700">
                        UPI / bank note (optional)
                      </span>
                      <input
                        type="text"
                        value={payoutNote}
                        onChange={(e) => setPayoutNote(e.target.value)}
                        placeholder="UPI ID or account details"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900"
                      />
                    </label>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={payoutSubmitting}
                        className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        {payoutSubmitting ? "Submitting..." : "Request payout"}
                      </button>
                    </div>
                  </form>
                  {payoutRequests.length > 0 && (
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold text-gray-800">Your payout requests</h3>
                      <ul className="mt-2 space-y-2">
                        {payoutRequests.map((p) => (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{formatPrice(p.amount)}</span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              {p.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800">Recent ledger</h2>
                  </div>
                  {!settlement?.recentTransactions?.length ? (
                    <p className="p-12 text-center text-gray-500">No transactions yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                          <tr>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {settlement.recentTransactions.map((entry) => (
                            <tr key={entry.id}>
                              <td className="px-6 py-4 font-medium">{entry.transactionType}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {entry.description || entry.referenceId || "—"}
                              </td>
                              <td className="px-6 py-4 text-right font-bold">
                                {formatPrice(entry.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : tab === "requests" ? (
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-800">
                <RotateCcw size={22} className="text-violet-600" />
                Cancel & return requests
              </h2>
              {requestsLoading ? (
                <div className="py-12 text-center text-gray-400">Loading requests...</div>
              ) : orderRequests.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No pending requests for your products.
                </div>
              ) : (
                <div className="space-y-4">
                  {orderRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-gray-900">
                          {req.requestType} · Order #{req.orderId}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          {req.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        Customer: {req.customerEmail}
                      </p>
                      <OrderRequestResolvePanel
                        request={req}
                        onResolved={fetchOrderRequests}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : tab === "fulfillment" ? (
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-800">
                <Truck size={22} className="text-blue-600" />
                Order fulfillment
              </h2>
              {fulfillmentLoading ? (
                <div className="py-12 text-center text-gray-400">Loading orders...</div>
              ) : fulfillmentOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No paid orders to fulfill yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {fulfillmentOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">Order #{order.orderId}</p>
                          <p className="text-sm text-gray-500">{order.customerEmail}</p>
                          <p className="text-sm font-semibold text-gray-800">
                            Your items: {formatPrice(order.vendorSubtotal)}
                          </p>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                          {order.status}
                        </span>
                      </div>
                      <OrderStatusTimeline status={order.status} />
                      <ul className="mt-4 space-y-1 text-sm text-gray-700">
                        {order.lines?.map((line) => (
                          <li key={line.orderItemId}>
                            {line.productName} × {line.quantity}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex gap-2">
                        {order.status === "PAID" && (
                          <button
                            type="button"
                            disabled={statusUpdating === order.orderId}
                            onClick={() => handleStatusUpdate(order.orderId, "SHIPPED")}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Mark shipped
                          </button>
                        )}
                        {order.status === "SHIPPED" && (
                          <button
                            type="button"
                            disabled={statusUpdating === order.orderId}
                            onClick={() => handleStatusUpdate(order.orderId, "DELIVERED")}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Mark delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : tab === "stats" ? (
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-4 bg-green-100 rounded-lg text-green-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <div className="p-4 bg-blue-100 rounded-lg text-blue-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Total Items Sold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalItemsSold || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Itemized Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                  <BarChart3 size={20} className="text-blue-600" />
                  <span>Product Performance</span>
                </h2>
              </div>
              
              {statsLoading ? (
                <div className="p-12 text-center text-gray-400">Loading performance data...</div>
              ) : !stats || stats.itemizedPerformance.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>No sales data available yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4 text-center">Units Sold</th>
                        <th className="px-6 py-4 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.itemizedPerformance.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.productName}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{item.quantitySold}</td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            {formatPrice(item.totalRevenue || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : tab === "add" ? (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Add New Product
              </h2>

              <form onSubmit={handleCreateProduct} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Wireless Keyboard"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Select --</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition bg-gray-50">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 px-1"
                        >
                          <span>Upload</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                            accept="image/*"
                            required
                          />
                        </label>
                      </div>
                      {imageFile && (
                        <p className="text-sm font-bold text-green-600 mt-2">
                          {imageFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-800">
                    <span className="font-semibold">Feature on homepage</span>
                    <span className="mt-0.5 block text-gray-500">
                      Show this product in the Featured section for shoppers
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-bold py-3 rounded-lg transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {loading ? "Creating..." : "Create Product"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Your Products ({products.length})
              </h2>

              {productsLoading ? (
                <div className="text-center py-12 text-gray-400">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>No products yet. Create your first product to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition bg-gray-50 group relative"
                    >
                      <div className="aspect-square w-full mb-4 overflow-hidden rounded-lg">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Package className="text-gray-400" size={32} />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-900 truncate pr-8">
                            {product.name}
                          </h3>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg shadow-sm transition opacity-0 group-hover:opacity-100"
                            title="Edit product"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 uppercase tracking-tighter font-semibold">
                          {product.category}
                          {product.featured && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 normal-case">
                              Featured
                            </span>
                          )}
                        </p>
                        <div className="flex items-center justify-between mt-4 bg-white p-2 rounded-lg border border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Price</p>
                            <p className="font-bold text-gray-900">{formatPrice(product.price)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Stock</p>
                            <p className={`font-bold ${product.stockQuantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>
                              {product.stockQuantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Product
            </h2>

            <form onSubmit={handleSaveEditProduct} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Select --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={editStockQuantity}
                    onChange={(e) => setEditStockQuantity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={editFeatured}
                  onChange={(e) => setEditFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-800">
                  <span className="font-semibold">Feature on homepage</span>
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Image (Optional)
                </label>
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition bg-gray-50">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="edit-file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 px-2 py-1"
                      >
                        <span>Upload a new image</span>
                        <input
                          id="edit-file-upload"
                          name="edit-file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleEditFileChange}
                          accept="image/*"
                        />
                      </label>
                    </div>
                    {editImageFile && (
                      <p className="text-sm font-bold text-green-600 mt-2">
                        Selected: {editImageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="submit"
                  disabled={editLoading}
                  className={`flex-1 text-white font-bold py-3 rounded-lg transition ${
                    editLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 text-gray-900 font-bold py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
