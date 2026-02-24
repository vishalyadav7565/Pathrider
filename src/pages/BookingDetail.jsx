import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../utils/api";
import { createRideSocket } from "../utils/socket";
import RideMap from "../components/RideMap";
import DriverCard from "../components/DriverCard";

export default function BookingDetail() {

  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const bookingRef = useRef(null);
  const watchIdRef = useRef(null);
  const ringRef = useRef(null);

  /* 🔔 SOUND */
  useEffect(() => {
    ringRef.current = new Audio("/sounds/driver_assigned.mp3");
  }, []);

  const playRing = () => {
    ringRef.current?.play().catch(() => {});
  };

  /* ================= FETCH BOOKING ================= */
  useEffect(() => {

    const fetchBooking = async () => {
      try {

        const res = await API.get(`/rides/bookings/${id}/`);
        setBooking(res.data);
        bookingRef.current = res.data;

        if (res.data.assigned_driver) {
          setDriverLocation({
            lat: res.data.assigned_driver.latitude,
            lon: res.data.assigned_driver.longitude,
            name: res.data.assigned_driver.name
          });
        }

      } catch (err) {
        console.error("Booking load error", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooking();

  }, [id]);

  /* ================= ROUTE FETCH ================= */
  const fetchRoute = async (points) => {

    if (points.length < 2) return [];

    const coords = points.map(p => `${p.lon},${p.lat}`).join(";");

    try {

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      );

      const data = await res.json();

      return (
        data.routes?.[0]?.geometry.coordinates.map(
          ([lon, lat]) => [lat, lon]
        ) || []
      );

    } catch {
      return [];
    }
  };

  /* ================= SOCKET CONNECT ================= */
  useEffect(() => {

    if (!id) return;

    socketRef.current?.close();

    socketRef.current = createRideSocket(id, async (data) => {

      const currentBooking = bookingRef.current;

      /* 🚗 DRIVER LIVE LOCATION */
      if (data.type === "driver_location") {

        const driverLoc = {
          lat: data.lat,
          lon: data.lon,
          name:
            currentBooking?.assigned_driver?.name
            || "Driver"
        };

        setDriverLocation(driverLoc);

        if (currentBooking) {

          const r = await fetchRoute([
            driverLoc,
            {
              lat: currentBooking.pickup_lat,
              lon: currentBooking.pickup_lon
            },
            {
              lat: currentBooking.drop_lat,
              lon: currentBooking.drop_lon
            },
          ]);

          setRoute(r);
        }
      }

      /* ✅ DRIVER ACCEPTED */
      if (data.type === "ride_accepted") {

        playRing();

        const driverLoc = {
          lat: data.driver.latitude,
          lon: data.driver.longitude,
          name: data.driver.name
        };

        setDriverLocation(driverLoc);

        const updatedBooking = {
          ...currentBooking,
          status: "accepted",
          ride_otp: data.otp,
          assigned_driver: data.driver
        };

        setBooking(updatedBooking);
        bookingRef.current = updatedBooking;
      }

      /* 🟢 RIDE STARTED */
      if (data.type === "ride_started") {
        setBooking(prev => ({ ...prev, status: "ongoing" }));
      }

      /* 🏁 RIDE COMPLETED */
      if (data.type === "ride_completed") {
        setBooking(prev => ({ ...prev, status: "completed" }));
      }

    });

    /* 🟢 USER LIVE LOCATION SEND */
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {

        socketRef.current?.send(
          JSON.stringify({
            type: "user_location",
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          })
        );

      },
      (err) => console.error("GPS error", err),
      { enableHighAccuracy: true }
    );

    return () => {

      socketRef.current?.close();

      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

    };

  }, [id]);

  /* ================= UI ================= */
  if (loading)
    return <p className="p-4 text-white">Loading ride...</p>;

  if (!booking)
    return <p className="p-4 text-red-500">Booking not found</p>;

  return (
    <div className="p-4 space-y-4 text-white">

      {/* 🗺 LIVE MAP */}
      <RideMap
        pickup={{ lat: booking.pickup_lat, lon: booking.pickup_lon }}
        drop={{ lat: booking.drop_lat, lon: booking.drop_lon }}
        driver={driverLocation}
        route={route}
      />

      {/* 🚗 DRIVER CARD */}
      {(booking.assigned_driver || driverLocation) && (
        <DriverCard
          driver={{
            name: booking.assigned_driver?.name ?? driverLocation?.name ?? "Driver",
            phone: booking.assigned_driver?.phone ?? "",
            vehicle: booking.assigned_driver?.vehicle ?? "",
            otp: booking.ride_otp
          }}
        />
      )}

      {/* 📊 INFO */}
      <div className="bg-[#1a1208] p-4 rounded-xl text-[#f0d78c] space-y-1">
        <p>📏 Distance: {booking.distance_km} km</p>
        <p>💰 Fare: ₹{booking.fare}</p>
        <p>📌 Status: {booking.status}</p>
      </div>

      {/* 🔐 OTP */}
      {booking.ride_otp && (
        <div className="bg-black p-4 rounded-xl text-center border border-green-500/40">
          <p className="text-gray-400">Ride OTP</p>
          <p className="text-3xl font-bold text-green-400 tracking-widest">
            {booking.ride_otp}
          </p>
        </div>
      )}

    </div>
  );
}