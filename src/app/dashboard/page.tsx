"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EventFormModal, type EditableEvent } from "@/components/EventFormModal";
import { useAuth } from "@/lib/auth-context";
import {
  TicketIcon,
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  AlertTriangleIcon,
} from "@/components/icons";
import type { DashboardData } from "@/app/api/organizer/dashboard/route";

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ORGANIZER") {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/organizer/dashboard", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar dados do dashboard.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados do dashboard.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "ORGANIZER" || !accessToken) return;
    const timer = setTimeout(() => {
      void fetchDashboardData();
    }, 0);

    return () => clearTimeout(timer);
  }, [authLoading, user, accessToken, fetchDashboardData]);

  const handleConfirmLogout = async () => {
    await logout();
    router.push("/");
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormModalOpen(true);
  };

  const openEditModal = async (eventId: string) => {
    if (!accessToken) return;
    setEditLoadingId(eventId);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar evento.");
      setEditingEvent(json.event);
      setFormModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar evento.");
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleCancelEvent = async () => {
    if (!cancelTarget || !accessToken) return;
    try {
      const res = await fetch(`/api/organizer/events/${cancelTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao cancelar evento.");
      fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar evento.");
    }
  };

  if (authLoading || !user || user.role !== "ORGANIZER") {
    return null;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className={styles.root}>
      {/* ── LEFT SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logoRow}>
            <div className={styles.logoBadge}>EP</div>
            <div className={styles.logoMeta}>
              <span className={styles.logoText}>ElitePass</span>
              <span className={styles.logoRole}>Organizador</span>
            </div>
          </Link>

          <nav className={styles.navList}>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "dashboard" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "eventos" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("eventos")}
            >
              <TicketIcon size={18} />
              <span>Meus Eventos</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "novo" ? styles.navItemActive : ""}`}
              onClick={() => {
                setActiveTab("novo");
                openCreateModal();
              }}
            >
              <PlusIcon size={18} />
              <span>Novo Evento</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "vendas" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("vendas")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Vendas</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "relatorios" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("relatorios")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18M18 9l-5 5-4-4-3 3" />
              </svg>
              <span>Relatórios</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "config" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("config")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Configurações</span>
            </button>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.planCard}>
            <span className={styles.planLabel}>Plano Atual</span>
            <div className={styles.planRow}>
              <span className={styles.planTitle}>Profissional</span>
              <button
                type="button"
                className={styles.upgradeBtn}
                onClick={() => alert("Upgrade de plano em breve!")}
              >
                Upgrade →
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={() => setShowLogoutModal(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.mainContent}>
        {/* TOP HEADER */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Bem-vindo(a), {user.name}! Veja sua performance.</p>
          </div>

          <button
            type="button"
            className={styles.btnNewEvent}
            onClick={openCreateModal}
          >
            <PlusIcon size={16} />
            <span>Novo Evento</span>
          </button>
        </header>

        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangleIcon size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: RESUMO (4 KPI METRICS FETCHED FROM API) */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Resumo</h2>

          <div className={styles.kpiGrid}>
            {/* KPI 1 */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiCardHeader}>
                <span>Total de Vendas</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18M18 9l-5 5-4-4-3 3" />
                </svg>
              </div>
              <span className={styles.kpiValue}>
                {loading ? "..." : formatCurrency(data?.totalSales ?? 0)}
              </span>
              <span className={styles.kpiTrendPositive}>↗ +12% vs. mês anterior</span>
            </div>

            {/* KPI 2 */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiCardHeader}>
                <span>Ingressos Vendidos</span>
                <TicketIcon size={16} />
              </div>
              <span className={styles.kpiValue}>
                {loading ? "..." : (data?.ticketsSold ?? 0).toLocaleString("pt-BR")}
              </span>
              <span className={styles.kpiTrendPositive}>↗ +8% vs. mês anterior</span>
            </div>

            {/* KPI 3 */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiCardHeader}>
                <span>Eventos Ativos</span>
                <CalendarIcon size={16} />
              </div>
              <span className={styles.kpiValue}>
                {loading ? "..." : data?.activeEventsCount ?? 0}
              </span>
              <span className={styles.kpiTrendPositive}>↗ +1 vs. mês anterior</span>
            </div>

            {/* KPI 4 */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiCardHeader}>
                <span>Taxa de Conversão</span>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>%</span>
              </div>
              <span className={styles.kpiValue}>
                {loading ? "..." : `${data?.conversionRate ?? 0}%`}
              </span>
              <span className={styles.kpiTrendNegative}>↘ -0,2% vs. mês anterior</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: SEUS EVENTOS */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Seus Eventos</h2>
            <Link href="#todos" className={styles.viewAllLink}>
              Ver todos →
            </Link>
          </div>

          <div className={styles.eventsCard}>
            <div className={styles.tableHeaderRow}>
              <span>Evento</span>
              <span>Ingressos</span>
              <span>Receita</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#a1a1aa" }}>
                Carregando vendas do banco de dados...
              </div>
            ) : data?.events && data.events.length > 0 ? (
              data.events.map((evt) => (
                <div key={evt.id} className={styles.eventRow}>
                  <div className={styles.eventInfoCell}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={evt.imageUrl || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=150&auto=format&fit=crop&q=80"}
                      alt={evt.title}
                      className={styles.eventThumb}
                    />
                    <div className={styles.eventMeta}>
                      <span className={styles.eventName}>{evt.title}</span>
                      <span className={styles.eventSub}>
                        <CalendarIcon size={11} /> {evt.date} &nbsp;|&nbsp; <MapPinIcon size={11} /> {evt.venue} — {evt.city}
                      </span>
                    </div>
                  </div>
                  <span className={styles.ticketsCell}>{evt.soldCount} / {evt.capacity}</span>
                  <span className={styles.revenueCell}>{formatCurrency(evt.revenue)}</span>
                  <div>
                    <span
                      className={
                        evt.status === "ATIVO"
                          ? styles.statusActive
                          : evt.status === "CANCELADO"
                          ? styles.statusCancelled
                          : styles.statusWaiting
                      }
                    >
                      {evt.status}
                    </span>
                  </div>
                  <div className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      aria-label="Editar"
                      disabled={editLoadingId === evt.id}
                      onClick={() => openEditModal(evt.id)}
                    >
                      {editLoadingId === evt.id ? "…" : "✏️"}
                    </button>
                    <button type="button" className={styles.actionBtn} aria-label="Visualizar">👁️</button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      aria-label="Cancelar evento"
                      disabled={evt.status === "CANCELADO"}
                      onClick={() => setCancelTarget({ id: evt.id, title: evt.title })}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px", textAlign: "center", color: "#a1a1aa" }}>
                {error ? "Não foi possível carregar seus eventos." : "Você ainda não criou nenhum evento."}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: ATIVIDADE RECENTE */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Atividade Recente</h2>

          <div className={styles.activityList}>
            {loading ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#a1a1aa" }}>
                Carregando atividades de vendas...
              </div>
            ) : data?.recentActivities && data.recentActivities.length > 0 ? (
              data.recentActivities.map((act) => (
                <div key={act.id} className={styles.activityItem}>
                  <div className={styles.activityLeft}>
                    <div className={styles.activityIcon}>⚡</div>
                    <div className={styles.activityDetails}>
                      <span className={styles.activityTitle}>{act.title}</span>
                      <span className={styles.activitySub}>{act.sub}</span>
                    </div>
                  </div>
                  <span className={styles.activityTime}>{act.time}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: "24px", textAlign: "center", color: "#a1a1aa" }}>
                {error ? "Não foi possível carregar as atividades recentes." : "Nenhuma atividade recente ainda."}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* IN-APP CONFIRMATION POPUP FOR LOGOUT */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Sair do Painel"
        description="Deseja realmente encerrar a sessão do painel do organizador?"
        confirmText="Sair"
        cancelText="Cancelar"
        variant="danger"
      />

      <EventFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSaved={fetchDashboardData}
        event={editingEvent}
      />

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelEvent}
        title="Cancelar Evento"
        description={`Tem certeza que deseja cancelar "${cancelTarget?.title}"? Ingressos já vendidos não serão afetados, mas o evento deixará de aparecer para novos compradores.`}
        confirmText="Cancelar evento"
        cancelText="Voltar"
        variant="danger"
      />
    </div>
  );
}
