import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Gauge, Wallet, Car, Bell, User, Settings, LogOut } from "lucide-react";

export default function DriverLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/driver/login");
  };

  const menu = [
    { label: "Dashboard", path: "/driver/dashboard", icon: <Gauge size={18} /> },
    { label: "Earnings", path: "/driver/earnings", icon: <Wallet size={18} /> },
    { label: "Ride History", path: "/driver/ride-history", icon: <Car size={18} /> },
    { label: "Requests", path: "/driver/requests", icon: <Bell size={18} /> },
    { label: "Profile", path: "/driver/profile", icon: <User size={18} /> },
    { label: "Settings", path: "/driver/settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white shadow p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-6">PathRider</h2>

        {menu.map((m) => (
          <button
            key={m.path}
            onClick={() => navigate(m.path)}
            className="w-full flex items-center gap-3 p-3 rounded hover:bg-slate-100"
          >
            {m.icon} {m.label}
          </button>
        ))}

        <button
          onClick={logout}
          className="mt-6 text-red-600 flex items-center gap-2"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* PAGE CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
