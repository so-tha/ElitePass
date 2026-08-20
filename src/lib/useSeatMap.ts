import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { SeatMapResponse, SeatStatus } from "@/app/api/seats/[eventId]/route";

export interface SeatInfo {
  status: SeatStatus;
  heldByUserId?: string;
  holdExpiresAt?: string;
}

interface SeatUpdateEvent {
  label: string;
  status: SeatStatus;
  heldByUserId?: string;
  holdExpiresAt?: string;
}

const MAX_SEATS = 8;

export function useSeatMap(eventId: string, userId: string | null, accessToken: string | null) {
  const [seats, setSeats] = useState<Map<string, SeatInfo>>(new Map());
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedRef = useRef<string[]>([]);
  const tokenRef = useRef<string | null>(accessToken);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  useEffect(() => {
    if (!eventId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      setSelected([]);
      try {
        const res = await fetch(`/api/seats/${encodeURIComponent(eventId)}`, { cache: "no-store" });
        const data: SeatMapResponse = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error();

        const map = new Map<string, SeatInfo>();
        const mine: string[] = [];
        for (const s of data.seats) {
          if (s.status === "AVAILABLE") continue;
          map.set(s.label, { status: s.status, heldByUserId: s.heldByUserId, holdExpiresAt: s.holdExpiresAt });
          if (s.status === "HELD" && s.heldByUserId === userId) mine.push(s.label);
        }
        setSeats(map);
        setSelected(mine);
      } catch {
        if (!cancelled) setLoadError("Não foi possível carregar o mapa de assentos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const socket = getSocket();
    socket.emit("join-event", eventId);

    const handleUpdate = (payload: SeatUpdateEvent) => {
      setSeats((prev) => {
        const next = new Map(prev);
        if (payload.status === "AVAILABLE") next.delete(payload.label);
        else next.set(payload.label, { status: payload.status, heldByUserId: payload.heldByUserId, holdExpiresAt: payload.holdExpiresAt });
        return next;
      });

      setSelected((prev) => {
        if (!prev.includes(payload.label)) return prev;
        const stillMine = payload.status === "HELD" && payload.heldByUserId === userId;
        return stillMine ? prev : prev.filter((l) => l !== payload.label);
      });
    };

    socket.on("seat:update", handleUpdate);

    return () => {
      cancelled = true;
      socket.off("seat:update", handleUpdate);
      socket.emit("leave-event", eventId);

      for (const label of selectedRef.current) {
        fetch(`/api/seats/${encodeURIComponent(eventId)}/release`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${tokenRef.current ?? ""}` },
          body: JSON.stringify({ label }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [eventId, userId]);

  async function toggleSeat(label: string): Promise<void> {
    setActionError(null);
    const isMine = selected.includes(label);

    if (isMine) {
      setSelected((prev) => prev.filter((l) => l !== label));
      setSeats((prev) => { const next = new Map(prev); next.delete(label); return next; });
      try {
        await fetch(`/api/seats/${encodeURIComponent(eventId)}/release`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${accessToken ?? ""}` },
          body: JSON.stringify({ label }),
        });
      } catch {
        // liberação best-effort; a expiração automática cobre o caso de falha
      }
      return;
    }

    const seat = seats.get(label);
    if (seat) return; // ocupado por outra pessoa ou vendido

    if (!accessToken) {
      setActionError("Você precisa estar logado para selecionar um assento.");
      return;
    }
    if (selected.length >= MAX_SEATS) {
      setActionError(`Você pode selecionar até ${MAX_SEATS} assentos por compra.`);
      return;
    }

    setSelected((prev) => [...prev, label]);
    setSeats((prev) => { const next = new Map(prev); next.set(label, { status: "HELD", heldByUserId: userId ?? undefined }); return next; });

    try {
      const res = await fetch(`/api/seats/${encodeURIComponent(eventId)}/hold`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSelected((prev) => prev.filter((l) => l !== label));
        setSeats((prev) => { const next = new Map(prev); next.delete(label); return next; });
        setActionError(typeof data.error === "string" ? data.error : "Não foi possível reservar o assento.");
        return;
      }
      setSeats((prev) => { const next = new Map(prev); next.set(label, { status: "HELD", heldByUserId: userId ?? undefined, holdExpiresAt: data.holdExpiresAt }); return next; });
    } catch {
      setSelected((prev) => prev.filter((l) => l !== label));
      setSeats((prev) => { const next = new Map(prev); next.delete(label); return next; });
      setActionError("Erro de conexão ao reservar o assento.");
    }
  }

  return { seats, selected, loading, loadError, actionError, toggleSeat, maxSeats: MAX_SEATS };
}
