/* ================= DRIVER SOCKET ================= */
export const createDriverSocket = (onMessage) => {

  const token = localStorage.getItem("accessToken");

  if (!token) {
    console.warn("⚠️ Driver token missing");
    return null;
  }

  const protocol =
    window.location.protocol === "https:" ? "wss" : "ws";

  const socket = new WebSocket(
    `${protocol}://127.0.0.1:8000/ws/driver/?token=${token}`
  );

  socket.onopen = () => {
    console.log("🚖 Driver WS Connected");
  };

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    onMessage?.(data);
  };

  socket.onclose = () => {
    console.log("Driver WS Disconnected");
  };

  return socket;
};

/* ================= RIDE SOCKET ================= */
export const createRideSocket = (rideId, onMessage) => {

  const token = localStorage.getItem("accessToken");

  if (!token) {
    console.warn("⚠️ Ride Token missing");
    return null;
  }

  const protocol =
    window.location.protocol === "https:" ? "wss" : "ws";

  const socket = new WebSocket(
    `${protocol}://127.0.0.1:8000/ws/ride/${rideId}/?token=${token}`
  );

  socket.onopen = () => {
    console.log("🚘 Ride WS Connected");
  };

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    onMessage?.(data);
  };

  socket.onerror = (e) => {
    console.warn("Ride WS Error:", e);
  };

  socket.onclose = () => {
    console.log("Ride WS Disconnected");
  };

  return socket;
};
