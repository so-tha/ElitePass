"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/ticketmaster";
import {
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
} from "@/components/icons";
import type { OrderItem, OrderTicketItem } from "@/app/api/orders/mine/route";
import type { CancelTicketResponse } from "@/app/api/tickets/[id]/cancel/route";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&auto=format&fit=crop&q=80";

interface TicketItem {
  id: string;
  orderId: string;
  code: string;
  qrData: string;
  eventName: string;
  eventDate: string | null;
  venue: string;
  tierLabel: string;
  status: OrderTicketItem["status"];
  orderStatus: OrderItem["status"];
  imageUrl: string;
}

/** Espelha (no cliente) as regras de elegibilidade que o backend valida de forma autoritativa. */
function isCancellable(tkt: TicketItem): boolean {
  if (tkt.status !== "VALID" || tkt.orderStatus === "CANCELLED") return false;
  if (!tkt.eventDate) return true;

  const eventDay = new Date(tkt.eventDate);
  if (Number.isNaN(eventDay.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDay.getTime() >= today.getTime();
}

function flattenOrders(orders: OrderItem[]): TicketItem[] {
  return orders.flatMap((order) =>
    order.tickets.map((ticket) => ({
      id: ticket.id,
      orderId: order.id,
      code: ticket.code,
      qrData: ticket.qrData,
      eventName: order.eventName,
      eventDate: order.eventDate,
      venue: order.eventVenue ?? "Local a confirmar",
      tierLabel: order.tierLabel,
      status: ticket.status,
      orderStatus: order.status,
      imageUrl: order.event?.imageUrl ?? FALLBACK_IMAGE,
    }))
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [activeMainTab, setActiveMainTab] = useState<"ingressos">("ingressos");
  const [statusFilter, setStatusFilter] = useState<"ativos" | "pendentes" | "cancelados" | "encerrados">("ativos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQrTicket, setSelectedQrTicket] = useState<TicketItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TicketItem | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || !accessToken) return;

    let cancelled = false;

    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/orders/mine", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar seus ingressos.");
        if (!cancelled) setTickets(flattenOrders(data.orders ?? []));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar seus ingressos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, accessToken]);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleConfirmCancel() {
    if (!cancelTarget || !accessToken) return;
    const ticketId = cancelTarget.id;

    setPendingCancelId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data: CancelTicketResponse = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Não foi possível cancelar o ingresso. Tente novamente.");
        return;
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "CANCELLED" } : t))
      );
      showToast(
        data.refunded
          ? "Ingresso cancelado e pagamento estornado com sucesso."
          : "Ingresso cancelado com sucesso."
      );
    } catch {
      alert("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setPendingCancelId(null);
    }
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((tkt) => {
      if (statusFilter === "ativos" && (tkt.status !== "VALID" || tkt.orderStatus === "CANCELLED")) return false;
      if (statusFilter === "encerrados" && tkt.status !== "USED") return false;
      if (statusFilter === "cancelados" && tkt.status !== "CANCELLED" && tkt.orderStatus !== "CANCELLED") return false;
      if (statusFilter === "pendentes" && tkt.orderStatus !== "PENDING") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tkt.eventName.toLowerCase().includes(q) ||
          tkt.code.toLowerCase().includes(q) ||
          tkt.venue.toLowerCase().includes(q) ||
          tkt.tierLabel.toLowerCase().includes(q) ||
          tkt.orderId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, statusFilter, searchQuery]);

  if (authLoading || !user) {
    return null;
  }

  const statusBadge = (status: OrderTicketItem["status"]) => {
    if (status === "VALID") return { className: styles.statusBadgeValid, label: "VÁLIDO" };
    if (status === "CANCELLED") return { className: styles.statusBadgeCancelled, label: "CANCELADO" };
    return { className: styles.statusBadgeUsed, label: "ENCERRADO" };
  };

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        {/* ── HEADER ROW WITH TITLE AND SEARCH BOX ── */}
        <div className={styles.headerRow}>
          <h1 className={styles.pageTitle}>Ingressos</h1>

          <div className={styles.searchBox}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por evento, local, setor ou nº do pedido"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ── MAIN TABS: INGRESSOS / PRODUTOS ── */}
        <div className={styles.mainTabs}>
          <button
            type="button"
            className={`${styles.mainTabBtn} ${activeMainTab === "ingressos" ? styles.mainTabActive : ""}`}
            onClick={() => setActiveMainTab("ingressos")}
          >
            Ingressos
          </button>
        </div>

        {/* ── FILTER CHIPS ── */}
        <div className={styles.filterRow}>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === "ativos" ? styles.filterChipActive : ""}`}
            onClick={() => setStatusFilter("ativos")}
          >
            Ativos
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === "pendentes" ? styles.filterChipActive : ""}`}
            onClick={() => setStatusFilter("pendentes")}
          >
            Pendentes
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === "cancelados" ? styles.filterChipActive : ""}`}
            onClick={() => setStatusFilter("cancelados")}
          >
            Cancelados
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${statusFilter === "encerrados" ? styles.filterChipActive : ""}`}
            onClick={() => setStatusFilter("encerrados")}
          >
            Encerrados
          </button>
        </div>

        {/* ── TICKETS GRID / EMPTY STATE ── */}
        {activeMainTab === "ingressos" ? (
          error ? (
            <div className={styles.emptyState}>
              <AlertTriangleIcon size={36} />
              <h3 className={styles.emptyTitle}>Não foi possível carregar seus ingressos</h3>
              <p className={styles.emptyDesc}>{error}</p>
            </div>
          ) : loading ? (
            <div className={styles.emptyState}>
              <TicketIcon size={36} />
              <h3 className={styles.emptyTitle}>Carregando seus ingressos...</h3>
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className={styles.ticketsGrid}>
              {filteredTickets.map((tkt) => {
                const badge = statusBadge(tkt.status);
                return (
                  <div key={tkt.id} className={styles.ticketCard}>
                    <div className={styles.cardBanner}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tkt.imageUrl} alt={tkt.eventName} className={styles.cardImage} />
                      <span className={badge.className}>{badge.label}</span>
                    </div>

                    <div className={styles.cardBody}>
                      <h3 className={styles.ticketTitle}>{tkt.eventName}</h3>

                      <div className={styles.metaList}>
                        <div className={styles.metaItem}>
                          <CalendarIcon size={14} />
                          <span>{tkt.eventDate ? formatDate(tkt.eventDate) : "Data a confirmar"}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <MapPinIcon size={14} />
                          <span>{tkt.venue}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <TicketIcon size={14} />
                          <span>Setor: <strong>{tkt.tierLabel}</strong></span>
                        </div>
                      </div>

                      <div className={styles.cardFooter}>
                        <span className={styles.ticketCode}>{tkt.code}</span>
                        <div className={styles.cardActions}>
                          {isCancellable(tkt) && (
                            <button
                              type="button"
                              className={styles.btnCancelTicket}
                              disabled={pendingCancelId === tkt.id}
                              onClick={() => setCancelTarget(tkt)}
                            >
                              {pendingCancelId === tkt.id ? "Cancelando..." : "Cancelar"}
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.btnQrCode}
                            onClick={() => setSelectedQrTicket(tkt)}
                          >
                            <TicketIcon size={14} />
                            <span>Ver QR Code</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <TicketIcon size={36} />
              <h3 className={styles.emptyTitle}>Nenhum ingresso encontrado</h3>
              <p className={styles.emptyDesc}>
                Não encontramos ingressos na categoria selecionada. Garanta seus ingressos para os melhores shows e cinemas.
              </p>
              <Link href="/#shows" className={styles.btnExplore}>
                Explorar Eventos
              </Link>
            </div>
          )
        ) : (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>Nenhum produto cadastrado</h3>
            <p className={styles.emptyDesc}>
              Você não possui produtos ou adicionais de conveniência associados.
            </p>
          </div>
        )}
      </main>

      {/* ── QR CODE POPUP MODAL ── */}
      {selectedQrTicket && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedQrTicket(null)}
        >
          <div
            style={{
              background: "#121215",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "380px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              position: "relative",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
              }}
              onClick={() => setSelectedQrTicket(null)}
            >
              <XIcon size={18} />
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
              {selectedQrTicket.eventName}
            </h3>
            <p style={{ fontSize: "13px", color: "#a1a1aa" }}>{selectedQrTicket.tierLabel}</p>

            {/* QR CODE BOX */}
            <div
              style={{
                background: "#ffffff",
                padding: "16px",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  selectedQrTicket.qrData
                )}`}
                alt="QR Code do Ingresso"
                style={{ width: "180px", height: "180px", display: "block" }}
              />
            </div>

            <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#71717a" }}>
              {selectedQrTicket.code}
            </span>

            <p style={{ fontSize: "12px", color: "#71717a" }}>
              Apresente este QR Code na portaria do evento para acesso nominal.
            </p>
          </div>
        </div>
      )}

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancelar Ingresso"
        description={`Deseja realmente cancelar o ingresso de "${cancelTarget?.eventName}"? O valor pago será estornado e a vaga será devolvida ao estoque. Essa ação não pode ser desfeita.`}
        confirmText="Cancelar ingresso"
        cancelText="Voltar"
        variant="danger"
      />

      {/* ── SUCCESS TOAST ── */}
      {toastMessage && (
        <div className={styles.toastSuccess}>
          <CheckIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
