import React from "react";

export default function DriverRideHistory() {
  const rides = [
    { id: 1, from: "Noida", to: "Delhi", fare: 320 },
    { id: 2, from: "Delhi", to: "Gurgaon", fare: 450 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ride History</h1>

      <div className="space-y-3">
        {rides.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded shadow">
            {r.from} → {r.to} | ₹{r.fare}
          </div>
        ))}
      </div>
    </div>
  );
}
