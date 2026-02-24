import { useEffect, useRef } from "react";
import { createDriverSocket } from "../utils/socket";

export default function useDriverWS(onMessage) {

  const socketRef = useRef(null);
  const connectedRef = useRef(false);

  useEffect(() => {

    if (connectedRef.current) return;

    connectedRef.current = true;

    socketRef.current = createDriverSocket(onMessage);

    return () => {
      socketRef.current?.close();
      connectedRef.current = false;
    };

  }, []);
}