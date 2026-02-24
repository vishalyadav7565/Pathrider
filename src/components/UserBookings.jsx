import React, { useEffect, useState } from "react";
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  accepted: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  ongoing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  completed: "bg-green-500/20 text-green-400 border-green-500/40",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/40",
};

const UserBookings = ({ bookings, loading }) => {
  const navigate = useNavigate();

  const [localBookings, setLocalBookings] = useState({
    instant_bookings: [],
    luxury_rides: [],
    occasional_bookings: [],
  });
useEffect(() => {
  if (!bookings) return;

  // Case 1: API returns ARRAY (current backend)
  if (Array.isArray(bookings)) {
    setLocalBookings({
      instant_bookings: bookings.filter(
        b => b.booking_type === "instant" || b.vehicle_type === "sedan"
      ),
      luxury_rides: bookings.filter(
        b => b.vehicle_type === "luxury"
      ),
      occasional_bookings: bookings.filter(
        b => b.booking_type === "occasion"
      ),
    });
  }

  // Case 2: API already grouped (future-proof)
  else {
    setLocalBookings({
      instant_bookings: bookings.instant_bookings || [],
      luxury_rides: bookings.luxury_rides || [],
      occasional_bookings: bookings.occasional_bookings || [],
    });
  }
}, [bookings]);

 

  const BookingCard = ({ booking, type }) => {
    const statusClass =
      statusColors[booking.status] ||
      "bg-gray-700/20 text-gray-400 border-gray-600/40";

    return (
      <div
        onClick={() => navigate(`/booking/${booking.id}`)}
        className="bg-[#1a1208] rounded-2xl p-4
                   border border-[#d4af37]/20
                   hover:border-[#d4af37]/60
                   hover:shadow-xl
                   transition-all cursor-pointer"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-[#f0d78c] font-semibold">
            <Car size={18} />
            {type}
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full border ${statusClass}`}
          >
            {booking.status?.toUpperCase()}
          </span>
        </div>

        {/* ROUTE */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <MapPin size={14} />
            <span className="line-clamp-1">
              {booking.pickup_location_text ||
                booking.pickup_location ||
                "Pickup"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-red-400">
            <ArrowRight size={14} />
            <span className="line-clamp-1">
              {booking.drop_location_text ||
                booking.drop_location ||
                "Drop"}
            </span>
          </div>
        </div>

        {/* INFO STRIP */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <div className="flex items-center gap-1 text-[#f0d78c] font-bold">
            <IndianRupee size={14} />
            {booking.fare || "—"}
          </div>

          {booking.distance_km && (
            <span className="text-gray-300">
              {booking.distance_km} km
            </span>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
          <Clock size={12} />
          {booking.created_at
            ? new Date(booking.created_at).toLocaleString()
            : "—"}
        </div>
      </div>
    );
  };

  if (loading) {
    return <p className="text-gray-400">Loading bookings...</p>;
  }

  if (
    !localBookings.instant_bookings.length &&
    !localBookings.luxury_rides.length &&
    !localBookings.occasional_bookings.length
  ) {
    return (
      <div className="flex flex-col items-center text-gray-400 py-16">
        <AlertTriangle size={36} className="text-[#d4af37]" />
        <p className="mt-2">No bookings yet</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#f0d78c] mb-4 flex items-center gap-2">
        <Calendar size={18} /> Your Bookings
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {localBookings.instant_bookings.map((b) => (
          <BookingCard key={b.id} booking={b} type="Instant Ride" />
        ))}
        {localBookings.luxury_rides.map((b) => (
          <BookingCard key={b.id} booking={b} type="Luxury Ride" />
        ))}
        {localBookings.occasional_bookings.map((b) => (
          <BookingCard key={b.id} booking={b} type="Event Ride" />
        ))}
      </div>
    </div>
  );
};

export default UserBookings;
