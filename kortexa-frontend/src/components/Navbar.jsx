import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, PackagePlus, Shield, History, Store, Package, List, PlusSquare, BarChart3, ShoppingBag } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";

export default function Navbar() {
  const { isAuthenticated, logout, userRole } = useAuthStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ==================== VENDOR NAVBAR ====================
  if (isAuthenticated && userRole === "VENDOR") {
    return (
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/vendor" className="flex items-center space-x-2">
            <Store size={32} className="text-blue-300" />
            <span className="text-2xl font-bold tracking-wider">KORTEXA VENDOR</span>
          </Link>

          {/* Middle Navigation */}
          <div className="flex items-center space-x-6">
            <Link
              to="/vendor"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-800 transition font-semibold"
            >
              <List size={20} className="text-blue-200" />
              <span>My Products</span>
            </Link>

            <Link
              to="/vendor?tab=add"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-800 transition font-semibold"
            >
              <PlusSquare size={20} className="text-green-400" />
              <span>Add New Product</span>
            </Link>

            <Link
              to="/vendor?tab=stats"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-blue-800 transition font-semibold"
            >
              <BarChart3 size={20} className="text-yellow-400" />
              <span>Orders Stats</span>
            </Link>
          </div>

          {/* Right end */}
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 bg-opacity-30 hover:bg-opacity-50 transition font-semibold"
            >
              <User size={20} />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition font-semibold"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // ==================== CUSTOMER NAVBAR ====================
  if (isAuthenticated && userRole === "CUSTOMER") {
    return (
      <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 shadow-lg sticky top-0 z-50 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <ShoppingCart size={32} className="text-yellow-400" />
            <span className="text-2xl font-bold tracking-wider">KORTEXA</span>
          </Link>

          {/* Middle Navigation */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              <Package size={20} className="text-blue-400" />
              <span>Products</span>
            </Link>

            <Link
              to="/cart"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold relative"
            >
              <ShoppingCart size={20} className="text-yellow-400" />
              <span>My Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center text-white border-2 border-gray-900">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link
              to="/orders"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
            >
              <History size={20} className="text-purple-400" />
              <span>My History</span>
            </Link>
          </div>

          {/* Right end */}
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 bg-opacity-30 hover:bg-opacity-50 transition font-semibold"
            >
              <User size={20} />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition font-semibold"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // ==================== ADMIN NAVBAR ====================
  if (isAuthenticated && userRole === "ADMIN") {
    return (
      <nav className="bg-green-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/admin" className="flex items-center space-x-2">
            <Shield size={32} className="text-green-300" />
            <span className="text-2xl font-bold tracking-wider">KORTEXA ADMIN</span>
          </Link>

          <div className="flex items-center space-x-6">
            {/* Admin Dashboard */}
            <Link
              to="/admin"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-800 hover:bg-green-700 transition font-semibold"
            >
              <Shield size={20} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-800 hover:bg-green-700 transition font-semibold"
            >
              <User size={20} />
              <span>Profile</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition font-semibold"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // ==================== GUEST/UNAUTHENTICATED NAVBAR ====================
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <ShoppingCart size={32} className="text-yellow-400" />
          <span className="text-2xl font-bold tracking-wider">KORTEXA</span>
        </Link>

        <div className="flex items-center space-x-6">
          {/* Shop Link */}
          <Link
            to="/"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition font-semibold"
          >
            <ShoppingCart size={20} />
            <span>Shop</span>
          </Link>

          {/* Login */}
          <Link
            to="/login"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-semibold"
          >
            <User size={20} />
            <span>Login</span>
          </Link>

          {/* Register */}
          <Link
            to="/register"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition font-semibold"
          >
            <User size={20} />
            <span>Register</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
