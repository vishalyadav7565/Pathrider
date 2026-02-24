import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [points]);

  return null;
}

export default function DriverLocationMap({ pickup, drop }) {
  const points = [
    [pickup.lat, pickup.lon],
    [drop.lat, drop.lon],
  ];

  return (
    <MapContainer
      center={points[0]}
      zoom={14}
      className="h-[350px] rounded-xl"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker position={points[0]} />
      <Marker position={points[1]} />
      <Polyline positions={points} color="blue" />

      <FitBounds points={points} />
    </MapContainer>
  );
}