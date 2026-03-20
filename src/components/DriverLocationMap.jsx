import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

/* ================= ICONS ================= */

const pickupIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30]
});

const dropIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [30, 30]
});

const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [35, 35]
});

/* ================= FIT BOUNDS ================= */

function FitBounds({ points }) {

  const map = useMap();

  useEffect(() => {

    if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50] });
    }

  }, [points]);

  return null;

}

/* ================= MAP COMPONENT ================= */

export default function DriverLocationMap({ pickup, drop, driver }) {

  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);

  const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

  /* ================= FETCH ROUTE ================= */

  useEffect(() => {

    async function getRoute() {

      try {

        const res = await fetch(
          "https://api.openrouteservice.org/v2/directions/driving-car",
          {
            method: "POST",
            headers: {
              Authorization: ORS_API_KEY,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              coordinates: [
                [pickup.lon, pickup.lat],
                [drop.lon, drop.lat]
              ]
            })
          }
        );

        const data = await res.json();

        const geometry = data.features[0].geometry.coordinates;

        const points = geometry.map(p => [p[1], p[0]]);

        setRoute(points);

        const summary = data.features[0].properties.summary;

        setDistance((summary.distance / 1000).toFixed(2));
        setEta(Math.round(summary.duration / 60));

      } catch (err) {
        console.error("Route fetch failed:", err);
      }

    }

    if (pickup && drop) {
      getRoute();
    }

  }, [pickup, drop]);

  const points = [
    [pickup.lat, pickup.lon],
    [drop.lat, drop.lon]
  ];

  return (

    <div className="space-y-2">

      {/* INFO BAR */}

      {(distance || eta) && (

        <div className="bg-white shadow rounded-lg p-2 text-sm flex justify-between">

          <span>📍 Distance: {distance} km</span>

          <span>⏱ ETA: {eta} min</span>

        </div>

      )}

      <MapContainer
        center={points[0]}
        zoom={14}
        className="h-[380px] rounded-xl shadow-lg"
        scrollWheelZoom
      >

        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup */}

        <Marker position={points[0]} icon={pickupIcon}>
          <Popup>Pickup Location</Popup>
        </Marker>

        {/* Drop */}

        <Marker position={points[1]} icon={dropIcon}>
          <Popup>Drop Location</Popup>
        </Marker>

        {/* Driver */}

        {driver && (

          <Marker
            position={[driver.lat, driver.lon]}
            icon={driverIcon}
          >
            <Popup>Driver</Popup>
          </Marker>

        )}

        {/* Route */}

        {route.length > 0 && (

          <Polyline
            positions={route}
            color="#2563eb"
            weight={6}
          />

        )}

        <FitBounds points={points} />

      </MapContainer>

    </div>

  );

}