import API from "../utils/api";

export default function DriverRequestCard({ ride }) {
  const respond = async (action) => {
    await API.post("/rides/driver/respond/", {
      booking_id: ride.id,
      action,
    });
  };

  return (
    <div className="bg-[#1a1208] p-4 rounded-xl border border-[#d4af37]/30">
      <h3 className="text-[#f0d78c] font-bold">🚨 New Ride Request</h3>
      <p className="text-gray-300 mt-1">
        {ride.pickup_location_text} → {ride.drop_location_text}
      </p>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => respond("accept")}
          className="flex-1 bg-green-500 text-black py-2 rounded-lg font-bold"
        >
          Accept
        </button>
        <button
          onClick={() => respond("reject")}
          className="flex-1 bg-red-500 text-black py-2 rounded-lg font-bold"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
