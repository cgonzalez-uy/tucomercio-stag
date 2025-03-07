import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { isSuperAdmin } from './lib/auth';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';
import { BusinessPortal } from './pages/BusinessPortal';
import { BusinessLogin } from './pages/BusinessLogin';
import { BusinessPortalSetup } from './pages/BusinessPortalSetup';
import { FavoritesPage } from './pages/FavoritesPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UserReviewsPage } from './pages/UserReviewsPage';
import { UserSettingsPage } from './pages/UserSettingsPage';
import { UserNotificationsPage } from './pages/UserNotificationsPage';
import { UserCouponsPage } from './pages/UserCouponsPage';
import { UserBusesPage } from './pages/UserBusesPage';
import { UserEventsPage } from './pages/UserEventsPage';
import { HelpPage } from './pages/HelpPage';
import { UserLoginPage } from './pages/UserLoginPage';
import { BusSchedulesPage } from './pages/bus/BusSchedulesPage';
import { PointsOfInterestPage } from './pages/PointsOfInterestPage';
import { PlansPage } from './pages/PlansPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';


function App() {
  const [user] = useAuthState(auth);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/comercios/:id" element={<BusinessDetailPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/profile" element={<UserProfilePage />} />
      <Route path="/reviews" element={<UserReviewsPage />} />
      <Route path="/coupons" element={<UserCouponsPage />} />
      <Route path="/buses" element={<UserBusesPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailsPage />} />
      <Route path="/my-events" element={<UserEventsPage />} />
      <Route path="/settings" element={<UserSettingsPage />} />
      <Route path="/notifications" element={<UserNotificationsPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/user/login" element={<UserLoginPage />} />
      <Route path="/schedules" element={<BusSchedulesPage />} />
      <Route path="/points-of-interest" element={<PointsOfInterestPage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route
        path="/login"
        element={
          user && isSuperAdmin(user) ? (
            <Navigate to="/superadmin" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/superadmin/*"
        element={
          user && isSuperAdmin(user) ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/portal/login" element={<BusinessLogin />} />
      <Route path="/portal/*" element={<BusinessPortal />} />
      <Route
        path="/superadmin/businesses/:id/portal-setup"
        element={
          user && isSuperAdmin(user) ? (
            <BusinessPortalSetup />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;