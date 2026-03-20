import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../utils/api";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ================= LEAFLET ICON FIX ================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ================= PRICE PER KM (UI ONLY) ================= */
const PRICE_PER_KM = {
  sedan: 12,
  suv: 16,
  luxury: 25,
  bus: 30,
  traveller: 20,
};

/* ================= HAVERSINE ================= */
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ================= MAP AUTO FLY ================= */
function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 1 });
  }, [position]);
  return null;
}

export default function RideBookingPage() {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [route, setRoute] = useState([]);

  const [dropText, setDropText] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const [vehicle, setVehicle] = useState("sedan");
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);

  // 🔑 BOOKING TYPE
  const [bookingType, setBookingType] = useState("instant");

  /* ================= GET CURRENT LOCATION ================= */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setPickup({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () => Swal.fire("Enable GPS", "Location required", "warning"),
      { enableHighAccuracy: true }
    );
  }, []);

  /* ================= AUTOCOMPLETE ================= */
  useEffect(() => {
    if (dropText.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${dropText}&limit=5`
      );
      setSuggestions(await res.json());
    }, 400);

    return () => clearTimeout(timer);
  }, [dropText]);

  /* ================= ROUTE ================= */
  const fetchRoute = async (p, d) => {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${p.lon},${p.lat};${d.lon},${d.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes?.length) {
      const coords = data.routes[0].geometry.coordinates.map(
        ([lon, lat]) => [lat, lon]
      );
      setRoute(coords);
    }
  };

  useEffect(() => {
    if (pickup && drop) fetchRoute(pickup, drop);
  }, [pickup, drop]);

  /* ================= SELECT DESTINATION ================= */
  const selectDestination = (place) => {
    setDrop({ lat: +place.lat, lon: +place.lon });
    setDropText(place.display_name);
    setSuggestions([]);
  };

  /* ================= DISTANCE & FARE (UI ONLY) ================= */
  useEffect(() => {
    if (pickup && drop) {
      const d = haversine(pickup.lat, pickup.lon, drop.lat, drop.lon);
      setDistance(d.toFixed(2));
      setFare((d * PRICE_PER_KM[vehicle]).toFixed(0));
    }
  }, [pickup, drop, vehicle]);

  /* ================= BOOK RIDE (FINAL) ================= */
  const bookRide = async () => {
    if (!pickup || !drop) {
      return Swal.fire("Select destination first");
    }

    try {
      const res = await API.post(`rides/bookings/${bookingType}/`, {
        pickup_lat: pickup.lat,
        pickup_lon: pickup.lon,
        drop_lat: drop.lat,
        drop_lon: drop.lon,
        pickup_location_text: "Current Location",
        drop_location_text: dropText,
        vehicle_type: vehicle,
        quantity: 1,
      });

      Swal.fire("🚗 Ride Booked", "Finding nearby drivers...", "success");
      navigate(`/booking/${res.data.id}`);

    } catch (err) {
      Swal.fire(
        "Booking failed",
        JSON.stringify(err.response?.data || {}),
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 text-center bg-[#1a1208] text-[#f0d78c] font-bold">
        🚕 Book Ride
      </div>

      {/* BOOKING TYPE */}
      <div className="p-4 flex gap-2">
        {["instant", "luxury", "occasion"].map((t) => (
          <button
            key={t}
            onClick={() => setBookingType(t)}
            className={`flex-1 py-2 rounded ${
              bookingType === t
                ? "bg-[#d4af37] text-black"
                : "bg-[#2b1d0f]"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="p-4 relative z-50">
        <input
          value={dropText}
          onChange={(e) => setDropText(e.target.value)}
          placeholder="Enter destination"
          className="w-full p-3 bg-[#1a1208] rounded-xl outline-none"
        />

        {suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-[#1a1208] rounded-xl">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => selectDestination(s)}
                className="p-3 cursor-pointer hover:bg-[#2b1d0f]"
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="px-4">
        <MapContainer center={[28.6139, 77.209]} zoom={13} className="h-[350px] rounded-xl">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pickup && <Marker position={[pickup.lat, pickup.lon]} />}
          {drop && <Marker position={[drop.lat, drop.lon]} />}
          {route.length > 0 && <Polyline positions={route} />}
        </MapContainer>
      </div>

      {/* BOTTOM */}
      <div className="p-4 bg-[#1a1208] mt-3 rounded-t-2xl">
        <select
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
          className="w-full p-3 bg-[#2b1d0f] rounded-lg"
        >
          {Object.keys(PRICE_PER_KM).map((v) => (
            <option key={v} value={v}>{v.toUpperCase()}</option>
          ))}
        </select>

        {distance && (
          <div className="text-center mt-3 text-[#f0d78c]">
            <p>{distance} km</p>
            <p className="text-xl font-bold">₹ {fare}</p>
          </div>
        )}

        <button
          onClick={bookRide}
          className="w-full mt-4 py-4 bg-[#d4af37] text-black rounded-xl text-lg font-bold"
        >
          Book Ride
        </button>
      </div>
    </div>
  );
}