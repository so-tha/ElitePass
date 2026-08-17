"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import {
  TMEvent,
  getBestImage,
  formatDate,
  getArtistName,
  getVenue,
  getCategory,
  generateMockPrices,
} from "@/lib/ticketmaster";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatTime(localTime?: string): string {
  if (!localTime) return "";
  const [h, m] = localTime.split(":");
  return `${h}:${m}`;
}

// ─── ticket tier types ───────────────────────────────────────────────────────

interface TicketTier {
  id: string;
  label: string;
  description: string;
  price: number;
  currency: string;
  available: boolean;
  hasPrices: boolean; // false = API didn't return priceRanges
  perks: string[];
}

/**
 * Constrói as faixas de ingressos a partir do evento.
 *
 * Quando a Ticketmaster não retorna `priceRanges` (removido em mar/2025),
 * usamos `generateMockPrices` para criar preços simulados realistas e
 * determinísticos — ideais para simulação de compra em ambiente de portfólio.
 */
function buildTiers(event: TMEvent): TicketTier[] {
  const ranges = event.priceRanges ?? [];
  const hasPrices = ranges.length > 0;

  if (!hasPrices) {
    // Preços simulados determinísticos baseados na categoria do evento
    const mock = generateMockPrices(event);
    return [
      {
        id: "pista",
        label: "Pista",
        description: "Área geral com acesso ao palco principal",
        price: mock.min,
        currency: mock.currency,
        available: true,
        hasPrices: false, // sinaliza: preço é simulado
        perks: ["Acesso à área geral", "Bar e alimentação"],
      },
      {
        id: "pista-premium",
        label: "Pista Premium",
        description: "Área frontal com visão privilegiada",
        price: mock.mid,
        currency: mock.currency,
        available: true,
        hasPrices: false,
        perks: ["Acesso à área premium", "Área exclusiva", "Bar premium"],
      },
      {
        id: "vip",
        label: "VIP",
        description: "Experiência completa com lounges exclusivos",
        price: mock.max,
        currency: mock.currency,
        available: true,
        hasPrices: false,
        perks: ["Acesso VIP e camarotes", "Open bar premium", "Meet & Greet*", "Brinde exclusivo"],
      },
    ];
  }

  const currency = ranges[0].currency;
  const min = ranges[0].min;
  const max = ranges[ranges.length - 1].max ?? min * 2.5;

  const tiers: TicketTier[] = [
    {
      id: "pista",
      label: "Pista",
      description: "Área geral com acesso ao palco principal",
      price: min,
      currency,
      available: true,
      hasPrices: true,
      perks: ["Acesso à área geral", "Bar e alimentação"],
    },
  ];

  if (max > min) {
    const mid = Math.round(((min + max) / 2) * 100) / 100;
    tiers.push({
      id: "pista-premium",
      label: "Pista Premium",
      description: "Área frontal com visão privilegiada",
      price: mid,
      currency,
      available: true,
      hasPrices: true,
      perks: ["Acesso à área premium", "Área exclusiva", "Bar premium"],
    });

    tiers.push({
      id: "vip",
      label: "VIP",
      description: "Experiência completa com lounges exclusivos",
      price: max,
      currency,
      available: true,
      hasPrices: true,
      perks: ["Acesso VIP e camarotes", "Open bar premium", "Meet & Greet*", "Brinde exclusivo"],
    });
  }

  return tiers;
}

/** True quando os preços exibidos são simulados (não vieram da API) */
function arePricesMocked(tiers: TicketTier[]): boolean {
  return tiers.length > 0 && tiers.every((t) => !t.hasPrices);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className={styles.skeletonPage}>
      <div className={`${styles.skeletonHero} ${styles.shimmer}`} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonBlock} ${styles.shimmer}`} />
        <div className={`${styles.skeletonBlock} ${styles.shimmer}`} style={{ height: 220 }} />
      </div>
    </div>
  );
}

interface StepBadgeProps {
  step: number;
  current: number;
  label: string;
}
function StepBadge({ step, current, label }: StepBadgeProps) {
  const done = current > step;
  const active = current === step;
  return (
    <div className={`${styles.stepBadge} ${active ? styles.stepActive : ""} ${done ? styles.stepDone : ""}`}>
      <span className={styles.stepNumber}>{done ? "✓" : step}</span>
      <span className={styles.stepLabel}>{label}</span>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<TMEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // purchase state
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState(1); // 1=select, 2=checkout, 3=success
  const [menuOpen, setMenuOpen] = useState(false);
  const [mockPrices, setMockPrices] = useState(false);

  // checkout form
  const [form, setForm] = useState({ name: "", email: "", cpf: "", card: "", expiry: "", cvv: "" });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});
  const [processing, setProcessing] = useState(false);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Evento não encontrado.");
      const ev: TMEvent = data.event;
      setEvent(ev);
      const t = buildTiers(ev);
      setTiers(t);
      setSelectedTier(t[0]);
      setMockPrices(arePricesMocked(t));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar evento.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  // form helpers
  const handleField = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (formErrors[field]) setFormErrors((e) => ({ ...e, [field]: "" }));
  };

  const maskCPF = (v: string) =>
    v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);

  const maskCard = (v: string) =>
    v.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);

  const maskExpiry = (v: string) =>
    v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = "Nome obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "E-mail inválido";
    if (form.cpf.replace(/\D/g, "").length < 11) errs.cpf = "CPF inválido";
    if (form.card.replace(/\D/g, "").length < 16) errs.card = "Número do cartão inválido";
    if (form.expiry.length < 5) errs.expiry = "Validade inválida";
    if (form.cvv.length < 3) errs.cvv = "CVV inválido";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePurchase = async () => {
    if (!validate()) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2200));
    setProcessing(false);
    setStep(3);
  };

  const total = selectedTier ? selectedTier.price * qty : 0;
  const fee = total * 0.12;
  const grandTotal = total + fee;

  if (loading) return <Skeleton />;

  if (error || !event) {
    return (
      <div className={styles.errorPage}>
        <p className={styles.errorIcon}>⚠️</p>
        <h2>Evento não encontrado</h2>
        <p>{error}</p>
        <button className={styles.btnBack} onClick={() => router.push("/")}>
          ← Voltar ao início
        </button>
      </div>
    );
  }

  const heroImg = getBestImage(event.images);
  const artist = getArtistName(event);
  const venue = getVenue(event);
  const category = getCategory(event);
  const dateStr = formatDate(event.dates.start.localDate);
  const timeStr = formatTime(event.dates.start.localTime);

  return (
    <div className={styles.root}>
      {/* ── NAVBAR ── */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logo} id="logo-home">
            <span className={styles.logoText}>ElitePass</span>
          </a>

          <nav className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ""}`}>
            <a href="/#shows" className={styles.navLink} id="nav-shows">Shows</a>
            <a href="/#festivais" className={styles.navLink} id="nav-festivais">Festivais</a>
            <a href="/#esportes" className={styles.navLink} id="nav-esportes">Esportes</a>
            <a href="/#teatro" className={styles.navLink} id="nav-teatro">Teatro</a>
          </nav>

          <a href="#auth" className={styles.btnAuth} id="btn-entrar">Entrar / Cadastrar</a>

          <button
            className={styles.menuToggle}
            id="btn-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* ── BACK ── */}
        <button className={styles.backBtn} id="btn-voltar" onClick={() => router.push("/")}>
          <span className={styles.backArrow}>←</span> Todos os eventos
        </button>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroBg} style={{ backgroundImage: `url(${heroImg})` }} />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>{category}</span>
            <p className={styles.heroArtist}>{artist}</p>
            <h1 className={styles.heroTitle}>{event.name}</h1>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaItem}>
                <span className={styles.metaIcon}>📅</span>
                {dateStr}{timeStr && ` · ${timeStr}`}
              </span>
              <span className={styles.heroMetaItem}>
                <span className={styles.metaIcon}>📍</span>
                {venue}
              </span>
            </div>
          </div>
        </section>

        {/* ── STEPS ── */}
        {step < 3 && (
          <div className={styles.stepper}>
            <StepBadge step={1} current={step} label="Ingressos" />
            <div className={`${styles.stepLine} ${step > 1 ? styles.stepLineDone : ""}`} />
            <StepBadge step={2} current={step} label="Pagamento" />
            <div className={styles.stepLine} />
            <StepBadge step={3} current={step} label="Confirmação" />
          </div>
        )}

        {/* ── STEP 1 — TICKET SELECTION ── */}
        {step === 1 && (
          <div className={styles.layout}>
            <section className={styles.tiersSection}>
              <h2 className={styles.sectionTitle}>Escolha seu ingresso</h2>

              <div className={styles.tiersList}>
                {tiers.map((tier) => (
                  <button
                    key={tier.id}
                    id={`tier-${tier.id}`}
                    className={`${styles.tierCard} ${selectedTier?.id === tier.id ? styles.tierSelected : ""} ${!tier.available ? styles.tierUnavailable : ""}`}
                    onClick={() => tier.available && setSelectedTier(tier)}
                    disabled={!tier.available}
                  >
                    <div className={styles.tierHeader}>
                      <div>
                        <p className={styles.tierLabel}>{tier.label}</p>
                        <p className={styles.tierDesc}>{tier.description}</p>
                      </div>
                      <div className={styles.tierPriceBlock}>
                        <p className={styles.tierPrice}>
                          {!tier.hasPrices && <span className={styles.tierPriceTilde}>~</span>}
                          {formatCurrency(tier.price, tier.currency)}
                        </p>
                        <p className={styles.tierPerPerson}>
                          {tier.hasPrices ? "por pessoa" : "estimado"}
                        </p>
                      </div>
                    </div>

                    <ul className={styles.tierPerks}>
                      {tier.perks.map((perk) => (
                        <li key={perk} className={styles.tierPerk}>
                          <span className={styles.checkIcon}>✓</span> {perk}
                        </li>
                      ))}
                    </ul>

                    {!tier.available && (
                      <span className={styles.soldOutBadge}>Esgotado</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <aside className={styles.summary}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Resumo do pedido</h3>

                {/* qty */}
                <div className={styles.qtyRow}>
                  <span className={styles.qtyLabel}>Quantidade</span>
                  <div className={styles.qtyControls}>
                    <button
                      id="btn-qty-minus"
                      className={styles.qtyBtn}
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="Diminuir quantidade"
                    >−</button>
                    <span className={styles.qtyValue}>{qty}</span>
                    <button
                      id="btn-qty-plus"
                      className={styles.qtyBtn}
                      onClick={() => setQty((q) => Math.min(10, q + 1))}
                      aria-label="Aumentar quantidade"
                    >+</button>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                {/* Breakdown — sempre mostra o fluxo de compra com preços */}
                <div className={styles.summaryLines}>
                  <div className={styles.summaryLine}>
                    <span>{selectedTier?.label ?? "—"} × {qty}</span>
                    <span>{formatCurrency(total, selectedTier!.currency)}</span>
                  </div>
                  <div className={styles.summaryLine}>
                    <span>Taxa de serviço (12%)</span>
                    <span>{formatCurrency(fee, selectedTier!.currency)}</span>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal, selectedTier!.currency)}</span>
                </div>

                <button
                  id="btn-continuar"
                  className={styles.btnContinue}
                  onClick={() => setStep(2)}
                  disabled={!selectedTier}
                >
                  Continuar para pagamento →
                </button>

                {mockPrices && (
                  <p className={styles.mockBadge}>
                    ⚠️ Preços simulados — apenas para demonstração
                  </p>
                )}

                <p className={styles.summaryNote}>🔒 Pagamento 100% seguro e criptografado</p>
              </div>
            </aside>
          </div>
        )}

        {/* ── STEP 2 — CHECKOUT ── */}
        {step === 2 && (
          <div className={styles.layout}>
            <section className={styles.checkoutSection}>
              <h2 className={styles.sectionTitle}>Dados do comprador</h2>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="field-name">Nome completo</label>
                  <input
                    id="field-name"
                    className={`${styles.input} ${formErrors.name ? styles.inputError : ""}`}
                    placeholder="Seu nome completo"
                    value={form.name}
                    onChange={(e) => handleField("name", e.target.value)}
                  />
                  {formErrors.name && <span className={styles.fieldError}>{formErrors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="field-email">E-mail</label>
                  <input
                    id="field-email"
                    className={`${styles.input} ${formErrors.email ? styles.inputError : ""}`}
                    placeholder="seu@email.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleField("email", e.target.value)}
                  />
                  {formErrors.email && <span className={styles.fieldError}>{formErrors.email}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="field-cpf">CPF</label>
                  <input
                    id="field-cpf"
                    className={`${styles.input} ${formErrors.cpf ? styles.inputError : ""}`}
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => handleField("cpf", maskCPF(e.target.value))}
                  />
                  {formErrors.cpf && <span className={styles.fieldError}>{formErrors.cpf}</span>}
                </div>
              </div>

              <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>Dados do cartão</h2>

              <div className={styles.cardVisual}>
                <div className={styles.cardFront}>
                  <span className={styles.cardChip}>▬▬</span>
                  <p className={styles.cardNumber}>{form.card || "•••• •••• •••• ••••"}</p>
                  <div className={styles.cardBottom}>
                    <span className={styles.cardName}>{form.name || "NOME DO TITULAR"}</span>
                    <span className={styles.cardExpiry}>{form.expiry || "MM/AA"}</span>
                  </div>
                  <div className={styles.cardGlare} />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                  <label className={styles.label} htmlFor="field-card">Número do cartão</label>
                  <input
                    id="field-card"
                    className={`${styles.input} ${formErrors.card ? styles.inputError : ""}`}
                    placeholder="0000 0000 0000 0000"
                    value={form.card}
                    onChange={(e) => handleField("card", maskCard(e.target.value))}
                  />
                  {formErrors.card && <span className={styles.fieldError}>{formErrors.card}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="field-expiry">Validade</label>
                  <input
                    id="field-expiry"
                    className={`${styles.input} ${formErrors.expiry ? styles.inputError : ""}`}
                    placeholder="MM/AA"
                    value={form.expiry}
                    onChange={(e) => handleField("expiry", maskExpiry(e.target.value))}
                  />
                  {formErrors.expiry && <span className={styles.fieldError}>{formErrors.expiry}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="field-cvv">CVV</label>
                  <input
                    id="field-cvv"
                    className={`${styles.input} ${formErrors.cvv ? styles.inputError : ""}`}
                    placeholder="•••"
                    maxLength={4}
                    value={form.cvv}
                    onChange={(e) => handleField("cvv", e.target.value.replace(/\D/g, ""))}
                  />
                  {formErrors.cvv && <span className={styles.fieldError}>{formErrors.cvv}</span>}
                </div>
              </div>
            </section>

            {/* ORDER SUMMARY (repeat) */}
            <aside className={styles.summary}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Resumo do pedido</h3>

                <div className={styles.eventMiniCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImg} alt={event.name} className={styles.eventMiniImg} />
                  <div>
                    <p className={styles.eventMiniArtist}>{artist}</p>
                    <p className={styles.eventMiniTitle}>{event.name}</p>
                    <p className={styles.eventMiniDate}>{dateStr}</p>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryLines}>
                  <div className={styles.summaryLine}>
                    <span>{selectedTier?.label} × {qty}</span>
                    <span>{formatCurrency(total, selectedTier!.currency)}</span>
                  </div>
                  <div className={styles.summaryLine}>
                    <span>Taxa de serviço (12%)</span>
                    <span>{formatCurrency(fee, selectedTier!.currency)}</span>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>{formatCurrency(grandTotal, selectedTier!.currency)}</span>
                </div>

                <button
                  id="btn-pagar"
                  className={styles.btnContinue}
                  onClick={handlePurchase}
                  disabled={processing}
                >
                  {processing ? (
                    <span className={styles.spinnerWrap}>
                      <span className={styles.spinner} /> Processando...
                    </span>
                  ) : (
                    `Pagar ${formatCurrency(grandTotal, selectedTier!.currency)}`
                  )}
                </button>

                <button
                  id="btn-voltar-step"
                  className={styles.btnSecondary}
                  onClick={() => setStep(1)}
                  disabled={processing}
                >
                  ← Voltar
                </button>

                <p className={styles.summaryNote}>🔒 Pagamento 100% seguro e criptografado</p>
              </div>
            </aside>
          </div>
        )}

        {/* ── STEP 3 — SUCCESS ── */}
        {step === 3 && (
          <div className={styles.successPage}>
            <div className={styles.successCard}>
              <div className={styles.successBurst}>
                <div className={styles.successIcon}>🎟️</div>
              </div>
              <h2 className={styles.successTitle}>Pedido confirmado!</h2>
              <p className={styles.successSub}>
                Seus ingressos foram enviados para <strong>{form.email}</strong>
              </p>

              <div className={styles.ticketSummaryBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImg} alt={event.name} className={styles.ticketImg} />
                <div className={styles.ticketInfo}>
                  <p className={styles.ticketCategory}>{category}</p>
                  <p className={styles.ticketArtist}>{artist}</p>
                  <p className={styles.ticketName}>{event.name}</p>
                  <p className={styles.ticketMeta}>📅 {dateStr}{timeStr && ` · ${timeStr}`}</p>
                  <p className={styles.ticketMeta}>📍 {venue}</p>
                  <div className={styles.ticketDivider} />
                  <div className={styles.ticketFooter}>
                    <div>
                      <p className={styles.ticketTierLabel}>{selectedTier?.label}</p>
                      <p className={styles.ticketQty}>{qty} {qty === 1 ? "ingresso" : "ingressos"}</p>
                    </div>
                    <p className={styles.ticketTotal}>{formatCurrency(grandTotal, selectedTier!.currency)}</p>
                  </div>
                </div>
              </div>

              <div className={styles.successActions}>
                <button id="btn-novo-evento" className={styles.btnContinue} onClick={() => router.push("/")}>
                  Explorar mais eventos
                </button>
                <button id="btn-baixar-ingresso" className={styles.btnSecondary}>
                  📥 Baixar ingresso (PDF)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
