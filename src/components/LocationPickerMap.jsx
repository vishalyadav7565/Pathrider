import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";

function PickupMarker({ onPick }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPick(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function PickupMap({ onPick }) {
  return (
    <MapContainer
      center={[28.6139, 77.2090]} // Default Delhi
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <PickupMarker onPick={onPick} />
    </MapContainer>
  );
}
