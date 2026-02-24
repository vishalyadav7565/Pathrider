import React, { useState } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import API from "../utils/api";

// 📍 Haversine formula to calculate distance
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const EventBookingPage = () => {
  const [formData, setFormData] = useState({
    event_name: "",
    pickup_location: "",
    drop_location: "",
    scheduled_time: "",
    vehicle_type: "sedan",
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);

  const pricePerKm = {
    sedan: 12,
    suv: 16,
    luxury: 25,
    bus: 30,
    traveller: 20,
  };

  // Get latitude/longitude from OpenStreetMap
  const getCoords = async (address) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    return data.length ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
  };

  // Calculate distance & fare automatically when locations change
  const calculateFare = async () => {
    if (!formData.pickup_location || !formData.drop_location) return;

    const pickup = await getCoords(formData.pickup_location);
    const drop = await getCoords(formData.drop_location);

    if (pickup && drop) {
      const dist = getDistance(pickup.lat, pickup.lon, drop.lat, drop.lon);
      const cost = dist * pricePerKm[formData.vehicle_type];
      setDistance(dist.toFixed(2));
      setFare(cost.toFixed(2));
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "pickup_location" || name === "drop_location" || name === "vehicle_type") {
      setTimeout(() => calculateFare(), 500);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token"); // if you’re using authentication

await API.post("/rides/occasional-bookings/", {
  event_name: formData.event_name,
  pickup_location: formData.pickup_location,
  drop_location: formData.drop_location,
  scheduled_time: formData.scheduled_time,
}, {
  headers: {
    Authorization: token ? `Bearer ${token}` : "",
  },
});

    Swal.fire("✅ Success", "Your event booking has been submitted!", "success");
    setFormData({
      event_name: "",
      pickup_location: "",
      drop_location: "",
      scheduled_time: "",
      vehicle_type: "sedan",
      quantity: 1,
    });
    setDistance(null);
    setFare(null);
  } catch (error) {
    console.error("Booking error:", error.response?.data || error.message);
    Swal.fire("❌ Error", "Failed to book event. Please try again.", "error");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0d0a04] to-[#1b1307] text-white px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#1a1208]/70 border border-[#d4af37]/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(212,175,55,0.3)]"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-[#f0d78c]">
          🎉 Event Booking
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="event_name"
            value={formData.event_name}
            onChange={handleChange}
            placeholder="Event Name (e.g. Wedding)"
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 placeholder-gray-400 text-white"
            required
          />
          <input
            type="text"
            name="pickup_location"
            value={formData.pickup_location}
            onChange={handleChange}
            placeholder="Pickup Location"
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 placeholder-gray-400 text-white"
            required
          />
          <input
            type="text"
            name="drop_location"
            value={formData.drop_location}
            onChange={handleChange}
            placeholder="Drop Location"
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 placeholder-gray-400 text-white"
            required
          />
          <input
            type="datetime-local"
            name="scheduled_time"
            value={formData.scheduled_time}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            required
          />
          <div className="flex gap-3">
            <select
              name="vehicle_type"
              value={formData.vehicle_type}
              onChange={handleChange}
              className="w-1/2 p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            >
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="bus">Bus</option>
              <option value="traveller">Traveller</option>
            </select>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="w-1/2 p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            />
          </div>

          {/* 🚗 Show calculated distance & fare */}
          {distance && (
            <div className="text-center mt-4 space-y-1">
              <p>📏 Distance: <span className="text-[#f0d78c]">{distance} km</span></p>
              <p>💰 Estimated Fare: <span className="text-[#f0d78c]">₹{fare}</span></p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#d4af37" }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#f0d78c] text-black font-semibold rounded-lg transition"
          >
            {loading ? "Booking..." : "Book Event"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default EventBookingPage;
