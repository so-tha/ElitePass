"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { ConfirmModal } from "@/components/ConfirmModal";
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
import { redirect } from "next/navigation";

const CATEGORY_OPTIONS = [
  { value: "Shows e Festivais", label: "Shows e Festivais" },
  { value: "Teatro e Espetáculos", label: "Teatro e Espetáculos" },
  { value: "Festas e Baladas", label: "Festas e Baladas" },
  { value: "Cinema e Mostras", label: "Cinema e Mostras" },
  { value: "Cursos e Workshops", label: "Educação e Negócios" },
  { value: "Congressos e Seminários", label: "Congressos e Seminários" },
  { value: "Eventos Corporativos", label: "Eventos Corporativos" },
  { value: "Eventos Esportivos", label: "Esportes e Lazer" },
  { value: "Eventos Gastronômicos", label: "Eventos Gastronômicos" },
  { value: "Passeios e Parques", label: "Passeios e Parques" },
  { value: "Eventos Religiosos", label: "Eventos Religiosos" },
  { value: "Eventos Online", label: "Eventos Online" },
];

function CustomCategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = CATEGORY_OPTIONS.find((opt) => opt.value === value) || CATEGORY_OPTIONS[0];

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        className={styles.formInput}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
          background: "#121215",
          borderColor: isOpen ? "var(--color-primary)" : "rgba(255, 255, 255, 0.1)",
          boxShadow: isOpen ? "0 0 12px var(--color-primary-glow)" : "none",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption.label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 100,
              background: "#121215",
              border: "1px solid rgba(255, 178, 44, 0.3)",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.9)",
              maxHeight: "260px",
              overflowY: "auto",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: isSelected ? "#000000" : "#ffffff",
                    background: isSelected ? "var(--color-primary)" : "transparent",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-primary)";
                      e.currentTarget.style.color = "#000000";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, accessToken, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "eventos" | "novo" | "config">("dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Shows e Festivais");


  const [editingEvent, setEditingEvent] = useState<DashboardEventItem | null>(null);

  const [previewEvent, setPreviewEvent] = useState<DashboardEventItem | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    venue: "",
    city: "",
    date: "",
    capacity: 500,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    async function fetchDashboardData() {
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
    }
    fetchDashboardData();
  }, [authLoading, accessToken]);

  const handleConfirmLogout = () => {
    redirect("/");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (evt: DashboardEventItem) => {
    setEditingEvent(evt);
    setUploadedImage(evt.imageUrl || null);
    setEventForm({
      title: evt.title,
      venue: evt.venue,
      city: evt.city,
      date: evt.date,
      capacity: evt.capacity,
    });
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !editingEvent) return;

    const updatedEvents = data.events.map((item) => {
      if (item.id === editingEvent.id) {
        return {
          ...item,
          title: eventForm.title,
          venue: eventForm.venue,
          city: eventForm.city,
          date: eventForm.date,
          capacity: Number(eventForm.capacity),
          imageUrl: uploadedImage || item.imageUrl,
        };
      }
      return item;
    });

    setData({ ...data, events: updatedEvents });
    setEditingEvent(null);
    setUploadedImage(null);
  };

  const handleToggleStatus = (evtId: string) => {
    if (!data) return;
    const updatedEvents = data.events.map((item) => {
      if (item.id === evtId) {
        return {
          ...item,
          status: (item.status === "ATIVO" ? "AGUARDANDO" : "ATIVO") as "ATIVO" | "AGUARDANDO" | "CANCELADO",
        };
      }
      return item;
    });
    setData({ ...data, events: updatedEvents });
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
              className={`${styles.navItem} ${activeTab === "novo" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("novo")}
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
              {activeTab === "novo" && "Novo Evento"}
              {activeTab === "config" && "Configurações"}
            </h1>
            <p className={styles.pageSubtitle}>
              {activeTab === "dashboard" && "Bem-vindo(a), Maria Silva! Veja sua performance."}
              {activeTab === "eventos" && "Gerencie todos os seus shows e eventos ativos na plataforma."}
              {activeTab === "novo" && "Cadastre um novo evento na plataforma ElitePass."}
              {activeTab === "config" && "Gerencie os dados da sua produtora e preferências."}
            </p>
          </div>

          <button
            type="button"
            className={styles.btnNewEvent}
            onClick={() => {
              setUploadedImage(null);
              setActiveTab("novo");
            }}
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
                  <span className={styles.kpiTrendPositive}>↗ +12% vs. mês anterior</span>
                </div>

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
                        <span className={evt.status === "ATIVO" ? styles.statusActive : styles.statusWaiting}>
                          {evt.status}
                        </span>
                      </div>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label="Editar"
                          onClick={() => handleOpenEdit(evt)}
                        >
                          <EditIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label="Visualizar"
                          onClick={() => setPreviewEvent(evt)}
                        >
                          <EyeIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label="Mais"
                          onClick={() => handleToggleStatus(evt.id)}
                        >
                          <MoreHorizontalIcon size={14} />
                        </button>
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
                      <span className={evt.status === "ATIVO" ? styles.statusActive : styles.statusWaiting}>
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
                    >
                      <EditIcon size={14} /> Editar
                    </button>
                    <button
                      type="button"
                      className={styles.btnCardAction}
                      onClick={() => setPreviewEvent(evt)}
                    >
                      <EyeIcon size={14} /> Ver
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnCardAction} ${styles.btnCardActionPrimary}`}
                      onClick={() => handleToggleStatus(evt.id)}
                    >
                      {evt.status === "ATIVO" ? "Pausar" : "Ativar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "novo" && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Cadastrar Novo Evento</h2>
            <form
              className={styles.formGrid}
              onSubmit={(e) => {
                e.preventDefault();
                alert("Novo evento cadastrado com sucesso!");
                setActiveTab("eventos");
              }}
            >
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Imagem do Evento (Upload do Computador)</label>
                <div className={styles.imageDropzone}>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleImageFileChange}
                  />
                  {uploadedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={uploadedImage} alt="Preview da Imagem" className={styles.uploadPreview} />
                  ) : (
                    <div className={styles.uploadIconText}>
                      <PlusIcon size={24} />
                      <span>Clique ou arraste uma imagem aqui (PNG, JPG, WEBP)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoria do Evento</label>
                <CustomCategorySelect value={selectedCategory} onChange={setSelectedCategory} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subcategoria / Gênero</label>
                <input type="text" className={styles.formInput} placeholder="Ex: Rock, Stand-up Comedy, Pop, IMAX, Gastronomia" required />
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Nome do Evento / Filme</label>
                <input type="text" className={styles.formInput} placeholder="Ex: Show Vintage Culture ou Avatar 3: Fogo e Cinzas" required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Local / Casa de Show</label>
                <input type="text" className={styles.formInput} placeholder="Ex: Allianz Parque" required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cidade / Estado</label>
                <input type="text" className={styles.formInput} placeholder="Ex: São Paulo — SP" required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data e Horário</label>
                <input type="text" className={styles.formInput} placeholder="Ex: 25 DEZ 2026 • 22:00" required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Capacidade Total de Ingressos</label>
                <input type="number" className={styles.formInput} placeholder="Ex: 1000" defaultValue={500} required />
              </div>

              <button type="submit" className={styles.btnSubmitForm}>
                Publicar Evento
              </button>
            </form>
          </div>
        )}

        {activeTab === "config" && (
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>Configurações da Produtora</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome da Empresa / Produtora</label>
                <input type="text" className={styles.formInput} defaultValue="Elite Events & Entertainment" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CNPJ / Registro</label>
                <input type="text" className={styles.formInput} defaultValue="12.345.678/0001-90" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>E-mail Comercial</label>
                <input type="email" className={styles.formInput} defaultValue="contato@eliteevents.com" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Telefone de Suporte</label>
                <input type="text" className={styles.formInput} defaultValue="(11) 98765-4321" />
              </div>
            </div>
            <button
              type="button"
              className={styles.btnSubmitForm}
              onClick={() => alert("Configurações salvas!")}
            >
              Salvar Alterações
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
                <span className={styles.statusActive}>{previewEvent.status}</span>
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
                  <div
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
                        Pista Premium
                      </span>
                      <span style={{ fontSize: "12px", color: "#71717a" }}>Acesso exclusivo próximo ao palco</span>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-primary)" }}>
                      R$ 190,00
                    </span>
                  </div>

                  <div
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
                        Camarote VIP
                      </span>
                      <span style={{ fontSize: "12px", color: "#71717a" }}>Área coberta com open bar</span>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-primary)" }}>
                      R$ 350,00
                    </span>
                  </div>
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

      {/* ── EDIT EVENT MODAL WITH IMAGE UPLOADER ── */}
      {editingEvent && (
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
          onClick={() => setEditingEvent(null)}
        >
          <div
            style={{
              background: "#121215",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
              }}
              onClick={() => setEditingEvent(null)}
            >
              <XIcon size={18} />
            </button>

            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
              Editar Evento: {editingEvent.title}
            </h3>

            <form onSubmit={handleSaveEvent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Imagem do Evento (Upload do Computador)</label>
                <div className={styles.imageDropzone}>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleImageFileChange}
                  />
                  {uploadedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={uploadedImage} alt="Preview da Imagem" className={styles.uploadPreview} />
                  ) : (
                    <div className={styles.uploadIconText}>
                      <PlusIcon size={24} />
                      <span>Subir nova imagem do computador</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Título do Evento</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Local</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cidade</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventForm.city}
                  onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Capacidade de Ingressos</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  className={styles.btnCardAction}
                  onClick={() => setEditingEvent(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnSubmitForm}>
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
