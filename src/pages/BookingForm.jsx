import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import api from "../api";

// Haversine in JS
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nominatim geocode
async function geocode(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

const pricePerKm = {
  sedan: 12,
  suv: 16,
  luxury: 25,
  bus: 30,
  traveller: 20,
};

const BookingForm = () => {
  const [formData, setFormData] = useState({
    event_name: "",
    pickup_location: "",
    drop_location: "",
    scheduled_time: "",
    vehicle_type: "sedan",
    quantity: 1,
  });
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ pickup: null, drop: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Called when user wants preview/update
  const handlePreview = async () => {
    if (!formData.pickup_location || !formData.drop_location) {
      Swal.fire("Enter pickup & drop", "", "info");
      return;
    }
    setLoading(true);
    try {
      const p = await geocode(formData.pickup_location);
      const d = await geocode(formData.drop_location);

      if (!p || !d) {
        Swal.fire("Location not found", "Check addresses and try again", "error");
        setLoading(false);
        return;
      }

      setCoords({ pickup: p, drop: d });

      const dist = getDistanceKm(p.lat, p.lon, d.lat, d.lon);
      setDistance(Number(dist.toFixed(2)));
      const cost = dist * (pricePerKm[formData.vehicle_type] || 12);
      setFare(Number(cost.toFixed(2)));
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to calculate preview", "error");
    } finally {
      setLoading(false);
    }
  };

  // Submit booking to backend
  const handleSubmit = async (e, booking_type = "scheduled") => {
    e.preventDefault();
    setLoading(true);
    try {
      // If no coords exist, geocode to ensure server gets coordinates
      let p = coords.pickup;
      let d = coords.drop;
      if (!p || !d) {
        p = await geocode(formData.pickup_location);
        d = await geocode(formData.drop_location);
        if (!p || !d) throw new Error("Geocoding failed");
      }

      // send payload - include coordinates and preview distance/fare
      const payload = {
        event_name: formData.event_name,
        pickup_location_text: formData.pickup_location,
        drop_location_text: formData.drop_location,
        pickup_lat: p.lat,
        pickup_lon: p.lon,
        drop_lat: d.lat,
        drop_lon: d.lon,
        scheduled_time: formData.scheduled_time || null,
        vehicle_type: formData.vehicle_type,
        quantity: formData.quantity,
        booking_type,            // "instant" or "scheduled" etc.
        client_distance_km: distance,
        client_fare: fare,
      };

      // example axios instance; replace baseURL in your utils/api
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const headers = {};
      if (user && user.token) headers.Authorization = `Bearer ${user.token}`;

      const res = await axios.post("/api/bookings/", payload, { headers });
      Swal.fire("Booked", "Your booking is created.", "success");
      // reset
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
      setCoords({ pickup: null, drop: null });
      console.log("Booking created", res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to create booking", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Create Booking</h2>

      <form onSubmit={(e) => handleSubmit(e, "scheduled")} className="space-y-4">
        <input
          name="event_name"
          value={formData.event_name}
          onChange={handleChange}
          placeholder="Event name (optional)"
          className="w-full p-2 border rounded"
        />

        <input
          name="pickup_location"
          value={formData.pickup_location}
          onChange={handleChange}
          placeholder="Pickup address"
          className="w-full p-2 border rounded"
          required
        />

        <input
          name="drop_location"
          value={formData.drop_location}
          onChange={handleChange}
          placeholder="Drop address"
          className="w-full p-2 border rounded"
          required
        />

        <div className="flex gap-2">
          <select
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="luxury">Luxury</option>
            <option value="bus">Bus</option>
            <option value="traveller">Traveller</option>
          </select>

          <input
            name="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            className="p-2 border rounded w-24"
          />

          <button
            type="button"
            onClick={handlePreview}
            className="px-3 py-2 bg-yellow-400 rounded"
            disabled={loading}
          >
            Preview
          </button>
        </div>

        {distance !== null && (
          <div>
            <p>Distance: {distance} km</p>
            <p>Estimated Fare: ₹{fare}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            Create Scheduled Booking
          </button>

          <button
            type="button"
            onClick={(e) => handleSubmit(e, "instant")}
            className="px-4 py-2 bg-green-600 text-white rounded"
            disabled={loading}
          >
            Instant Book
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
