import { useEffect, useRef } from "react";
import API from "../api/axios";

/**
 * DriverLiveTracker
 * -----------------
 * - Sends driver's live GPS location to backend
 * - Uses REST API (NOT WebSocket)
 * - Automatically cleans up on unmount
 *
 * Backend endpoint:
 * POST /api/rides/driver/update-location/
 */
export default function DriverLiveTracker({ bookingId }) {
  const watchIdRef = useRef(null);

  useEffect(() => {
    // No active booking → do nothing
    if (!bookingId) return;

    // Start watching GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          await API.post("/api/rides/driver/update-location/", {
            latitude,
            longitude,
          });
        } catch (error) {
          console.error("❌ Failed to update driver location", error);
        }
      },
      (error) => {
        console.error("❌ GPS error", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    // Cleanup when component unmounts or booking changes
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [bookingId]);

  // This component renders nothing
  return null;
}
