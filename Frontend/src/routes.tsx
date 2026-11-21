import { Routes, Route, Navigate } from 'react-router';
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Customer Application Pages
import Home from './pages/Home';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import TripPlanner from './pages/TripPlanner';
import RoadsideAssistance from './pages/RoadsideAssistance';

// Administrator Application Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CarManagement from './pages/admin/CarManagement';
import BookingManagement from './pages/admin/BookingManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import KYCManagement from './pages/admin/KYCManagement';
import RevenueReports from './pages/admin/RevenueReports';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Customer Web Experience */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="cars" element={<Cars />} />
        <Route path="cars/:id" element={<CarDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="profile" element={<Profile />} />
        <Route path="trip-planner" element={<TripPlanner />} />
        <Route path="roadside" element={<RoadsideAssistance />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      {/* Administrator Authentication Portal (Standalone) */}
      <Route path="admin/login" element={<AdminLogin />} />

      {/* Administrator Console Experience (Protected) */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="cars" element={<CarManagement />} />
        <Route path="bookings" element={<BookingManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="kyc" element={<KYCManagement />} />
        <Route path="revenue" element={<RevenueReports />} />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
