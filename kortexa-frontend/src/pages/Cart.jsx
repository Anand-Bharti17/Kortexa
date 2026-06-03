import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import useCartStore from "../store/useCartStore";
import api from "../services/api";
import { BRAND_NAME } from "../config/brand";
import { formatPrice } from "../utils/currency";

export default function Cart() {
  const { cartItems, removeFromCart, getTotalPrice, clearCart } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      const response = await api.get("/payments/razorpay/order");
      await openRazorpayWindow(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
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
        </div>

        <div className="h-fit rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <span>Subtotal ({cartItems.length} items)</span>
            <span className="font-medium text-slate-900">
              {formatPrice(getTotalPrice())}
            </span>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-slate-900">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCheckingOut}
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
  );
}
