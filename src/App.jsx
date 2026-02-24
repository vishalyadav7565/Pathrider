import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

/* ================= USER ================= */
import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import UserDashboard from "./Pages/UserDashboard";
import UserBookings from "./components/UserBookings";
import BookingDetail from "./Pages/BookingDetail";

/* ================= DRIVER ================= */
import DriverLogin from "./pages/DriverLogin";
import DriverRegister from "./pages/DriverRegister";

import DriverLayout from "./Pages/driver/DriverLayout";
import DriverDashboard from "./Pages/driver/DriverDashboardPage";
import DriverEarnings from "./Pages/driver/DriverEarnings";
import DriverProfile from "./Pages/driver/DriverProfile";
import DriverRideHistory from "./Pages/driver/DriverRideHistory";
import DriverRequests from "./Pages/driver/DriverRequests";
import DriverSettings from "./Pages/driver/DriverSettings";

/* ================= OTHER ================= */
import ProtectedRoute from "./components/ProtectedRoute";
import RidesPage from "./pages/RideBookingPage";
import EventBookingPage from "./pages/EventBookingPage";
import SubscriptionPage from "./Pages/SubscriptionPage";
import DistanceFareCalculator from "./Pages/DistanceFareCalculator";
import LuxuryRidePage from "./pages/LuxuryRidePage";
import DriverRidePage from "./Pages/driver/DriverRidePage";

function App() {
  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<UserDashboard />} />
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/login/user" element={<UserLogin />} />
        <Route path="/user/register" element={<UserRegister />} />

        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/login/driver" element={<DriverLogin />} />
        <Route path="/register/driver" element={<DriverRegister />} />

        {/* ================= USER ================= */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/bookings"
          element={
            <ProtectedRoute allowedRole="user">
              <UserBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute allowedRole="user">
              <BookingDetail />
            </ProtectedRoute>
          }
        />

        {/* ================= DRIVER (NESTED) ================= */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRole="driver">
              <DriverLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="earnings" element={<DriverEarnings />} />
          <Route path="profile" element={<DriverProfile />} />
          <Route path="ride-history" element={<DriverRideHistory />} />
          <Route path="requests" element={<DriverRequests />} />
          <Route path="settings" element={<DriverSettings />} />
        </Route>

        {/* ================= OTHER ================= */}
        <Route path="/rides" element={<RidesPage />} />
        <Route path="/event-booking" element={<EventBookingPage />} />
        <Route path="/subscriptions" element={<SubscriptionPage />} />
        <Route path="/fare-calculator" element={<DistanceFareCalculator />} />
        <Route path="/luxury-rides" element={<LuxuryRidePage />} />
        <Route path="/driver/ride/:bookingId" element={<DriverRidePage />} />

      </Routes>
    </Router>
  );
}

export default App;
