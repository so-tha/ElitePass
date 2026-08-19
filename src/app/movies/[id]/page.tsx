"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import { Stepper } from "@/components/Stepper";
import { SeatMap } from "@/components/SeatMap";
import { useAuth } from "@/lib/auth-context";
import { useSeatMap } from "@/lib/useSeatMap";
import type { CreateOrderPayload, CreateOrderResponse, ConfirmOrderResponse } from "@/app/api/orders/route";
import {
  ClockIcon,
  CalendarIcon,
  FilmIcon,
  StarIcon,
  PlayIcon,
  AlertTriangleIcon,
  LockIcon,
  CheckIcon,
  MailIcon,
  ShareIcon,
} from "@/components/icons";
import {
  TMDBMovieDetail,
  tmdbBackdrop,
  tmdbPoster,
  formatMovieDate,
  generateMoviePrice,
  GENRE_MAP,
} from "@/lib/tmdb";

interface TicketTier {
  id: string;
  label: string;
  description: string;
  price: number;
  available: boolean;
}

function buildTiers(movie: TMDBMovieDetail): TicketTier[] {
  const { min } = generateMoviePrice(movie);
  return [
    {
      id: "normal",
      label: "Entrada Normal",
      description: "Poltrona padrão · Qualquer sessão",
      price: Math.round(min),
      available: true,
    },
    {
      id: "vip",
      label: "VIP / IMAX",
      description: "Poltrona premium · Sessão IMAX",
      price: Math.round(min * 1.6),
      available: true,
    },
    {
      id: "3d",
      label: "3D Premium",
      description: "Óculos inclusos · Dolby Atmos",
      price: Math.round(min * 1.9),
      available: true,
    },
    {
      id: "meia",
      label: "Meia-Entrada",
      description: "Estudante, idoso ou PCD · Documento obrigatório",
      price: Math.round(min * 0.5),
      available: true,
    },
  ];
}

function Skeleton() {
  return (
    <div className={styles.root}>
      <Navbar />
      <div className={`${styles.hero} ${styles.skeleton}`} style={{ minHeight: 340 }} />
      <main className={styles.main}>
        <div className={`${styles.skeletonBlock}`} style={{ height: 40, width: "60%", marginBottom: 24 }} />
        <div className={`${styles.skeletonBlock}`} style={{ height: 200 }} />
      </main>
    </div>
  );
}

function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
  let r = (s * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
  r = (s * 10) % 11;
  if (r >= 10) r = 0;
  return r === parseInt(d[10]);
}

function isValidCard(card: string): boolean {
  const d = card.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0, double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i]);
    if (double) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

function isValidExpiry(e: string): boolean {
  if (!/^\d{2}\/\d{2}$/.test(e)) return false;
  const [m, y] = e.split("/").map(Number);
  if (m < 1 || m > 12) return false;
  const now = new Date();
  const yr = 2000 + y;
  if (yr < now.getFullYear()) return false;
  if (yr === now.getFullYear() && m < now.getMonth() + 1) return false;
  return true;
}

export default function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [movie, setMovie]   = useState<TMDBMovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [tiers, setTiers]             = useState<TicketTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [step, setStep]               = useState(1);
  const [orderCode, setOrderCode]     = useState("");
  const [ticketCode, setTicketCode]   = useState("");
  const [purchasedSeats, setPurchasedSeats] = useState<string[]>([]);

  const [form, setForm] = useState({ name: "", email: "", cpf: "", card: "", expiry: "", cvv: "" });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});
  const [processing, setProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const eventId = movie ? `tmdb-${movie.id}` : "";
  const {
    seats: seatMap,
    selected: selectedSeats,
    loading: seatsLoading,
    loadError: seatsLoadError,
    actionError: seatsActionError,
    toggleSeat,
  } = useSeatMap(eventId, user?.id ?? null, accessToken);
  const qty = selectedSeats.length;

  const fetchMovie = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/movies/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Filme não encontrado.");
      const m: TMDBMovieDetail = data.movie;
      setMovie(m);
      const t = buildTiers(m);
      setTiers(t);
      setSelectedTier(t[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar filme.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMovie(); }, [fetchMovie]);

  // form helpers
  const handleField = (field: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (formErrors[field]) setFormErrors(e => ({ ...e, [field]: "" }));
  };

  const maskCPF = (v: string) =>
    v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
  const maskCard = (v: string) =>
    v.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);
  const maskExpiry = (v: string) =>
    v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim() || form.name.trim().length < 3) errs.name = "Nome completo obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "E-mail inválido";
    if (!isValidCPF(form.cpf)) errs.cpf = "CPF inválido";
    if (!isValidCard(form.card)) errs.card = "Número de cartão inválido";
    if (!isValidExpiry(form.expiry)) errs.expiry = "Validade inválida (MM/AA)";
    if (form.cvv.replace(/\D/g, "").length < 3) errs.cvv = "CVV inválido";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePurchase = async () => {
    if (!validate()) return;
    if (!user || !accessToken) {
      setPurchaseError("Você precisa estar logado para finalizar a compra. Faça login pelo menu superior.");
      return;
    }
    if (selectedSeats.length === 0) {
      setPurchaseError("Selecione ao menos um assento para continuar.");
      return;
    }

    setPurchaseError(null);
    setProcessing(true);
    try {
      const payload: CreateOrderPayload = {
        eventId,
        eventType: "MOVIE",
        eventName: movie!.title,
        eventDate: movie!.release_date,
        eventVenue: "Sessão no cinema",
        tierId: selectedTier!.id,
        tierLabel: selectedTier!.label,
        priceUnit: selectedTier!.price,
        quantity: qty,
        seatLabels: selectedSeats,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data: CreateOrderResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível concluir a compra.");

      const confirmRes = await fetch(`/api/orders/${data.order.id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const confirmData: ConfirmOrderResponse & { error?: string } = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(typeof confirmData.error === "string" ? confirmData.error : "Não foi possível confirmar o pagamento.");

      setOrderCode(confirmData.order.id);
      setTicketCode(confirmData.order.tickets[0]?.code ?? "");
      setPurchasedSeats(selectedSeats);
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

  if (error || !movie) {
    return (
      <div className={styles.errorPage}>
        <AlertTriangleIcon size={40} className={styles.errorIcon} />
        <h2>Filme não encontrado</h2>
        <p>{error}</p>
        <button className={styles.btnBack} onClick={() => router.push("/")}>← Voltar ao início</button>
      </div>
    );
  }

  const genre = movie.genres?.[0]?.name ?? GENRE_MAP[movie.genre_ids?.[0]] ?? "Filme";
  const director = movie.credits?.crew?.find(c => c.job === "Director")?.name;
  const trailer = movie.videos?.results?.find(v => v.site === "YouTube" && v.type === "Trailer" && v.official);
  const backdropUrl = tmdbBackdrop(movie.backdrop_path);
  const posterUrl = tmdbPoster(movie.poster_path, "w342");
  const releaseDate = formatMovieDate(movie.release_date);

  const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        {step === 1 && (
          <>
            <button className={styles.backBtn} id="btn-voltar" onClick={() => router.push("/")}>
              <span className={styles.backArrow}>←</span> Todos os eventos
            </button>

            <section className={styles.movieHero}>
              <div className={styles.movieHeroBg} style={{ backgroundImage: `url(${backdropUrl})` }} />
              <div className={styles.movieHeroOverlay} />
              <div className={styles.movieHeroContent}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterUrl} alt={movie.title} className={styles.moviePoster} />
                <div className={styles.movieInfo}>
                  <span className={styles.heroBadge}>{genre}</span>
                  <h1 className={styles.heroTitle}>{movie.title}</h1>
                  {movie.tagline && <p className={styles.movieTagline}>&ldquo;{movie.tagline}&rdquo;</p>}
                  <div className={styles.movieMeta}>
                    {movie.runtime && (
                      <span className={styles.metaChip}><ClockIcon size={12} />{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min</span>
                    )}
                    <span className={styles.metaChip}><CalendarIcon size={12} />{releaseDate}</span>
                    {director && <span className={styles.metaChip}><FilmIcon size={12} />{director}</span>}
                    <span className={styles.metaChip}><StarIcon size={12} />{movie.vote_average.toFixed(1)}/10</span>
                  </div>
                  <p className={styles.movieOverview}>{movie.overview}</p>
                  {trailer && (
                    <a
                      href={`https://www.youtube.com/watch?v=${trailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnTrailer}
                      id="btn-trailer"
                    >
                      <PlayIcon size={11} /> Assistir Trailer
                    </a>
                  )}
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
                {tiers.map(tier => (
                  <button
                    key={tier.id}
                    id={`tier-${tier.id}`}
                    className={`${styles.tierCard} ${selectedTier?.id === tier.id ? styles.tierSelected : ""}`}
                    onClick={() => setSelectedTier(tier)}
                  >
                    <div className={styles.tierLeft}>
                      <span className={styles.tierLabel}>{tier.label}</span>
                      <span className={styles.tierDesc}>{tier.description}</span>
                    </div>
                    <span className={styles.tierPrice}>{fmt(tier.price)}</span>
                  </button>
                ))}
              </div>

              <h2 className={styles.sectionTitle} style={{ marginTop: 8 }}>Escolha seus assentos</h2>
              <div className={styles.seatMapWrap}>
                <SeatMap
                  seats={seatMap}
                  selected={selectedSeats}
                  onToggle={toggleSeat}
                  loading={seatsLoading}
                  loadError={seatsLoadError}
                  actionError={seatsActionError}
                />
              </div>
            </section>

            <aside className={styles.summaryBox}>
              <h3 className={styles.summaryTitle}>Resumo do Pedido</h3>
              <div className={styles.summaryFilm}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterUrl} alt={movie.title} className={styles.summaryPoster} />
                <div>
                  <p className={styles.summaryName}>{movie.title}</p>
                  <p className={styles.summaryMeta}>{releaseDate}</p>
                  <p className={styles.summaryMeta}><FilmIcon size={12} /> Sessão no cinema</p>
                </div>
              </div>
              <div className={styles.summaryNote}>
                <AlertTriangleIcon size={12} /> Preços simulados para fins de demonstração.
              </div>
              {selectedSeats.length > 0 && (
                <p className={styles.summaryMeta} style={{ marginTop: -8, marginBottom: 4 }}>
                  Assentos: {[...selectedSeats].sort().join(", ")}
                </p>
              )}
              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}>
                  <span>{selectedTier?.label} × {qty}</span>
                  <span>{fmt(total)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Taxa de serviço (12%)</span>
                  <span>{fmt(fee)}</span>
                </div>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span className={styles.totalAmount}>{fmt(grandTotal)}</span>
              </div>
              <button
                className={styles.btnContinue}
                id="btn-continuar"
                disabled={!selectedTier || selectedSeats.length === 0}
                onClick={() => setStep(2)}
              >
                {selectedSeats.length === 0 ? "Selecione ao menos 1 assento" : "Continuar para Pagamento →"}
              </button>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className={styles.checkoutLayout}>
            <section className={styles.formSection}>
              <button className={styles.backStepBtn} onClick={() => setStep(1)}>← Voltar</button>
              <h2 className={styles.sectionTitle}>Dados pessoais</h2>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="inp-name">Nome completo</label>
                  <input id="inp-name" className={`${styles.formInput} ${formErrors.name ? styles.inputError : ""}`}
                    value={form.name} onChange={e => handleField("name", e.target.value)} placeholder="Seu nome completo" />
                  {formErrors.name && <span className={styles.errorMsg}>{formErrors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="inp-email">E-mail</label>
                  <input id="inp-email" type="email" className={`${styles.formInput} ${formErrors.email ? styles.inputError : ""}`}
                    value={form.email} onChange={e => handleField("email", e.target.value)} placeholder="seu@email.com" />
                  {formErrors.email && <span className={styles.errorMsg}>{formErrors.email}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="inp-cpf">CPF</label>
                  <input id="inp-cpf" className={`${styles.formInput} ${formErrors.cpf ? styles.inputError : ""}`}
                    value={form.cpf} onChange={e => handleField("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" />
                  {formErrors.cpf && <span className={styles.errorMsg}>{formErrors.cpf}</span>}
                </div>
              </div>

              <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>Pagamento</h2>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.formLabel} htmlFor="inp-card">Número do cartão</label>
                  <input id="inp-card" className={`${styles.formInput} ${formErrors.card ? styles.inputError : ""}`}
                    value={form.card} onChange={e => handleField("card", maskCard(e.target.value))} placeholder="0000 0000 0000 0000" />
                  {formErrors.card && <span className={styles.errorMsg}>{formErrors.card}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="inp-expiry">Validade</label>
                  <input id="inp-expiry" className={`${styles.formInput} ${formErrors.expiry ? styles.inputError : ""}`}
                    value={form.expiry} onChange={e => handleField("expiry", maskExpiry(e.target.value))} placeholder="MM/AA" />
                  {formErrors.expiry && <span className={styles.errorMsg}>{formErrors.expiry}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="inp-cvv">CVV</label>
                  <input id="inp-cvv" className={`${styles.formInput} ${formErrors.cvv ? styles.inputError : ""}`}
                    value={form.cvv} maxLength={4} onChange={e => handleField("cvv", e.target.value.replace(/\D/g, ""))} placeholder="123" />
                  {formErrors.cvv && <span className={styles.errorMsg}>{formErrors.cvv}</span>}
                </div>
              </div>
            </section>

            <aside className={styles.summaryBox}>
              <h3 className={styles.summaryTitle}>Resumo do Pedido</h3>
              <div className={styles.summaryFilm}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterUrl} alt={movie.title} className={styles.summaryPoster} />
                <div>
                  <p className={styles.summaryName}>{movie.title}</p>
                  <p className={styles.summaryMeta}>{selectedTier?.label} × {qty}</p>
                  <p className={styles.summaryMeta}>Assentos: {[...selectedSeats].sort().join(", ")}</p>
                </div>
              </div>
              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}><span>Subtotal</span><span>{fmt(total)}</span></div>
                <div className={styles.summaryLine}><span>Taxa (12%)</span><span>{fmt(fee)}</span></div>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span className={styles.totalAmount}>{fmt(grandTotal)}</span>
              </div>
              {purchaseError && <p className={styles.errorMsg}>{purchaseError}</p>}

              <button
                className={styles.btnContinue}
                id="btn-finalizar"
                onClick={handlePurchase}
                disabled={processing}
              >
                {processing ? (
                  <span className={styles.btnSpinner}><span className={styles.spinner} /> Processando...</span>
                ) : (
                  <><LockIcon size={13} /> Pagar {fmt(grandTotal)}</>
                )}
              </button>
              <p className={styles.secureNote}><LockIcon size={11} /> Pagamento simulado — nenhum dado real é processado</p>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className={styles.confirmWrap}>
            <div className={styles.checkmarkCircle}>
              <svg className={styles.checkmarkSvg} viewBox="0 0 52 52">
                <circle className={styles.checkmarkCirclePath} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Compra Confirmada!</h2>
            <p className={styles.successSubtitle}>Seu ingresso está pronto. Verifique seu e-mail para mais detalhes.</p>

            <div className={styles.ticketCard}>
              <div className={styles.tcHeader}>
                <div>
                  <span className={styles.tcLabel}>Número do Pedido</span>
                  <span className={styles.tcOrderCode}>{orderCode}</span>
                </div>
                <span className={styles.tcBadge}><CheckIcon size={11} /> Confirmado</span>
              </div>
              <div className={styles.tcDetails}>
                <div className={styles.tcField}>
                  <span className={styles.tcLabel}>Filme</span>
                  <span className={styles.tcValue}>{movie.title}</span>
                </div>
                <div className={styles.tcField}>
                  <span className={styles.tcLabel}>Categoria</span>
                  <span className={styles.tcValue}>{selectedTier?.label}</span>
                </div>
                <div className={styles.tcField}>
                  <span className={styles.tcLabel}>Quantidade</span>
                  <span className={styles.tcValue}>{purchasedSeats.length}x</span>
                </div>
                <div className={styles.tcField}>
                  <span className={styles.tcLabel}>Assentos</span>
                  <span className={styles.tcValue}>{[...purchasedSeats].sort().join(", ")}</span>
                </div>
              </div>

              <div className={styles.tcDivider} />
              <div className={styles.tcQrSection}>
                <span className={styles.tcLabel}>Código do Ingresso</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(ticketCode)}&bgcolor=1a1a1a&color=f5a623`}
                  alt="QR Code do ingresso"
                  className={styles.qrCode}
                  width={140}
                  height={140}
                />
                <span className={styles.tcTicketCode}>{ticketCode}</span>
                <span className={styles.tcSmall}>Apresente este código na entrada</span>
              </div>

              <div className={styles.tcDivider} />
              <div className={styles.tcMeta}>
                <div className={styles.tcMetaRow}>
                  <span><CalendarIcon size={12} /> Lançamento</span><span>{releaseDate}</span>
                </div>
                <div className={styles.tcMetaRow}>
                  <span><FilmIcon size={12} /> Gênero</span><span>{genre}</span>
                </div>
                <div className={styles.tcMetaRow}>
                  <span><MailIcon size={12} /> E-mail de Confirmação</span><span>{form.email}</span>
                </div>
                <div className={`${styles.tcMetaRow} ${styles.tcMetaTotalRow}`}>
                  <span>Total Pago</span><span className={styles.tcTotalValue}>{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button id="btn-compartilhar" className={styles.btnContinue}>
                <ShareIcon size={14} /> Compartilhar Ingresso
              </button>
            </div>

            <div className={styles.infoBoxes}>
              <div className={styles.infoBox}>
                <ClockIcon size={20} className={styles.infoBoxIcon} />
                <div>
                  <strong>Chegue cedo</strong>
                  <p>Recomendamos chegar 20 min antes da sessão</p>
                </div>
              </div>
              <div className={styles.infoBox}>
                <LockIcon size={20} className={styles.infoBoxIcon} />
                <div>
                  <strong>Sua segurança</strong>
                  <p>Ingresso válido com identificação obrigatória</p>
                </div>
              </div>
            </div>

            <Link href="/" className={styles.continueLink}>Continuar explorando →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
