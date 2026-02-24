import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function CarMap() {
  const center = [28.6139, 77.2090]; // Delhi

  return (
    <MapContainer center={center} zoom={13} style={{ height: "500px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>Pickup Location</Popup>
      </Marker>
    </MapContainer>
  );
}
