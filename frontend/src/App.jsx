import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
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

const ProtectedRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/movies" replace />} />
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
          <Route path="booking/:showtimeId" element={<BookingPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
