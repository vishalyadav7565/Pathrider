import React, { useState } from "react";
import axios from "axios";

const UserRegister = () => {
  const [step, setStep] = useState("user-register"); // steps: user-register, user-verify, user-login, user-login-verify
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirm_password: "",
    otp: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // -----------------------------
  // ✅ Send OTP for Registration
  // -----------------------------
  const handleSendOtpRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setMessage("Passwords do not match!");
      return;
    }
    try {
      const res = await axios.post(
        "/api/users/user/register/request-otp/",
        { phone: formData.phone },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.status === 200) {
        setMessage("OTP sent successfully!");
        setStep("user-verify");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "Failed to send OTP");
    }
  };

  // -----------------------------
  // ✅ Verify OTP & Register
  // -----------------------------
  const handleVerifyOtpRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "/api/users/user/register/verify-otp/",
        {
          phone: formData.phone,
          otp: formData.otp,
          name: formData.name,
          password: formData.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.status === 200) {
        setMessage("Registration successful!");
        localStorage.setItem("userToken", res.data.access);
        window.location.href = "/user/dashboard";
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "OTP verification failed");
    }
  };

  // -----------------------------
  // ✅ Send OTP for Login
  // -----------------------------
  const handleSendOtpLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "/api/users/user/login/request-otp/",
        { phone: formData.phone },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.status === 200) {
        setMessage("OTP sent successfully!");
        setStep("user-login-verify");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "Failed to send OTP");
    }
  };

  // -----------------------------
  // ✅ Verify OTP & Login
  // -----------------------------
  const handleVerifyOtpLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "/api/users/user/login/verify-otp/",
        { phone: formData.phone, otp: formData.otp },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.status === 200) {
        setMessage("Login successful!");
        localStorage.setItem("userToken", res.data.access);
        window.location.href = "/user/dashboard";
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "OTP verification failed");
    }
  };

  // -----------------------------
  // Render forms based on step
  // -----------------------------
  const renderForm = () => {
    switch (step) {
      case "user-register":
        return (
          <form onSubmit={handleSendOtpRegister} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="w-full border p-2 rounded"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              className="w-full border p-2 rounded"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full border p-2 rounded"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              className="w-full border p-2 rounded"
              value={formData.confirm_password}
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
        );
      case "user-verify":
        return (
          <form onSubmit={handleVerifyOtpRegister} className="space-y-4">
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
              Verify & Register
            </button>
          </form>
        );
      case "user-login":
        return (
          <form onSubmit={handleSendOtpLogin} className="space-y-4">
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
        );
      case "user-login-verify":
        return (
          <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">User Auth</h2>
        <p className="text-center text-gray-600 mb-4">{message}</p>
        {renderForm()}
      </div>
    </div>
  );
};

export default UserRegister;
