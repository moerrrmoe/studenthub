import { io } from "socket.io-client";
import { getApiBaseUrl } from "./api";

export let socket = io(getApiBaseUrl(), {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export const resetSocket = () => {
    if (socket) {
        socket.disconnect();
    }
    socket = io(getApiBaseUrl(), {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
};