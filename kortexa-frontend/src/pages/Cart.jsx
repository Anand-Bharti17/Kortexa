import { useState } from 'react'; // <-- Add this
import { Link, useNavigate } from 'react-router-dom'; // <-- Add useNavigate
import { Trash2 } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import api from '../services/api'; // <-- Import your Axios instance

export default function Cart() {
  const { cartItems, removeFromCart, getTotalPrice, clearCart } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.body.appendChild(script);
  });

  const openRazorpayWindow = async (razorpayOrder) => {
    await loadRazorpayScript();

    const options = {
      key: razorpayOrder.key,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Kortexa',
      description: 'Complete your purchase via Razorpay',
      handler: async function (response) {
        try {
          await api.post('/orders/checkout/razorpay', {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });

          clearCart();
          navigate('/order-success');
        } catch (error) {
          setError(error.response?.data?.message || error.message || 'Payment confirmation failed.');
        }
      },
      prefill: {
        email: localStorage.getItem('kortexa_email') || '',
      },
      theme: {
        color: '#2563eb',
      },
      ...(razorpayOrder.orderId ? { order_id: razorpayOrder.orderId } : {}),
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      setError(response.error.description || 'Payment failed.');
    });
    razorpay.open();
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setError('');

    try {
      if (cartItems.length === 0) {
        throw new Error('Your cart is empty. Add items before checkout.');
      }

      const response = await api.get('/payments/razorpay/order');
      await openRazorpayWindow(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Your Cart is Empty
        </h2>
        <p className="text-gray-500 mb-8">
          Looks like you haven't added anything to your cart yet.
        </p>
        <Link
          to="/"
          className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/100"}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {item.name}
                  </h3>
                  <p className="text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-xl font-bold text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 transition p-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 space-y-4">
          {error && (
            <div className="text-red-500 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{getTotalPrice().toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`px-8 py-3 rounded-lg transition font-bold shadow-md text-white ${isCheckingOut ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isCheckingOut ? 'Processing Payment...' : 'Pay with Razorpay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
