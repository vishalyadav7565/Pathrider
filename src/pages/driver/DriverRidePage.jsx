import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios";
import DriverLocationMap from "../../components/maps/DriverLocationMap";
import { createRideSocket } from "../../utils/socket";

export default function DriverRidePage() {

  const { bookingId } = useParams();

  const [ride, setRide] = useState(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  /* ================= FETCH RIDE ================= */

  useEffect(() => {

    const fetchRide = async () => {

      try {

        const res = await API.get(`/rides/driver/booking/${bookingId}/`);

        setRide(res.data);
        setStatus(res.data.status);

      } catch (err) {

        if (err.response?.status === 403)
          setError("This ride is not assigned to you");

        else if (err.response?.status === 404)
          setError("Ride not found");

        else
          setError("Failed to load ride");

      }

    };

    fetchRide();

  }, [bookingId]);


  /* ================= CONNECT RIDE SOCKET ================= */

  useEffect(() => {

    socketRef.current = createRideSocket(bookingId);

    return () => {
      socketRef.current?.close();
    };

  }, [bookingId]);


  /* ================= SEND LIVE LOCATION ================= */

  useEffect(() => {

    if (!ride) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(

      (pos) => {

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        /* API update */
        API.post("/rides/driver/update-location/", {
          latitude: lat,
          longitude: lon,
          booking_id: bookingId
        }).catch(() => {});

        /* WebSocket broadcast */
        socketRef.current?.send(JSON.stringify({
          type: "driver_location",
          lat,
          lon
        }));

      },

      (err) => {
        console.warn("GPS Error:", err);
      },

      { enableHighAccuracy: true }

    );

    return () => {

      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);

    };

  }, [ride, bookingId]);


  /* ================= START RIDE ================= */

  const startRide = async () => {

    setError("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    try {

      await API.post(`/rides/start/${bookingId}/`, { otp });

      setStatus("ongoing");

      alert("Ride Started 🚀");

    } catch {

      setError("Invalid OTP");

    }

  };


  /* ================= END RIDE ================= */

  const endRide = async () => {

    try {

      await API.post(`/rides/end/${bookingId}/`);

      setStatus("completed");

      alert("Ride Completed 🏁");

    } catch {

      alert("Failed to end ride");

    }

  };


  /* ================= UI ================= */

  if (error)
    return <p className="text-red-500 p-4">{error}</p>;

  if (!ride)
    return <p className="p-4">Loading ride...</p>;


  return (

    <div className="p-4 space-y-4">

      {/* MAP */}

      <DriverLocationMap
  pickup={{ lat: ride.pickup_lat, lon: ride.pickup_lon }}
  drop={{ lat: ride.drop_lat, lon: ride.drop_lon }}
  driver={{
    lat: ride.driver_lat,
    lon: ride.driver_lon
  }}
/>

      {/* RIDE INFO */}

      <div className="bg-white rounded-xl p-4 shadow space-y-1">

        <h2 className="text-lg font-bold">
          Ride Details
        </h2>

        <p>
          {ride.pickup_location_text} → {ride.drop_location_text}
        </p>

        <p>
          Fare: ₹{ride.fare}
        </p>

        <p>
          Status: <b>{status}</b>
        </p>

      </div>


      {/* OTP START */}

      {status === "accepted" && (

        <div className="bg-white rounded-xl p-4 shadow">

          <h3 className="font-semibold mb-2">
            Enter Ride OTP
          </h3>

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


      {/* END RIDE */}

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