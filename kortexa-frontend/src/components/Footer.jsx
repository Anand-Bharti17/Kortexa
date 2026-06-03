import { Link } from "react-router-dom";
import { BRAND_NAME } from "../config/brand";
import VelunoLogo from "./VelunoLogo";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-lg font-bold text-slate-900"
            >
              <VelunoLogo size="sm" />
              {BRAND_NAME}
            </Link>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              A modern marketplace for fast checkout, trusted vendors, and a
              seamless experience on any device.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-indigo-600 transition">
              Shop
            </Link>
            <Link to="/cart" className="hover:text-indigo-600 transition">
              Cart
            </Link>
            <Link to="/orders" className="hover:text-indigo-600 transition">
              Orders
            </Link>
            <Link to="/login" className="hover:text-indigo-600 transition">
              Sign in
            </Link>
          </div>
        </div>

        <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 sm:text-left">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
