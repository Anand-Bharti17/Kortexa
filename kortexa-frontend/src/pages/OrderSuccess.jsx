import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <CheckCircle size={80} className="text-green-500 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Order Confirmed!
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        Thank you for your purchase. Your order has been placed successfully and
        we are processing it now. You will receive an email confirmation
        shortly.
      </p>
      <Link
        to="/"
        className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition shadow-md font-semibold"
      >
        Return to Store
      </Link>
    </div>
  );
}
