import React, { useEffect, useState } from "react";
import { LogOut, User, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ServiceCards from "../components/Servies";
import UserBookings from "../components/UserBookings";

import axios from "axios";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState({
    instant_bookings: [],
    luxury_rides: [],
    occasional_bookings: [],
  });
  const [loading, setLoading] = useState(true);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/user/login");
  };

  // ✅ Fetch user bookings
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        console.warn("⚠️ No token found, redirecting...");
        navigate("/user/login");
        return;
      }

      const res = await axios.get("http://3.26.155.202:8000/api/rides/bookings/", {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "Content-Type": "application/json",
        },
      });

      setBookings(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch bookings:", err.response?.data || err.message);

      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/user/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ WebSocket connection (only for drivers)
  useEffect(() => {
    const role = localStorage.getItem("role");
    const driverId = localStorage.getItem("driver_id");

    // Only connect for drivers with a valid ID
    if (role !== "driver" || !driverId) return;

    // Use ws:// for local dev, wss:// for production if needed
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/driver/${driverId}/`);

    ws.onopen = () => {
      console.log(`✅ WebSocket connected for driver ${driverId}`);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("📨 Message received:", data);

        // Optional: show alert or toast for new rides
        if (data.type === "ride_notification") {
          alert(`🚗 New ride assigned: ${data.ride.pickup_location}`);
        }
      } catch (err) {
        console.error("⚠️ Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = (e) => {
      console.warn("❌ WebSocket disconnected", e.reason || "");
    };

    ws.onerror = (e) => {
      console.error("⚠️ WebSocket error:", e);
      ws.close();
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  // ✅ Fetch bookings on load
  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0a06] via-[#1b1207] to-[#0d0a06] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1f1409] via-[#2a1c0e] to-[#1f1409] shadow-[0_0_25px_rgba(212,175,55,0.3)] border-b border-[#d4af37]/40">
        <div className="flex items-center gap-3">
          <User className="text-[#d4af37]" />
          <h1 className="text-2xl font-bold text-[#f0d78c]">Welcome, Vishal</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#f0d78c] border border-[#d4af37]/40 transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </header>

      {/* Hero Section */}
      <div className="relative text-center py-10 px-6">
        <h2 className="text-3xl font-semibold mb-2 text-[#f0d78c]">
          Find Your Perfect Ride
        </h2>
        <p className="text-gray-300 max-w-md mx-auto">
          Choose the ride that fits your style — instant, luxury, or event-based.
        </p>
        <div className="absolute inset-0 -z-10 opacity-10 bg-[url('https://cdn.pixabay.com/photo/2017/01/06/19/15/luxury-1959461_1280.jpg')] bg-cover bg-center blur-sm"></div>
      </div>

      {/* Main Content */}
      <main className="px-6 pb-10 flex-1">
        <h2 className="text-xl font-semibold mb-4 text-[#f0d78c]">
          Available Services
        </h2>
        <ServiceCards />

        <div className="mt-10">
          <UserBookings bookings={bookings} loading={loading} refresh={fetchBookings} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-sm text-gray-400 border-t border-[#d4af37]/20 bg-[#1b1207]/80">
        <div className="flex justify-center gap-2 items-center">
          <MapPin size={14} className="text-[#d4af37]" />
          <span>Powered by DesiRides © 2025</span>
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;
