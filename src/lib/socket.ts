import { io, type Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

let socket: Socket | null = null;

/** Socket.IO singleton compartilhado pelo app — conecta sob demanda e reaproveita a conexão. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}
