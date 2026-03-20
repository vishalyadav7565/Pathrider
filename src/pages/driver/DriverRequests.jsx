import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { createDriverSocket } from "../../utils/socket";

export default function DriverRequests() {

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const socketRef = useRef(null);
  const connectedRef = useRef(false);

  /* ================= LOAD REQUESTS ================= */

  useEffect(() => {

    const loadRequests = async () => {
      try {

        const res = await api.get("/rides/driver/nearby-requests/");

        setRequests(Array.isArray(res.data) ? res.data : []);

      } catch (err) {

        console.error("Failed to load requests", err);

      } finally {

        setLoading(false);

      }
    };

    loadRequests();

  }, []);

  /* ================= SOCKET ================= */

  useEffect(() => {

    if (connectedRef.current) return;

    connectedRef.current = true;

    socketRef.current = createDriverSocket((msg) => {

      console.log("🔔 WS:", msg);

      /* REMOVE if other driver accepted */

      if (msg.type === "REMOVE_BOOKING") {

        setRequests(prev =>
          prev.filter(b => b.id !== msg.booking_id)
        );

        return;
      }

      /* NEW RIDE REQUEST */

      if (msg.type === "NEW_RIDE") {

        const booking = msg.data;

        setRequests(prev => {

          if (prev.some(b => b.id === booking.id))
            return prev;

          return [booking, ...prev];

        });

      }

    });

    return () => {
      socketRef.current?.close();
      connectedRef.current = false;
    };

  }, []);

  /* ================= ACCEPT / REJECT ================= */

  const decide = async (bookingId, action) => {

    try {

      await api.post("/rides/driver/decision/", {
        booking_id: bookingId,
        decision: action.toUpperCase()
      });

      setRequests(prev =>
        prev.filter(r => r.id !== bookingId)
      );

      if (action === "accept") {

        navigate(`/driver/ride/${bookingId}`);

      }

    } catch (err) {

      if (err.response?.status === 409) {

        alert("Ride already taken by another driver");

      } else {

        alert("Something went wrong");

      }

    }

  };

  /* ================= UI ================= */

  if (loading)
    return <p className="p-4 text-gray-500">Loading requests...</p>;

  if (!requests.length)
    return <p className="p-4 text-gray-500">No ride requests</p>;

  return (

    <div className="p-4">

      <h2 className="text-xl font-bold mb-4">
        Nearby Ride Requests
      </h2>

      {requests.map((r) => (

        <div
          key={r.id}
          className="bg-white p-4 mb-4 rounded shadow border"
        >

          <p className="font-semibold">
            {r.pickup_location_text} → {r.drop_location_text}
          </p>

          <p className="text-sm text-gray-600">
            Distance: {r.distance_km} km • Fare: ₹{r.fare}
          </p>

          <div className="flex gap-3 mt-3">

            <button
              onClick={() => decide(r.id, "accept")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
            >
              Accept
            </button>

            <button
              onClick={() => decide(r.id, "reject")}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
            >
              Reject
            </button>

          </div>

        </div>

      ))}

    </div>

  );

}