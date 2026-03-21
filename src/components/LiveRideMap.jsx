import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function LiveRideMap({ booking }) {
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://3.26.155.202:8000/ws/ride/${booking.id}/`
    );

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "driver_location") {
        setDriver({ lat: data.lat, lon: data.lon });
      }
    };

    return () => ws.close();
  }, [booking.id]);

  return (
    <MapContainer
      center={[booking.pickup_lat, booking.pickup_lon]}
      zoom={14}
      className="h-[400px] rounded-xl"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker position={[booking.pickup_lat, booking.pickup_lon]} />
      <Marker position={[booking.drop_lat, booking.drop_lon]} />

      {driver && (
        <Marker
          key={`${driver.lat}-${driver.lon}`}  // 🔥 forces update
          position={[driver.lat, driver.lon]}
        />
      )}
    </MapContainer>
  );
}
