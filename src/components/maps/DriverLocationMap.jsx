import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix leaflet marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61231.png",
  iconSize: [40, 40],
});

const pickupIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
});

const dropIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [35, 35],
});

export default function DriverLocationMap({ pickup, drop }) {
  const [driverLocation, setDriverLocation] = useState(null);

  // 📍 Get driver live location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setDriverLocation([
          pos.coords.latitude,
          pos.coords.longitude,
        ]);
      },
      err => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const center = driverLocation || pickup;

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🚕 DRIVER */}
      {driverLocation && (
        <Marker position={driverLocation} icon={driverIcon} />
      )}

      {/* 📍 PICKUP */}
      <Marker position={pickup} icon={pickupIcon} />

      {/* 🎯 DROP */}
      {drop && <Marker position={drop} icon={dropIcon} />}

      {/* 🧭 ROUTE */}
      {driverLocation && (
        <Polyline
          positions={[driverLocation, pickup, drop]}
          color="blue"
        />
      )}
    </MapContainer>
  );
}
