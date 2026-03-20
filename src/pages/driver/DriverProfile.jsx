import { useEffect, useState } from "react";
import api from "../../api/axios";
import Swal from "sweetalert2";
import { User, Phone, Mail, Car, Wallet, Star, BadgeCheck } from "lucide-react";

export default function DriverProfile() {

  const [driver, setDriver] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {

    const fetchProfile = async () => {
      try {

        const res = await api.get("/users/driver/profile/");

        setDriver(res.data.driver);
        setUser(res.data.user);

      } catch {
        Swal.fire("Error", "Unable to load profile", "error");
      }
    };

    fetchProfile();

  }, []);

  if (!driver) return <p className="p-6">Loading profile...</p>;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">

      <h1 className="text-2xl font-bold text-blue-600 mb-6">
        Driver Profile
      </h1>

      <div className="grid md:grid-cols-2 gap-6 mb-6">

        <div className="space-y-2">
          <p className="flex items-center gap-2">
            <User size={18}/> <b>Name:</b> {user?.name}
          </p>

          <p className="flex items-center gap-2">
            <Phone size={18}/> <b>Phone:</b> {user?.phone}
          </p>

          <p className="flex items-center gap-2">
            <Mail size={18}/> <b>Email:</b> {user?.email || "N/A"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="flex items-center gap-2">
            <Car size={18}/> <b>Vehicle:</b> {driver?.vehicle_number}
          </p>

          <p className="flex items-center gap-2">
            <Star size={18}/> <b>Rating:</b> {driver?.rating || "5.0"}
          </p>

          <p className="flex items-center gap-2">
            <Wallet size={18}/> <b>Wallet:</b> ₹{driver?.wallet_balance}
          </p>
        </div>

      </div>

      <div className="flex items-center gap-2">

        <BadgeCheck className={
          driver?.is_verified ? "text-green-600" : "text-gray-400"
        }/>

        <span className="font-semibold">
          {driver?.is_verified ? "Verified Driver" : "Not Verified"}
        </span>

      </div>

    </div>
  );
}