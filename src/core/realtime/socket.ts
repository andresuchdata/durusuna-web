import { io, Socket } from "socket.io-client";
import { env } from "@/core/config/env";
import { tokenStore } from "@/core/auth/token";

let socket: Socket | null = null;

export type SocketStatus = "disconnected" | "connecting" | "connected";
let status: SocketStatus = "disconnected";
const listeners: Array<(s: SocketStatus) => void> = [];

function setStatus(s: SocketStatus) {
  status = s;
  listeners.forEach((l) => l(status));
}

export function onSocketStatus(cb: (s: SocketStatus) => void) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function getSocket() {
  // Always return the same socket instance if it exists
  if (socket) {
    console.log('[Socket] Returning existing socket instance:', socket.id, 'connected:', socket.connected);
    return socket;
  }
  
  console.log('[Socket] Creating new socket instance');
  const token = tokenStore.access;
  setStatus("connecting");
  socket = io(env.SOCKET_URL, {
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: token ? { token } : undefined,
    timeout: 30000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log('[Socket] Connected to server, socket id:', socket?.id);
    setStatus("connected");
  });
  socket.on("disconnect", () => {
    console.log('[Socket] Disconnected from server');
    setStatus("disconnected");
  });
  socket.on("connect_error", (err) => {
    console.log('[Socket] Connection error:', err);
    setStatus("disconnected");
  });

  // Debug: Log all incoming events
  socket.onAny((event, ...args) => {
    console.log('[Socket] Received event:', event, 'on socket:', socket?.id, 'args:', args);
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  setStatus("disconnected");
}
