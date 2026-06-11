import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  LogOut,
  Shield,
  History,
  Store,
  Package,
  List,
  PlusSquare,
  BarChart3,
  Menu,
  X,
  Home,
  Heart,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";
import { BRAND_NAME, BRAND_VENDOR, BRAND_ADMIN } from "../config/brand";
import VelunoLogo from "./VelunoLogo";

function NavLink({ to, icon: Icon, children, onClick, badge }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:px-4"
    >
      {Icon && <Icon size={18} className="shrink-0 opacity-70" />}
      <span>{children}</span>
      {badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white lg:ml-0">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Navbar() {
  const { isAuthenticated, logout, userRole } = useAuthStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    useWishlistStore.getState().clearWishlist();
    logout();
    navigate("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  const brandLabel =
    userRole === "VENDOR"
      ? BRAND_VENDOR
      : userRole === "ADMIN"
        ? BRAND_ADMIN
        : BRAND_NAME;

  const homePath =
    userRole === "VENDOR"
      ? "/vendor"
      : userRole === "ADMIN"
        ? "/admin"
        : "/";

  let navLinks = [];
  if (!isAuthenticated) {
    navLinks = [
      { to: "/", icon: Home, label: "Home" },
      { to: "/shop", icon: Package, label: "Shop" },
      { to: "/login", icon: User, label: "Sign in" },
      { to: "/register", icon: User, label: "Create account", highlight: true },
    ];
  } else if (userRole === "CUSTOMER") {
    navLinks = [
      { to: "/", icon: Home, label: "Home" },
      { to: "/shop", icon: Package, label: "Shop" },
      { to: "/wishlist", icon: Heart, label: "Wishlist" },
      { to: "/cart", icon: ShoppingCart, label: "Cart", badge: totalItems },
      { to: "/orders", icon: History, label: "Orders" },
      { to: "/profile", icon: User, label: "Profile" },
    ];
  } else if (userRole === "VENDOR") {
    navLinks = [
      { to: "/vendor", icon: List, label: "My products" },
      { to: "/vendor?tab=add", icon: PlusSquare, label: "Add product" },
      { to: "/vendor?tab=stats", icon: BarChart3, label: "Stats" },
      { to: "/vendor?tab=fulfillment", icon: History, label: "Fulfillment" },
      { to: "/vendor?tab=requests", icon: RotateCcw, label: "Requests" },
      { to: "/vendor?tab=wallet", icon: DollarSign, label: "Wallet" },
      { to: "/profile", icon: User, label: "Profile" },
    ];
  } else if (userRole === "ADMIN") {
    navLinks = [
      { to: "/admin", icon: Shield, label: "Dashboard" },
      { to: "/admin/orders", icon: Package, label: "Orders" },
      { to: "/admin/order-requests", icon: RotateCcw, label: "Requests" },
      { to: "/profile", icon: User, label: "Profile" },
    ];
  }

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to={homePath}
            onClick={closeMobile}
            className="flex min-w-0 items-center gap-2.5"
          >
            <VelunoLogo size="md" />
            <span className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {brandLabel}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) =>
              link.highlight ? (
                <Link
                  key={link.to}
                  to={link.to}
                  className="btn-primary ml-2 !py-2 !text-sm"
                >
                  {link.label}
                </Link>
              ) : (
                <NavLink
                  key={link.to + link.label}
                  to={link.to}
                  icon={link.icon}
                  badge={link.badge}
                >
                  {link.label}
                </NavLink>
              ),
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated && userRole === "CUSTOMER" && totalItems > 0 && (
              <Link
                to="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
              >
                <ShoppingCart size={20} />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) =>
              link.highlight ? (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  className="btn-primary mt-2 w-full justify-center"
                >
                  {link.label}
                </Link>
              ) : (
                <NavLink
                  key={link.to + link.label}
                  to={link.to}
                  icon={link.icon}
                  onClick={closeMobile}
                  badge={link.badge}
                >
                  {link.label}
                </NavLink>
              ),
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
