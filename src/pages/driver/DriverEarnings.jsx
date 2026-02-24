import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const data = [
  { day: "Mon", amount: 500 },
  { day: "Tue", amount: 800 },
  { day: "Wed", amount: 650 },
  { day: "Thu", amount: 1200 },
  { day: "Fri", amount: 900 },
];

export default function DriverEarnings() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Earnings</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat title="Today" value="₹850" />
        <Stat title="This Week" value="₹4,050" />
        <Stat title="Wallet Balance" value="₹2,200" />
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-semibold mb-4">Weekly Earnings</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

const Stat = ({ title, value }) => (
  <div className="bg-white p-5 rounded shadow">
    <p className="text-gray-500">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);
