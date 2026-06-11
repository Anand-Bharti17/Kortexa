import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight, MapPin, Tag } from "lucide-react";
import useCartStore from "../store/useCartStore";
import api from "../services/api";
import { BRAND_NAME } from "../config/brand";
import { formatPrice } from "../utils/currency";
import AiCartAssistant from "../components/AiCartAssistant";

export default function Cart() {
  const { cartItems, removeFromCart, getTotalPrice, clearCart } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [cartSummary, setCartSummary] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (cartItems.length > 0) {
      loadCheckoutData();
    }
  }, [cartItems.length]);

  const loadCheckoutData = async () => {
    try {
      const [addressRes, summaryRes] = await Promise.all([
        api.get("/addresses").catch(() => ({ data: [] })),
        api.get("/cart/summary"),
      ]);
      setAddresses(addressRes.data || []);
      setCartSummary(summaryRes.data);
      if (summaryRes.data?.selectedAddressId) {
        setSelectedAddressId(summaryRes.data.selectedAddressId);
      } else {
        const defaultAddr = (addressRes.data || []).find(
          (a) => a.default || a.isDefault,
        );
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          await api.put(`/cart/shipping-address/${defaultAddr.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to load checkout data", err);
    }
  };

  const handleSelectAddress = async (addressId) => {
    try {
      const { data } = await api.put(`/cart/shipping-address/${addressId}`);
      setSelectedAddressId(addressId);
      setCartSummary(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to select address");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setError("");
    try {
      const { data } = await api.post("/cart/coupon", { code: couponCode.trim() });
      setCartSummary(data);
      setCouponCode("");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const { data } = await api.delete("/cart/coupon");
      setCartSummary(data);
    } catch (err) {
      console.error("Failed to remove coupon", err);
    }
  };

  const subtotal = cartSummary?.subtotal ?? getTotalPrice();
  const discount = cartSummary?.discountAmount ?? 0;
  const total = cartSummary?.total ?? getTotalPrice();

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () =>
        reject(new Error("Failed to load Razorpay checkout script."));
      document.body.appendChild(script);
    });

  const openRazorpayWindow = async (razorpayOrder) => {
    await loadRazorpayScript();

    const options = {
      key: razorpayOrder.key,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: BRAND_NAME,
      description: "Complete your purchase via Razorpay",
      handler: async function (response) {
        try {
          await api.post("/orders/checkout/razorpay", {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          clearCart();
          navigate("/order-success");
        } catch (err) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              err.message ||
              "Payment confirmation failed.",
          );
        }
      },
      prefill: {
        email: localStorage.getItem("kortexa_email") || "",
      },
      theme: { color: "#4f46e5" },
      ...(razorpayOrder.orderId ? { order_id: razorpayOrder.orderId } : {}),
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", function (response) {
      setError(response.error.description || "Payment failed.");
    });
    razorpay.open();
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setError("");
    try {
      if (cartItems.length === 0) {
        throw new Error("Your cart is empty. Add items before checkout.");
      }
      if (!selectedAddressId) {
        throw new Error("Please select a shipping address before checkout.");
      }
      const response = await api.get("/payments/razorpay/order");
      await openRazorpayWindow(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Checkout failed. Please try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-slate-500">
          Explore our catalog and add something you like.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex">
          Continue shopping
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="section-title mb-8">Shopping cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:items-center sm:p-5"
            >
              <img
                src={item.imageUrl || "https://via.placeholder.com/100"}
                alt={item.name}
                className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 line-clamp-2">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Qty: {item.quantity}
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900 sm:hidden">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between gap-2 sm:gap-4">
                <span className="hidden text-lg font-bold text-slate-900 sm:block">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
                  aria-label="Remove item"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <MapPin size={18} className="text-indigo-600" />
              Shipping address
            </h3>
            {addresses.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                No saved addresses.{" "}
                <Link to="/profile" className="font-medium text-indigo-600 hover:text-indigo-700">
                  Add one in your profile
                </Link>{" "}
                before checkout.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                      selectedAddressId === addr.id
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => handleSelectAddress(addr.id)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">
                        {addr.fullName}
                        {addr.label ? ` · ${addr.label}` : ""}
                      </p>
                      <p className="text-slate-600">
                        {addr.line1}, {addr.city} {addr.postalCode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="h-fit space-y-4 lg:sticky lg:top-24">
          <AiCartAssistant />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
            <div className="mt-4 flex justify-between text-sm text-slate-600">
              <span>Subtotal ({cartItems.length} items)</span>
              <span className="font-medium text-slate-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            {discount > 0 && (
              <div className="mt-2 flex justify-between text-sm text-emerald-600">
                <span>Discount ({cartSummary?.couponCode})</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Tag size={16} className="text-indigo-600" />
                Promo code
              </label>
              {cartSummary?.couponCode ? (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                  <span className="font-medium text-emerald-700">
                    {cartSummary.couponCode} applied
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 underline hover:text-emerald-800"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="input-field flex-1 !py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {applyingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut || !selectedAddressId}
              className="btn-primary mt-6 w-full !py-3.5"
            >
              {isCheckingOut ? "Processing..." : "Pay with Razorpay (INR)"}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              Checkout amount matches cart total in Indian Rupees (₹).
            </p>
            <Link
              to="/"
              className="mt-3 block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
