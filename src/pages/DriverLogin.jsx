import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

const DriverLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const publicAxios = axios.create({
    baseURL: "http://3.26.155.202:8000",
  });

  // ✅ Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await publicAxios.post("/api/users/driver/login/request-otp/", {
        phone,
      });
      console.log("📱 OTP Requested:", res.data);
      Swal.fire({
        title: "OTP Sent!",
        text: "Check your phone for the OTP.",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      setStep(2);
    } catch (err) {
      console.error("OTP request failed:", err);
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to send OTP.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await publicAxios.post(
        "/api/users/driver/login/verify-otp/",
        { phone, otp }
      );

      console.log("🔐 OTP Verify Response:", res.data);

      // ✅ Save tokens
      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh || "");
      localStorage.setItem("role", res.data.role || "driver");

      // ✅ Save driver info safely
      if (res.data.driver && res.data.driver.id) {
        localStorage.setItem("driver_id", res.data.driver.id);
        localStorage.setItem("driver_name", res.data.driver.name);
        localStorage.setItem("driver_phone", res.data.driver.phone);
        console.log("🧠 Driver ID saved:", res.data.driver.id);
      } else {
        console.warn("⚠️ Driver ID missing from response!");
      }

      Swal.fire({
        title: "Login Successful!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => navigate("/driver/dashboard"), 1500);
    } catch (err) {
      console.error("OTP verification failed:", err);
      Swal.fire(
        "Error",
        err.response?.data?.error || "Invalid OTP. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[400px]">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Driver Login
        </h2>

        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <label className="block mb-2 text-gray-700 font-medium">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone"
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <label className="block mb-2 text-gray-700 font-medium">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DriverLogin;
