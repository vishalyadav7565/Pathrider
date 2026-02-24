import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios";
import DriverLocationMap from "../../components/maps/DriverLocationMap";

export default function DriverRidePage() {
  const { bookingId } = useParams();

  const [ride, setRide] = useState(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const watchIdRef = useRef(null);

  /* ================= FETCH RIDE ================= */
  useEffect(() => {
    API.get(`/api/rides/driver/booking/${bookingId}/`)
      .then((res) => {
        setRide(res.data);
        setStatus(res.data.status);
      })
      .catch((err) => {
        if (err.response?.status === 403)
          setError("This ride is not assigned to you");
        else if (err.response?.status === 404)
          setError("Ride not found");
        else setError("Failed to load ride");
      });
  }, [bookingId]);

  /* ================= SEND LIVE LOCATION ================= */
  useEffect(() => {
    if (!ride) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        API.post("/api/rides/driver/update-location/", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [ride]);

  /* ================= START RIDE ================= */
  const startRide = async () => {
    setError("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    try {
      await API.post(`/api/rides/start/${bookingId}/`, { otp });
      setStatus("ongoing");
      alert("Ride Started 🚀");
    } catch {
      setError("Invalid OTP");
    }
  };

  /* ================= END RIDE ================= */
  const endRide = async () => {
    try {
      await API.post(`/api/rides/end/${bookingId}/`);
      setStatus("completed");
      alert("Ride Completed 🏁");
    } catch {
      alert("Failed to end ride");
    }
  };

  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!ride) return <p className="p-4">Loading ride...</p>;

  return (
    <div className="p-4 space-y-4">

      {/* 🗺️ MAP */}
      <DriverLocationMap
        pickup={{ lat: ride.pickup_lat, lon: ride.pickup_lon }}
        drop={{ lat: ride.drop_lat, lon: ride.drop_lon }}
      />

      {/* ℹ️ RIDE INFO */}
      <div className="bg-white rounded-xl p-4 shadow space-y-1">
        <h2 className="text-lg font-bold">Ride Details</h2>
        <p>
          {ride.pickup_location_text} → {ride.drop_location_text}
        </p>
        <p>Fare: ₹{ride.fare}</p>
        <p>Status: <b>{status}</b></p>
      </div>

      {/* 🔐 OTP */}
      {status === "accepted" && (
        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2">Enter Ride OTP</h3>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Enter OTP"
          />
          <button
            onClick={startRide}
            className="mt-3 w-full bg-green-600 text-white py-2 rounded"
          >
            Start Ride
          </button>
        </div>
      )}

      {/* 🏁 END */}
      {status === "ongoing" && (
        <button
          onClick={endRide}
          className="w-full bg-red-600 text-white py-3 rounded-xl"
        >
          End Ride
        </button>
      )}
    </div>
  );
}