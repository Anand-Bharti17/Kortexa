import { Link } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";

export default function OrderSuccess() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 size={48} strokeWidth={2} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Order confirmed!
      </h1>
      <p className="mt-4 max-w-md text-slate-600">
        Thank you for your purchase. We&apos;re processing your order and you
        should receive a confirmation email shortly.
      </p>
      <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/orders" className="btn-primary">
          <Package size={18} />
          View orders
        </Link>
        <Link to="/" className="btn-secondary">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
