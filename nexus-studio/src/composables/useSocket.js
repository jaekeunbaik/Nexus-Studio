import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:3000`;
const socket = io(socketUrl, {
    autoConnect: false
});

export function useSocket() {
    return { socket };
}
