"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import { Stepper } from "@/components/Stepper";
import { useAuth } from "@/lib/auth-context";
import type { CreateOrderPayload, CreateOrderResponse, ConfirmOrderResponse } from "@/app/api/orders/route";
import {
  CalendarIcon,
  MapPinIcon,
  AlertTriangleIcon,
  LockIcon,
  CheckIcon,
  ClockIcon,
  ShareIcon,
  MailIcon,
} from "@/components/icons";
import {
  TMEvent,
  getBestImage,
  formatDate,
  getArtistName,
  getVenue,
  getCategory,
  generateMockPrices,
} from "@/lib/ticketmaster";

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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const cardElementOptions: StripeCardElementOptions = {
  style: {
    base: {
      color: "#f7f7f7",
      fontSize: "15px",
      fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif",
      "::placeholder": { color: "#555555" },
    },
    invalid: { color: "#ff6b6b" },
  },
};

export default function EventPage() {
  return (
    <Elements stripe={stripePromise}>
      <EventCheckout />
    </Elements>
  );
}

function EventCheckout() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [event, setEvent] = useState<TMEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState(1);
  const [mockPrices, setMockPrices] = useState(false);
  const [orderCode,  setOrderCode]  = useState("");
  const [ticketCode, setTicketCode] = useState("");

  const [form, setForm] = useState({ name: "", email: "", cpf: "" });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});
  const [processing, setProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{ id: string; clientSecret: string } | null>(null);

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

  // Validador de CPF (Módulo 11)
  const isValidCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false; // Rejeita 000.000.000-00, 111.111.111-11, etc.

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i), 10) * (10 - i);
    }
    let rev = (sum * 10) % 11;
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(digits.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits.charAt(i), 10) * (11 - i);
    }
    rev = (sum * 10) % 11;
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(digits.charAt(10), 10)) return false;

    return true;
  };

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = "Nome completo obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "E-mail inválido";
    if (!isValidCPF(form.cpf)) errs.cpf = "CPF inválido (ex: 123.456.789-00)";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePurchase = async () => {
    if (!validate()) return;
    if (!user || !accessToken) {
      setPurchaseError("Você precisa estar logado para finalizar a compra. Faça login pelo menu superior.");
      return;
    }
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement || !cardComplete) {
      setPurchaseError("Preencha os dados do cartão corretamente.");
      return;
    }

    setPurchaseError(null);
    setProcessing(true);
    try {
      let order = pendingOrder;

      if (!order) {
        const payload: CreateOrderPayload = {
          eventId: event!.id,
          eventType: "SHOW",
          eventName: event!.name,
          eventDate: event!.dates.start.localDate,
          eventVenue: getVenue(event!),
          tierId: selectedTier!.id,
          tierLabel: selectedTier!.label,
          priceUnit: selectedTier!.price,
          quantity: qty,
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(payload),
        });
        const data: CreateOrderResponse & { error?: string } = await res.json();
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível concluir a compra.");

        order = { id: data.order.id, clientSecret: data.clientSecret };
        setPendingOrder(order);
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(order.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: form.name, email: form.email },
        },
      });

      if (stripeError) {
        setPurchaseError(stripeError.message ?? "Pagamento recusado. Tente outro cartão.");
        return;
      }
      if (paymentIntent?.status !== "succeeded") {
        setPurchaseError("Pagamento não aprovado.");
        return;
      }

      const confirmRes = await fetch(`/api/orders/${order.id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const confirmData: ConfirmOrderResponse & { error?: string } = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(typeof confirmData.error === "string" ? confirmData.error : "Não foi possível confirmar o pagamento.");

      setOrderCode(confirmData.order.id);
      setTicketCode(confirmData.order.tickets[0]?.code ?? "");
      setPendingOrder(null);
      setStep(3);
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : "Não foi possível concluir a compra.");
    } finally {
      setProcessing(false);
    }
  };

  const total = selectedTier ? selectedTier.price * qty : 0;
  const fee = total * 0.12;
  const grandTotal = total + fee;

  if (loading) return <Skeleton />;

  if (error || !event) {
    return (
      <div className={styles.errorPage}>
        <AlertTriangleIcon size={40} className={styles.errorIcon} />
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
      <Navbar />

      <main className={styles.main}>
        {step === 1 && (
          <>
            <button className={styles.backBtn} id="btn-voltar" onClick={() => router.push("/")}>
              <span className={styles.backArrow}>←</span> Todos os eventos
            </button>

            <section className={styles.hero}>
              <div className={styles.heroBg} style={{ backgroundImage: `url(${heroImg})` }} />
              <div className={styles.heroOverlay} />
              <div className={styles.heroContent}>
                <span className={styles.heroBadge}>{category}</span>
                <p className={styles.heroArtist}>{artist}</p>
                <h1 className={styles.heroTitle}>{event.name}</h1>
                <div className={styles.heroMeta}>
                  <span className={styles.heroMetaItem}>
                    <CalendarIcon size={14} className={styles.metaIcon} />
                    {dateStr}{timeStr && ` · ${timeStr}`}
                  </span>
                  <span className={styles.heroMetaItem}>
                    <MapPinIcon size={14} className={styles.metaIcon} />
                    {venue}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {step < 3 && <Stepper current={step} />}

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
                          <CheckIcon size={11} className={styles.checkIcon} /> {perk}
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
                    <AlertTriangleIcon size={12} /> Preços simulados — apenas para demonstração
                  </p>
                )}

                <p className={styles.summaryNote}><LockIcon /> Pagamento 100% seguro e criptografado</p>
              </div>
            </aside>
          </div>
        )}
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

              <div className={styles.formGroup}>
                <label className={styles.label}>Cartão de crédito</label>
                <div className={`${styles.input} ${styles.stripeCardWrap} ${cardError ? styles.inputError : ""}`}>
                  <CardElement
                    options={cardElementOptions}
                    onChange={(e) => {
                      setCardComplete(e.complete);
                      setCardError(e.error?.message ?? null);
                    }}
                  />
                </div>
                {cardError && <span className={styles.fieldError}>{cardError}</span>}
              </div>

              <p className={styles.mockBadge}>
                <AlertTriangleIcon size={12} /> Ambiente de teste Stripe — use 4242 4242 4242 4242 (aprovado) ou 4000 0000 0000 0002 (recusado), com qualquer CVC e validade futura.
              </p>
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

                {purchaseError && (
                  <p className={styles.fieldError} style={{ marginBottom: -4 }}>{purchaseError}</p>
                )}

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
                  onClick={() => {
                    setPendingOrder(null);
                    setPurchaseError(null);
                    setStep(1);
                  }}
                  disabled={processing}
                >
                  ← Voltar
                </button>

                <p className={styles.summaryNote}><LockIcon /> Pagamento 100% seguro e criptografado</p>
              </div>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className={styles.confirmPage}>
            <div className={styles.confirmCheck}>
              <svg viewBox="0 0 52 52" className={styles.checkSvg}>
                <circle cx="26" cy="26" r="25" fill="none" className={styles.checkCircle} />
                <path d="M14 27l9 9 16-18" fill="none" className={styles.checkMark} />
              </svg>
            </div>
            <h2 className={styles.confirmTitle}>Compra Confirmada!</h2>
            <p className={styles.confirmSub}>
              Seu ingresso está pronto. Verifique seu e-mail para mais detalhes.
            </p>

            <div className={styles.ticketCard}>
              <div className={styles.tcHeader}>
                <div>
                  <p className={styles.tcOrderLabel}>Número do Pedido</p>
                  <p className={styles.tcOrderNumber}>{orderCode}</p>
                </div>
                <span className={styles.tcBadge}><CheckIcon size={11} /> Confirmado</span>
              </div>

              <div className={styles.tcDividerDash} />

              <div className={styles.tcSection}>
                <p className={styles.tcLabel}>Evento</p>
                <p className={styles.tcEventName}>{event.name}</p>
              </div>

              <div className={styles.tcRow}>
                <div>
                  <p className={styles.tcLabel}>Tipo de Ingresso</p>
                  <p className={styles.tcValue}>{selectedTier?.label}</p>
                </div>
                <div>
                  <p className={styles.tcLabel}>Quantidade</p>
                  <p className={styles.tcValue}>{qty}x</p>
                </div>
              </div>

              <div className={styles.tcDividerDash} />

              <div className={styles.tcQrSection}>
                <p className={styles.tcLabel}>Código do Ingresso</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&color=000000&bgcolor=ffffff&data=${encodeURIComponent(ticketCode)}`}
                  alt="QR Code do ingresso"
                  className={styles.tcQrImg}
                  width={160}
                  height={160}
                />
                <p className={styles.tcTicketCode}>{ticketCode}</p>
                <p className={styles.tcQrHint}>Apresente este código na entrada</p>
              </div>

              <div className={styles.tcDividerDash} />

              <div className={styles.tcMeta}>
                <div className={styles.tcMetaRow}>
                  <span className={styles.tcMetaLabel}><CalendarIcon size={12} /> Data do Evento</span>
                  <span className={styles.tcMetaValue}>{dateStr}{timeStr && ` – ${timeStr}`}</span>
                </div>
                <div className={styles.tcMetaRow}>
                  <span className={styles.tcMetaLabel}><MapPinIcon size={12} /> Local</span>
                  <span className={styles.tcMetaValue}>{venue}</span>
                </div>
                <div className={styles.tcMetaRow}>
                  <span className={styles.tcMetaLabel}><MailIcon size={12} /> E-mail de Confirmação</span>
                  <span className={styles.tcMetaValue}>{form.email}</span>
                </div>
              </div>

              <div className={styles.tcDividerDash} />

              <div className={styles.tcTotalRow}>
                <span className={styles.tcTotalLabel}>Total Pago</span>
                <span className={styles.tcTotalValue}>{formatCurrency(grandTotal, selectedTier!.currency)}</span>
              </div>
            </div>

            <div className={styles.confirmActions}>
              <button id="btn-compartilhar" className={styles.btnContinue}>
                <ShareIcon size={14} /> Compartilhar Ingresso
              </button>
            </div>

            <div className={styles.infoBoxes}>
              <div className={styles.infoBox}>
                <ClockIcon size={20} className={styles.infoIcon} />
                <div>
                  <p className={styles.infoTitle}>Chegue cedo</p>
                  <p className={styles.infoDesc}>Recomendamos chegar 30 min antes do início</p>
                </div>
              </div>
              <div className={styles.infoBox}>
                <LockIcon size={20} className={styles.infoIcon} />
                <div>
                  <p className={styles.infoTitle}>Sua segurança</p>
                  <p className={styles.infoDesc}>Ingresso válido com identificação obrigatória</p>
                </div>
              </div>
            </div>

            <button
              id="btn-continuar-comprando"
              className={styles.linkContinue}
              onClick={() => router.push("/")}
            >
              Continuar comprando ingressos →
            </button>

          </div>
        )}
      </main>
    </div>
  );
}
