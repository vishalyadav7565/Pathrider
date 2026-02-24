import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";

/* Default icon fix */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* 🚗 Car Icon */
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [45, 45],
  iconAnchor: [22, 22],
});

/* 📏 Distance Calculator */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

/* 🚗 Driver Marker */
function DriverMarker({ driver }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!driver || !markerRef.current) return;
    markerRef.current.setLatLng([driver.lat, driver.lon]);
  }, [driver]);

  if (!driver) return null;

  return (
    <Marker
      position={[driver.lat, driver.lon]}
      icon={carIcon}
      ref={markerRef}
    >
      <Tooltip permanent direction="top" offset={[0, -25]}>
        🚗 {driver.name}
      </Tooltip>
    </Marker>
  );
}

/* 🔄 Auto Zoom Component */
function AutoZoom({ pickup, driver }) {
  const map = useMap();

  useEffect(() => {
    if (!pickup || !driver) return;

    const bounds = L.latLngBounds([
      [pickup.lat, pickup.lon],
      [driver.lat, driver.lon],
    ]);

    map.fitBounds(bounds, {
      padding: [50, 50],
      animate: true,
      duration: 1,
    });
  }, [pickup, driver, map]);

  return null;
}

export default function RideMap({
  pickup,
  drop,
  driver,
  route = [],
}) {
  if (!pickup || !drop) return null;

  const distance =
    driver &&
    calculateDistance(
      pickup.lat,
      pickup.lon,
      driver.lat,
      driver.lon
    );

  return (
    <div>
      <MapContainer
        center={[pickup.lat, pickup.lon]}
        zoom={14}
        className="h-[400px] rounded-xl"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[pickup.lat, pickup.lon]}>
          <Tooltip permanent>Pickup</Tooltip>
        </Marker>

        <Marker position={[drop.lat, drop.lon]}>
          <Tooltip permanent>Drop</Tooltip>
        </Marker>

        {driver && <DriverMarker driver={driver} />}
        {driver && <AutoZoom pickup={pickup} driver={driver} />}

        {route.length > 0 && (
          <Polyline positions={route} color="blue" weight={5} />
        )}
      </MapContainer>

      {driver && (
        <div className="mt-3 text-center bg-[#1a1208] p-3 rounded-lg text-[#f0d78c]">
          📏 Driver is <strong>{distance} km</strong> away
        </div>
      )}
    </div>
  );
}