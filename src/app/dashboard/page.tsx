"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EventFormModal, type EditableEvent } from "@/components/EventFormModal";
import {
  TicketIcon,
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  GridIcon,
  EditIcon,
  EyeIcon,
  MoreHorizontalIcon,
  ZapIcon,
  LogOutIcon,
  XIcon,
} from "@/components/icons";
import type { DashboardData, DashboardEventItem } from "@/app/api/organizer/dashboard/route";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, accessToken, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "eventos" | "config">("dashboard");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleConfirmLogout = async () => {
    await logout();
    router.push("/");
  };


  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DashboardEventItem | null>(null);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);

  const [previewEvent, setPreviewEvent] = useState<DashboardEventItem | null>(null);
  const [previewTiers, setPreviewTiers] = useState<{ id: string; label: string; priceUnit: number; capacity: number }[] | null>(null);
  const [previewTiersLoading, setPreviewTiersLoading] = useState(false);

  const [orgForm, setOrgForm] = useState({ companyName: "", companyCnpj: "", companyEmail: "", companyPhone: "" });
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);

  useEffect(() => {
    (() => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "eventos" || tabParam === "dashboard" || tabParam === "config") {
        setActiveTab(tabParam);
      } else if (tabParam === "novo") {
        setIsCreateOpen(true);
      }
    })();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await fetch("/api/organizer/dashboard", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    (async () => { await fetchDashboardData(); })();
  }, [authLoading, accessToken, fetchDashboardData]);

  useEffect(() => {
    if (activeTab !== "config" || orgLoaded || !accessToken) return;

    async function fetchOrganization() {
      try {
        const res = await fetch("/api/account", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const { user } = await res.json();
          setOrgForm({
            companyName: user.companyName ?? "",
            companyCnpj: user.companyCnpj ?? "",
            companyEmail: user.companyEmail ?? "",
            companyPhone: user.companyPhone ?? "",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dados da produtora:", err);
      } finally {
        setOrgLoaded(true);
      }
    }
    fetchOrganization();
  }, [activeTab, orgLoaded, accessToken]);

  const handleSaveOrganization = async () => {
    if (!accessToken) return;
    setOrgSaving(true);
    try {
      const res = await fetch("/api/account/organization", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orgForm),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = typeof json.error === "string" ? json.error : "Verifique os dados informados.";
        alert(msg);
        return;
      }
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar dados da produtora:", err);
      alert("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setOrgSaving(false);
    }
  };

  const renderPctTrend = (pct: number) => {
    const rounded = Math.abs(pct).toFixed(1).replace(".", ",");
    if (pct > 0) return <span className={styles.kpiTrendPositive}>↗ +{rounded}% vs. mês anterior</span>;
    if (pct < 0) return <span className={styles.kpiTrendNegative}>↘ -{rounded}% vs. mês anterior</span>;
    return <span className={styles.kpiTrendNeutral}>→ 0% vs. mês anterior</span>;
  };

  const renderDeltaTrend = (delta: number) => {
    if (delta > 0) return <span className={styles.kpiTrendPositive}>↗ +{delta} vs. mês anterior</span>;
    if (delta < 0) return <span className={styles.kpiTrendNegative}>↘ {delta} vs. mês anterior</span>;
    return <span className={styles.kpiTrendNeutral}>→ 0 vs. mês anterior</span>;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleOpenEdit = async (evt: DashboardEventItem) => {
    if (!accessToken) return;
    setEditLoadingId(evt.id);
    try {
      const res = await fetch(`/api/organizer/events/${evt.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (!res.ok || !json.event) {
        alert("Não foi possível carregar os dados do evento. Tente novamente.");
        return;
      }
      const event = json.event;
      setEditingEvent({
        id: event.id,
        title: event.title,
        description: event.description ?? null,
        category: event.category,
        type: event.type,
        imageUrl: event.imageUrl ?? null,
        venue: event.venue,
        city: event.city,
        date: event.date,
        capacity: event.capacity,
        tiers: event.tiers ?? [],
      });
    } catch (err) {
      console.error("Erro ao carregar evento para edição:", err);
      alert("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleEventSaved = () => {
    fetchDashboardData();
  };

  const handleOpenPreview = async (evt: DashboardEventItem) => {
    setPreviewEvent(evt);
    setPreviewTiers(null);
    if (!accessToken) return;
    setPreviewTiersLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${evt.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (res.ok && json.event) {
        setPreviewTiers(json.event.tiers ?? []);
      }
    } catch (err) {
      console.error("Erro ao carregar setores do evento:", err);
    } finally {
      setPreviewTiersLoading(false);
    }
  };

  const getStatusClass = (status: DashboardEventItem["status"]) => {
    if (status === "ATIVO") return styles.statusActive;
    if (status === "CANCELADO") return styles.statusCancelled;
    return styles.statusWaiting;
  };

  const handleToggleStatus = async (evtId: string) => {
    if (!data || !accessToken) return;
    const target = data.events.find((item) => item.id === evtId);
    if (!target || target.status === "CANCELADO") return;

    const nextStatus = target.status === "ATIVO" ? "PAUSED" : "PUBLISHED";

    setPendingEventId(evtId);
    try {
      const res = await fetch(`/api/organizer/events/${evtId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        alert("Não foi possível atualizar o status do evento. Tente novamente.");
        return;
      }

      const updatedEvents = data.events.map((item) =>
        item.id === evtId
          ? { ...item, status: (nextStatus === "PUBLISHED" ? "ATIVO" : "PAUSADO") as DashboardEventItem["status"] }
          : item
      );
      setData({ ...data, events: updatedEvents });
    } catch (err) {
      console.error("Erro ao atualizar status do evento:", err);
      alert("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setPendingEventId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!data || !accessToken || !cancelTarget) return;
    const evtId = cancelTarget.id;

    setPendingEventId(evtId);
    try {
      const res = await fetch(`/api/organizer/events/${evtId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        alert("Não foi possível cancelar o evento. Tente novamente.");
        return;
      }

      const updatedEvents = data.events.map((item) =>
        item.id === evtId ? { ...item, status: "CANCELADO" as DashboardEventItem["status"] } : item
      );
      setData({ ...data, events: updatedEvents });
    } catch (err) {
      console.error("Erro ao cancelar evento:", err);
      alert("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setPendingEventId(null);
      setCancelTarget(null);
    }
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
              <GridIcon size={18} />
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
              className={styles.navItem}
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon size={18} />
              <span>Novo Evento</span>
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
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOutIcon size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.mainContent}>
        {/* TOP HEADER */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "eventos" && "Meus Eventos"}
              {activeTab === "config" && "Configurações"}
            </h1>
            <p className={styles.pageSubtitle}>
              {activeTab === "dashboard" && `Bem-vindo(a), ${user?.name ?? "Organizador(a)"}! Veja sua performance.`}
              {activeTab === "eventos" && "Gerencie todos os seus shows e eventos ativos na plataforma."}
              {activeTab === "config" && "Gerencie os dados da sua produtora e preferências."}
            </p>
          </div>

          <button
            type="button"
            className={styles.btnNewEvent}
            onClick={() => setIsCreateOpen(true)}
          >
            <PlusIcon size={16} />
            <span>Novo Evento</span>
          </button>
        </header>

        {activeTab === "dashboard" && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Resumo</h2>

              <div className={styles.kpiGrid}>
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
                  {loading ? null : renderPctTrend(data?.salesTrendPct ?? 0)}
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiCardHeader}>
                    <span>Ingressos Vendidos</span>
                    <TicketIcon size={16} />
                  </div>
                  <span className={styles.kpiValue}>
                    {loading ? "..." : (data?.ticketsSold ?? 0).toLocaleString("pt-BR")}
                  </span>
                  {loading ? null : renderPctTrend(data?.ticketsTrendPct ?? 0)}
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiCardHeader}>
                    <span>Eventos Ativos</span>
                    <CalendarIcon size={16} />
                  </div>
                  <span className={styles.kpiValue}>
                    {loading ? "..." : data?.activeEventsCount ?? 0}
                  </span>
                  {loading ? null : renderDeltaTrend(data?.eventsTrendDelta ?? 0)}
                </div>

                <div className={styles.kpiCard}>
                  <div className={styles.kpiCardHeader}>
                    <span>Ticket Médio</span>
                    <TicketIcon size={16} />
                  </div>
                  <span className={styles.kpiValue}>
                    {loading ? "..." : formatCurrency(data?.avgTicketPrice ?? 0)}
                  </span>
                  <span className={styles.kpiTrendNeutral}>Valor médio por ingresso vendido</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Seus Eventos</h2>
                <button
                  type="button"
                  className={styles.viewAllLink}
                  onClick={() => setActiveTab("eventos")}
                >
                  Ver todos →
                </button>
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
                        <span className={getStatusClass(evt.status)}>
                          {evt.status}
                        </span>
                      </div>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label="Editar"
                          onClick={() => handleOpenEdit(evt)}
                          disabled={editLoadingId === evt.id}
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label="Visualizar"
                          onClick={() => handleOpenPreview(evt)}
                        >
                          <EyeIcon size={14} />
                        </button>
                        {evt.status !== "CANCELADO" && (
                          <button
                            type="button"
                            className={styles.actionBtn}
                            aria-label={evt.status === "ATIVO" ? "Pausar evento" : "Ativar evento"}
                            title={evt.status === "ATIVO" ? "Pausar evento" : "Ativar evento"}
                            onClick={() => handleToggleStatus(evt.id)}
                            disabled={pendingEventId === evt.id}
                          >
                            <MoreHorizontalIcon size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "32px", textAlign: "center", color: "#a1a1aa" }}>
                    Nenhum evento registrado no banco de dados.
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
                    Carregando atividades...
                  </div>
                ) : data?.recentActivities && data.recentActivities.length > 0 ? (
                  data.recentActivities.map((act) => (
                    <div key={act.id} className={styles.activityItem}>
                      <div className={styles.activityLeft}>
                        <div className={styles.activityIcon}>
                          <ZapIcon size={16} />
                        </div>
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
                    Nenhuma atividade recente.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
        {activeTab === "eventos" && (
          <section className={styles.section}>
            <div className={styles.eventsGrid}>
              {data?.events.map((evt) => (
                <div key={evt.id} className={styles.eventCard}>
                  <div className={styles.cardBanner}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={evt.imageUrl || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=500&auto=format&fit=crop&q=80"}
                      alt={evt.title}
                      className={styles.cardImage}
                    />
                    <div className={styles.cardStatus}>
                      <span className={getStatusClass(evt.status)}>
                        {evt.status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{evt.title}</h3>

                    <div className={styles.cardMeta}>
                      <div className={styles.cardMetaRow}>
                        <CalendarIcon size={14} />
                        <span>{evt.date}</span>
                      </div>
                      <div className={styles.cardMetaRow}>
                        <MapPinIcon size={14} />
                        <span>{evt.venue} — {evt.city}</span>
                      </div>
                    </div>

                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span>Ingressos vendidos</span>
                        <span><strong>{evt.soldCount}</strong> / {evt.capacity}</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${Math.min(100, Math.round((evt.soldCount / evt.capacity) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardFooterActions}>
                    <button
                      type="button"
                      className={styles.btnCardAction}
                      onClick={() => handleOpenEdit(evt)}
                      disabled={editLoadingId === evt.id}
                    >
                      <EditIcon size={14} /> {editLoadingId === evt.id ? "Carregando..." : "Editar"}
                    </button>
                    <button
                      type="button"
                      className={styles.btnCardAction}
                      onClick={() => handleOpenPreview(evt)}
                    >
                      <EyeIcon size={14} /> Ver
                    </button>
                    {evt.status === "CANCELADO" ? (
                      <span className={styles.statusCancelled} style={{ marginLeft: "auto" }}>
                        Evento Cancelado
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`${styles.btnCardAction} ${styles.btnCardActionPrimary}`}
                          onClick={() => handleToggleStatus(evt.id)}
                          disabled={pendingEventId === evt.id}
                        >
                          {evt.status === "ATIVO" ? "Pausar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          className={`${styles.btnCardAction} ${styles.btnCardActionDanger}`}
                          onClick={() => setCancelTarget(evt)}
                          disabled={pendingEventId === evt.id}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {activeTab === "config" && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Configurações da Produtora</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome da Empresa / Produtora</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={orgForm.companyName}
                  onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })}
                  placeholder="Ex: Elite Events & Entertainment"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CNPJ / Registro</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={orgForm.companyCnpj}
                  onChange={(e) => setOrgForm({ ...orgForm, companyCnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>E-mail Comercial</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={orgForm.companyEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, companyEmail: e.target.value })}
                  placeholder="contato@suaempresa.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Telefone de Suporte</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={orgForm.companyPhone}
                  onChange={(e) => setOrgForm({ ...orgForm, companyPhone: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>
            <button
              type="button"
              className={styles.btnSubmitForm}
              onClick={handleSaveOrganization}
              disabled={orgSaving}
            >
              {orgSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        )}
      </main>

      {previewEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setPreviewEvent(null)}
        >
          <div
            style={{
              background: "#121215",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "20px",
              maxWidth: "560px",
              width: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 10,
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() => setPreviewEvent(null)}
            >
              <XIcon size={18} />
            </button>

            {/* COVER IMAGE */}
            <div style={{ height: "240px", position: "relative", background: "#1a1a1e" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewEvent.imageUrl || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop&q=80"}
                alt={previewEvent.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, #121215 0%, transparent 80%)",
                }}
              />
              <div style={{ position: "absolute", bottom: "16px", left: "20px" }}>
                <span className={getStatusClass(previewEvent.status)}>{previewEvent.status}</span>
              </div>
            </div>

            {/* CONTENT DETAILS */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>
                  {previewEvent.title}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "13px", color: "#a1a1aa" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CalendarIcon size={14} />
                    <span>{previewEvent.date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPinIcon size={14} />
                    <span>{previewEvent.venue} — {previewEvent.city}</span>
                  </div>
                </div>
              </div>

              {/* SALES METRICS SUMMARY */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                  textAlign: "center",
                }}
              >
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "#71717a", textTransform: "uppercase" }}>
                    Vendidos
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
                    {previewEvent.soldCount} / {previewEvent.capacity}
                  </span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "#71717a", textTransform: "uppercase" }}>
                    Ocupação
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
                    {Math.min(100, Math.round((previewEvent.soldCount / previewEvent.capacity) * 100))}%
                  </span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "#71717a", textTransform: "uppercase" }}>
                    Receita
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
                    {formatCurrency(previewEvent.revenue)}
                  </span>
                </div>
              </div>

              {/* SECTORS / TIERS */}
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
                  Setores Disponíveis para Compra
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {previewTiersLoading ? (
                    <span style={{ fontSize: "13px", color: "#71717a" }}>Carregando setores...</span>
                  ) : previewTiers && previewTiers.length > 0 ? (
                    previewTiers.map((tier) => (
                      <div
                        key={tier.id}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <span style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
                            {tier.label}
                          </span>
                          <span style={{ fontSize: "12px", color: "#71717a" }}>{tier.capacity} ingressos disponíveis</span>
                        </div>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-primary)" }}>
                          {formatCurrency(tier.priceUnit)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "13px", color: "#71717a" }}>Nenhum setor cadastrado.</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className={styles.btnCardAction}
                  onClick={() => setPreviewEvent(null)}
                >
                  Fechar Visualização
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE EVENT MODAL (persiste no banco via API) ── */}
      <EventFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => {
          fetchDashboardData();
          setActiveTab("eventos");
        }}
        event={null}
      />

      {/* ── EDIT EVENT MODAL (persiste no banco via API) ── */}
      <EventFormModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSaved={handleEventSaved}
        event={editingEvent}
      />

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

      {/* IN-APP CONFIRMATION POPUP FOR EVENT CANCELLATION */}
      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancelar Evento"
        description={`Deseja realmente cancelar "${cancelTarget?.title}"? O evento continuará visível, mas ficará indisponível para compra de ingressos. Essa ação não pode ser desfeita.`}
        confirmText="Cancelar Evento"
        cancelText="Voltar"
        variant="danger"
      />
    </div>
  );
}
