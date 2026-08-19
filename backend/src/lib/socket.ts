import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

export type SeatBroadcastStatus = "AVAILABLE" | "HELD" | "SOLD";

export interface SeatUpdatePayload {
  label: string;
  status: SeatBroadcastStatus;
  heldByUserId?: string | null;
  holdExpiresAt?: Date | null;
}

let io: IOServer | null = null;

function roomName(eventId: string): string {
  return `seats:${eventId}`;
}

export function initSocket(httpServer: HTTPServer, corsOrigin: string): IOServer {
  io = new IOServer(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("join-event", (eventId: unknown) => {
      if (typeof eventId === "string" && eventId.length > 0 && eventId.length <= 100) {
        socket.join(roomName(eventId));
      }
    });

    socket.on("leave-event", (eventId: unknown) => {
      if (typeof eventId === "string") socket.leave(roomName(eventId));
    });
  });

  return io;
}

export function broadcastSeatUpdate(eventId: string, payload: SeatUpdatePayload): void {
  io?.to(roomName(eventId)).emit("seat:update", payload);
}
