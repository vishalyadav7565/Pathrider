// src/pages/SubscriptionPage.jsx
import React, { useState } from "react";
import API from "../utils/api";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const SubscriptionPage = () => {
  const [form, setForm] = useState({
    user: 1, // replace with logged-in user id dynamically
    plan_name: "Monthly Plan",
    price: 999.0,
    start_date: "",
    end_date: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/rides/subscriptions/", form);
      Swal.fire("✅ Subscribed!", "Your plan is active now.", "success");
      setForm({ user: 1, plan_name: "Monthly Plan", price: 999.0, start_date: "", end_date: "" });
    } catch (err) {
      console.error(err.response?.data);
      Swal.fire("❌ Error", "Failed to subscribe. Please check fields.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0d0a04] to-[#1b1307] text-white px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-[#1a1208]/70 border border-[#d4af37]/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(212,175,55,0.3)]"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-[#f0d78c]">💳 Subscription Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="plan_name"
            value={form.plan_name}
            onChange={handleChange}
            placeholder="Plan Name"
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            required
          />
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            required
          />
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            required
          />
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white"
            required
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            type="submit"
            className="w-full py-3 bg-[#f0d78c] text-black font-semibold rounded-lg"
          >
            Activate Subscription
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default SubscriptionPage;
