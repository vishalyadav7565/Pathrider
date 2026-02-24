import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const DriverRegister = () => {
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP verify
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
    vehicle_number: "",
    vehicle_type: "",
    license_number: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!formData.phone) {
      Swal.fire("Error", "Phone number is required", "error");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      Swal.fire("Error", "Passwords do not match!", "error");
      return;
    }

    setLoading(true);
    try {
      // Send OTP request
      const res = await axios.post("/api/users/driver/register/request-otp/", {
        phone: formData.phone,
      });

      Swal.fire("Success", res.data.message || "OTP sent successfully!", "success");
      setStep(2);
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to send OTP. Check phone number.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2: Verify OTP & Register Driver
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      Swal.fire("Error", "Please enter the OTP", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/users/driver/register/verify-otp/", {
        phone: formData.phone,
        otp: otp,
        name: formData.full_name,
        password: formData.password,
        is_driver: true,
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        license_number: formData.license_number,
        email: formData.email,
      });

      Swal.fire({
        title: "Registration Successful!",
        text: "Redirecting to login...",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => navigate("/login/driver"), 1500);
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "OTP verification failed",
        "error"
      );
      // Optionally go back to step 1 if OTP failed
      // setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Driver Registration</h2>

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-3"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-3"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-3"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-3"
            />
            <input
              type="password"
              name="confirm_password"
              placeholder="Confirm Password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-3"
            />
            <input
              type="text"
              name="vehicle_number"
              placeholder="Vehicle Number"
              value={formData.vehicle_number}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-3"
            />
            <input
              type="text"
              name="vehicle_type"
              placeholder="Vehicle Type"
              value={formData.vehicle_type}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-3"
            />
            <input
              type="text"
              name="license_number"
              placeholder="License Number"
              value={formData.license_number}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full p-3 border rounded-md mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-md"
            >
              {loading ? "Verifying OTP..." : "Verify OTP & Register"}
            </button>
            <p
              className="mt-3 text-sm text-blue-600 cursor-pointer"
              onClick={() => setStep(1)}
            >
              Resend OTP / Edit Phone
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default DriverRegister;
