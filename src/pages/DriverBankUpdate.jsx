import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const DriverBankUpdate = () => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Optional: Load existing bank details
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const token = localStorage.getItem("access"); // JWT token
        const res = await axios.get("/api/driver/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const driver = res.data.driver;
        setBankName(driver.bank_name || "");
        setAccountNumber(driver.bank_account_number || "");
        setIfscCode(driver.ifsc_code || "");
      } catch (err) {
        console.error("Failed to fetch bank details", err);
      }
    };
    fetchBankDetails();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !ifscCode) {
      Swal.fire("Error", "All fields are required", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access"); // JWT token
      const res = await axios.put(
        "/api/driver/update-bank/",
        {
          bank_name: bankName,
          bank_account_number: accountNumber,
          ifsc_code: ifscCode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire("Success", res.data.message, "success");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Update Bank Details</h2>
        <form onSubmit={handleUpdate}>
          <input
            type="text"
            placeholder="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full p-3 border rounded-md mb-3"
            required
          />
          <input
            type="text"
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full p-3 border rounded-md mb-3"
            required
          />
          <input
            type="text"
            placeholder="IFSC Code"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
            className="w-full p-3 border rounded-md mb-4"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-md"
          >
            {loading ? "Updating..." : "Update Bank Details"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DriverBankUpdate;
