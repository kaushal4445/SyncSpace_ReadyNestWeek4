import { useEffect } from "react";
import { socket } from "../services/socket";

// Subscribes to a socket event for the lifetime of the component and cleans up automatically.
const useSocketEvent = (eventName, handler, deps = []) => {
  useEffect(() => {
    socket.on(eventName, handler);
    return () => socket.off(eventName, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, ...deps]);
};

export default useSocketEvent;
