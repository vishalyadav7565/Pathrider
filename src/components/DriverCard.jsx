import { Phone, Car } from "lucide-react";

export default function DriverCard({ driver }) {
  if (!driver) return null;

  return (
    <div className="p-4 bg-[#1a1208] rounded-xl border border-[#d4af37]/30">
      <h3 className="text-[#f0d78c] font-bold flex gap-2 items-center">
        <Car size={18} /> Driver Assigned
      </h3>

      <div className="mt-2 text-gray-300 space-y-1">
        <p><b>Name:</b> {driver.name}</p>
        <p><b>Vehicle:</b> {driver.vehicle}</p>
        <p><b>OTP:</b> <span className="text-green-400">{driver.otp}</span></p>
      </div>

      <a
        href={`tel:${driver.phone}`}
        className="flex items-center justify-center gap-2 mt-3
                   bg-[#d4af37] text-black py-2 rounded-lg font-bold"
      >
        <Phone size={16} /> Call Driver
      </a>
    </div>
  );
}
