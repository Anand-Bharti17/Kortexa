import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastProvider } from "./components/ui/Toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrderSuccess from "./pages/OrderSuccess";
import OrderHistory from "./pages/OrderHistory";
import Cart from "./pages/Cart";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="flex min-h-screen flex-col bg-slate-50">
          <Navbar />
          <main className="container mx-auto flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/vendor" element={<VendorDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
