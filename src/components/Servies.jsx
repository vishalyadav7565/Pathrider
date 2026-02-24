import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      title: "Instant Ride",
      desc: "Book instant rides for your daily travel needs.",
      path: "/rides",
      img: "https://cdn-icons-png.flaticon.com/512/3202/3202926.png",
    },
    {
      title: "Luxury Ride",
      desc: "Travel in style with our premium luxury cars.",
      path: "/luxury-rides",
      img: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
    },
    {
      title: "Event Booking",
      desc: "Perfect rides for weddings, parties, or big events.",
      path: "/event-booking",
      img: "https://cdn-icons-png.flaticon.com/512/1865/1865274.png",
    },
    {
      title: "Subscription Plan",
      desc: "Weekly or monthly ride plans for regular users.",
      path: "/subscriptions",
      img: "https://cdn-icons-png.flaticon.com/512/2331/2331948.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0d0a04] to-[#1b1307] text-white px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#f0d78c] to-[#d4af37] bg-clip-text text-transparent drop-shadow-lg">
        Our Premium Services
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {services.map((item, i) => (
          <motion.div
            key={i}
            onClick={() => navigate(item.path)}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 40px rgba(212,175,55,0.8)",
              y: -5,
            }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-br from-[#2b1d0f] to-[#1a1208] rounded-2xl border border-[#d4af37]/40 p-6 cursor-pointer text-center transition-all duration-300 select-none"
          >
            <div className="flex justify-center mb-4">
              <img
                src={item.img}
                alt={item.title}
                className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(240,215,140,0.6)]"
              />
            </div>
            <h2 className="text-xl font-semibold text-[#f0d78c]">
              {item.title}
            </h2>
            <p className="text-gray-400 mt-3 text-sm leading-relaxed">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Services;
