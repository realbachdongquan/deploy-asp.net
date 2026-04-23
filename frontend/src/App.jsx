import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import AccessDenied from './pages/AccessDenied';
import DashboardLayout from './layouts/DashboardLayout';
import MoviesPage from './pages/MoviesPage';
import CinemasPage from './pages/CinemasPage';
import RoomsPage from './pages/RoomsPage';
import SeatsPage from './pages/SeatsPage';
import ShowtimesPage from './pages/ShowtimesPage';
import TicketsPage from './pages/TicketsPage';
import BookingPage from './pages/BookingPage';
import GenresPage from './pages/GenresPage';
import CrewMembersPage from './pages/CrewMembersPage';
import PromotionsPage from './pages/PromotionsPage';
import UsersPage from './pages/UsersPage';
import ConcessionsPage from './pages/ConcessionsPage';
import ReviewsAdminPage from './pages/ReviewsAdminPage';
import MembershipsPage from './pages/MembershipsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import PaymentsPage from './pages/PaymentsPage';
import { authService } from './services/auth';

import MovieBrowse from './pages/MovieBrowse';
import MovieDetail from './pages/MovieDetail';
import TicketSuccess from './pages/TicketSuccess';
import MyTickets from './pages/MyTickets';
import PaymentReturn from './pages/PaymentReturn';
import AdminDashboard from './pages/AdminDashboard';
import AdminScanner from './pages/AdminScanner';
import ProfilePage from './pages/ProfilePage';
import CinemasBrowse from './pages/CinemasBrowse';
import PromotionCenter from './pages/PromotionCenter';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import PublicLayout from './layouts/PublicLayout';

const ProtectedRoute = ({ children, requiredRole }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const user = authService.getUser();
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user || !roles.includes(user.role)) {
      return <Navigate to="/access-denied" />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Public Consumer Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<MovieBrowse />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/cinemas" element={<CinemasBrowse />} />
          <Route path="/ticket-success/:ticketId" element={<ProtectedRoute><TicketSuccess /></ProtectedRoute>} />
          <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/promotions" element={<ProtectedRoute><PromotionCenter /></ProtectedRoute>} />
          <Route path="/booking/:showtimeId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/payment-return" element={<PaymentReturn />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole={['Admin', 'Manager', 'Staff']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="scanner" element={<AdminScanner />} />
          <Route path="cinemas" element={<CinemasPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="seats" element={<SeatsPage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="showtimes" element={<ShowtimesPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="genres" element={<GenresPage />} />
          <Route path="crew" element={<CrewMembersPage />} />
          <Route path="promotions" element={<PromotionsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="concessions" element={<ConcessionsPage />} />
          <Route path="reviews" element={<ReviewsAdminPage />} />
          <Route path="memberships" element={<MembershipsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
