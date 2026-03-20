import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";
import { MapPin } from "lucide-react";
import DriverLocationMap from "../../components/maps/DriverLocationMap";
import { createDriverSocket } from "../../utils/socket";

export default function DriverDashboard() {

  const [driver, setDriver] = useState(null);
  const [rides, setRides] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  /* ================= LOAD PROFILE + RIDES ================= */
  useEffect(() => {

    const loadData = async () => {
      try {
        const [profileRes, ridesRes] = await Promise.all([
          API.get("/users/driver/profile/"),
          API.get("/rides/driver/my-rides/")
        ]);

        setDriver(profileRes.data.driver || profileRes.data);
        setRides(Array.isArray(ridesRes.data) ? ridesRes.data : []);
      } catch (err) {
        console.error("Dashboard Load Failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

  }, []);

  /* ================= CONNECT DRIVER SOCKET ================= */
  useEffect(() => {

    if (socketRef.current) return;

    socketRef.current = createDriverSocket((data) => {
      console.log("🚨 DRIVER WS:", data);

      if (data.type === "NEW_RIDE") {
        alert("📢 New Ride Request!");
      }
    });

    setOnline(true);

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
      setOnline(false);
    };

  }, []);

  /* ================= SEND LIVE LOCATION ================= */
  useEffect(() => {

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {

        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        setCoords({ latitude, longitude });

        if (socketRef.current?.readyState === 1) {
          socketRef.current.send(
            JSON.stringify({
              type: "driver_location",
              lat: latitude,
              lon: longitude
            })
          );
        }

      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };

  }, []);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {driver?.name || "Driver"} 👋
        </h1>

        <span className={`px-4 py-1 rounded-full text-sm ${
          online ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          ● {online ? "Online" : "Offline"}
        </span>

      </div>

      {/* LOCATION STATUS */}
      <p className="flex items-center gap-1 text-gray-600">
        <MapPin size={16} />
        {coords ? "Live Location Active" : "Waiting for GPS"}
      </p>

      {/* MAP */}
      {coords && (
        <DriverLocationMap
          latitude={coords.latitude}
          longitude={coords.longitude}
        />
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <StatCard
          title="Wallet"
          value={`₹${driver?.wallet_balance || 0}`}
          color="green"
        />

        <StatCard
          title="Total Rides"
          value={rides.length}
          color="blue"
        />

        <StatCard
          title="Completed"
          value={rides.filter(r => r.status === "completed").length}
          color="purple"
        />

        <StatCard
          title="Today"
          value={`₹${driver?.today_earnings || 0}`}
          color="orange"
        />

      </div>

    </div>
  );
}

/* ================= STAT CARD ================= */

const StatCard = ({ title, value, color }) => {

  const colors = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700"
  };

  return (
    <div className={`p-4 rounded-xl shadow ${colors[color]}`}>
      <p className="text-sm">{title}</p>
      <h3 className="text-xl font-bold mt-1">{value}</h3>
    </div>
  );
};