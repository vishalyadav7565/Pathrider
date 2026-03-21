import React from "react";

export default function DriverNotifications() {
  const [notifications, setNotifications] = useState([]);

useEffect(() => {
  const driverId = localStorage.getItem("driver_id");
  const ws = new WebSocket(`ws://3.26.155.202:8000/ws/driver/${driverId}/`);

  ws.onmessage = e => {
    setNotifications(prev => [JSON.parse(e.data), ...prev]);
  };

  return () => ws.close();
}, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      {notifications.map((n, i) => (
        <div key={i} className="bg-white p-4 mb-2 rounded shadow">
          🔔 {n}
        </div>
      ))}
    </div>
  );
}
