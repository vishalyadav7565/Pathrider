// src/pages/LuxuryRidePage.jsx
import React, { useState } from "react";
import API from "../utils/api";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const LuxuryRidePage = () => {
  const [form, setForm] = useState({
    customer: 1, // replace with logged-in user ID dynamically
    pickup_location: "",
    drop_location: "",
    extra_services: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/rides/luxury-rides/", form);
      Swal.fire("✅ Success", "Luxury ride booked successfully!", "success");
      setForm({ customer: 1, pickup_location: "", drop_location: "", extra_services: "" });
    } catch (err) {
      console.error(err);
      Swal.fire("❌ Error", "Booking failed. Check required fields.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#1c1505] to-[#3b2e0f] text-white px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#1a1208]/80 border border-[#d4af37]/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(212,175,55,0.3)]"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-[#f0d78c]">
          🚘 Luxury Ride Booking
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="pickup_location"
            placeholder="Pickup Location"
            value={form.pickup_location}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            required
          />
          <input
            type="text"
            name="drop_location"
            placeholder="Drop Location"
            value={form.drop_location}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            required
          />
          <textarea
            name="extra_services"
            placeholder="Extra Services (e.g., WiFi, Champagne, Music)"
            value={form.extra_services}
            onChange={handleChange}
            className="w-full p-3 h-24 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            type="submit"
            className="w-full py-3 bg-[#f0d78c] text-black font-semibold rounded-lg"
          >
            Confirm Booking
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default LuxuryRidePage;
