import React, { useState } from "react";
import axios from "axios";

const UserLogin = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 📩 Request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://3.26.155.202:8000/api/users/user/login/request-otp/", {
        phone: formData.phone,
      });

      if (res.status === 200) {
        setMessage("OTP sent successfully!");
        setStep(2);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to send OTP");
    }
  };

  // 🔐 Verify OTP and Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/users/user/login/verify-otp/",
        {
          phone: formData.phone,
          otp: formData.otp,
        }
      );

      if (res.status === 200) {
        setMessage("Login successful!");

        // ✅ Store tokens consistently
        localStorage.setItem("accessToken", res.data.access);
        localStorage.setItem("refreshToken", res.data.refresh || "");
        localStorage.setItem("role", "user");

        // Redirect user to their dashboard
        window.location.href = "/user/dashboard";
      }
    } catch (error) {
      setMessage(error.response?.data?.error || "Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">User Login</h2>
        <p className="text-center text-gray-600 mb-4">{message}</p>

        {/* Step 1: Send OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              className="w-full border p-2 rounded"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold"
            >
              Send OTP
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              className="w-full border p-2 rounded"
              value={formData.otp}
              onChange={handleChange}
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-semibold"
            >
              Verify & Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserLogin;
