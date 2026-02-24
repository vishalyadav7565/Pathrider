import React, { useState } from "react";

// Calculate distance using Haversine formula
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

const DistanceFareCalculator = () => {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const pricePerKm = 12; // 💰 customize fare per km

  const getCoords = async (address) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    return data.length ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
  };

  const calculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pickupCoords = await getCoords(pickup);
      const dropCoords = await getCoords(drop);

      if (!pickupCoords || !dropCoords) {
        alert("❌ Invalid location entered. Please try again.");
        setLoading(false);
        return;
      }

      const dist = getDistance(
        pickupCoords.lat,
        pickupCoords.lon,
        dropCoords.lat,
        dropCoords.lon
      );
      setDistance(dist.toFixed(2));
      setFare((dist * pricePerKm).toFixed(2));
    } catch (err) {
      console.error(err);
      alert("⚠️ Error calculating distance. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#0d0a04] to-[#1b1307] text-white p-6">
      <div className="bg-[#1a1208]/70 border border-[#d4af37]/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(212,175,55,0.3)] max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-[#f0d78c]">
          🚗 Distance & Fare Calculator
        </h2>

        <form onSubmit={calculate} className="space-y-4">
          <input
            type="text"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            placeholder="Enter Pickup Location"
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white placeholder-gray-400"
            required
          />
          <input
            type="text"
            value={drop}
            onChange={(e) => setDrop(e.target.value)}
            placeholder="Enter Drop Location"
            className="w-full p-3 rounded-lg bg-[#2b1d0f]/70 border border-[#d4af37]/40 text-white placeholder-gray-400"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#f0d78c] text-black font-semibold rounded-lg hover:bg-[#d4af37] transition"
          >
            {loading ? "Calculating..." : "Calculate Distance"}
          </button>
        </form>

        {distance && (
          <div className="mt-6 text-center space-y-2">
            <p>📏 Distance: <span className="text-[#f0d78c]">{distance} km</span></p>
            <p>💰 Estimated Fare: <span className="text-[#f0d78c]">₹{fare}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistanceFareCalculator;
