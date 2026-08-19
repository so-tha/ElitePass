"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import { QrScanner } from "@/components/QrScanner";
import { useAuth } from "@/lib/auth-context";
import {
  ScanIcon,
  KeyboardIcon,
  ShieldCheckIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
} from "@/components/icons";
import type { PortariaEventItem } from "@/app/api/portaria/events/route";
import type { ValidateTicketResponse } from "@/app/api/tickets/validate/[code]/route";

type OutcomeStatus = "VALID" | "ALREADY_USED" | "WRONG_EVENT" | "INVALID";

interface Outcome {
  id: string;
  status: OutcomeStatus;
  code: string;
  time: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

const LAST_EVENT_STORAGE_KEY = "elitepass:portaria:lastEventId";

function nowLabel(): string {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Extrai o código do ingresso a partir do texto lido no QR ("EP:<code>:<hmac>") ou de um código digitado manualmente. */
function parseScan(raw: string): { code: string; qrData?: string } {
  const text = raw.trim();
  const parts = text.split(":");
  if (parts.length === 3 && parts[0] === "EP") {
    return { code: parts[1], qrData: text };
  }
  return { code: text };
}

function buildOutcome(data: ValidateTicketResponse, attemptedCode: string): Outcome {
  const code = data.code ?? attemptedCode;
  const time = nowLabel();
  const id = `${code}-${Date.now()}`;

  if (data.ok) {
    return {
      id,
      status: "VALID",
      code,
      time,
      title: "Ingresso válido",
      subtitle: data.holder,
      meta: [data.eventName, data.tierLabel].filter(Boolean).join(" · "),
    };
  }

  if (data.reason === "ALREADY_USED") {
    return {
      id,
      status: "ALREADY_USED",
      code,
      time,
      title: "Ingresso já utilizado",
      subtitle: data.holder,
      meta: data.usedAt
        ? `Entrada validada às ${new Date(data.usedAt).toLocaleString("pt-BR")}`
        : undefined,
    };
  }

  if (data.reason === "WRONG_EVENT") {
    return {
      id,
      status: "WRONG_EVENT",
      code,
      time,
      title: "Evento errado",
      meta: data.ticketEventName ? `Este ingresso é do evento: ${data.ticketEventName}` : undefined,
    };
  }

  return {
    id,
    status: "INVALID",
    code,
    time,
    title: "Ingresso inválido",
    meta: data.error,
  };
}

const STATUS_LABEL: Record<OutcomeStatus, string> = {
  VALID: "Válido",
  ALREADY_USED: "Já utilizado",
  WRONG_EVENT: "Evento errado",
  INVALID: "Inválido",
};

export default function PortariaPage() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"camera" | "manual">("camera");
  const [events, setEvents] = useState<PortariaEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [manualCode, setManualCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<Outcome | null>(null);
  const [history, setHistory] = useState<Outcome[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "DOORMAN") router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "DOORMAN" || !accessToken) return;

    let cancelled = false;
    (async () => {
      try {
        setEventsLoading(true);
        const res = await fetch("/api/portaria/events", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (!res.ok || cancelled) return;
        const list: PortariaEventItem[] = data.events ?? [];
        setEvents(list);

        const stored = window.localStorage.getItem(LAST_EVENT_STORAGE_KEY);
        if (stored && list.some((e) => e.id === stored)) {
          setSelectedEventId(stored);
        } else if (list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, accessToken]);

  useEffect(() => {
    if (selectedEventId) window.localStorage.setItem(LAST_EVENT_STORAGE_KEY, selectedEventId);
  }, [selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  async function runValidation(input: { code: string; qrData?: string }) {
    if (!input.code || !accessToken) return;
    if (!selectedEventId) {
      setResult({
        id: `no-event-${Date.now()}`,
        status: "INVALID",
        code: input.code,
        time: nowLabel(),
        title: "Selecione um evento",
        meta: "Escolha o evento em que a portaria está atuando antes de validar.",
      });
      return;
    }

    setValidating(true);
    try {
      const res = await fetch(`/api/tickets/validate/${encodeURIComponent(input.code)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ qrData: input.qrData, eventId: selectedEventId }),
      });
      const data: ValidateTicketResponse = await res.json();
      const outcome = buildOutcome(data, input.code);
      setResult(outcome);
      setHistory((h) => [outcome, ...h].slice(0, 20));
    } catch {
      const outcome: Outcome = {
        id: `error-${Date.now()}`,
        status: "INVALID",
        code: input.code,
        time: nowLabel(),
        title: "Erro de conexão",
        meta: "Não foi possível validar o ingresso. Tente novamente.",
      };
      setResult(outcome);
    } finally {
      setValidating(false);
    }
  }

  function handleScan(rawText: string) {
    if (validating || result) return;
    runValidation(parseScan(rawText));
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim() || validating) return;
    runValidation(parseScan(manualCode));
  }

  function handleNext() {
    setResult(null);
    setManualCode("");
  }

  if (authLoading || !user || user.role !== "DOORMAN") {
    return null;
  }

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <ShieldCheckIcon size={22} />
            <h1 className={styles.pageTitle}>Portaria</h1>
          </div>
          <p className={styles.pageSubtitle}>Valide os ingressos na entrada do evento por câmera ou código manual.</p>
        </div>

        <div className={styles.eventPicker}>
          <label className={styles.eventLabel} htmlFor="portaria-event-select">
            Evento em validação
          </label>
          <select
            id="portaria-event-select"
            className={styles.eventSelect}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={eventsLoading || events.length === 0}
          >
            {eventsLoading && <option>Carregando eventos...</option>}
            {!eventsLoading && events.length === 0 && <option>Nenhum evento publicado</option>}
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {ev.venue}
              </option>
            ))}
          </select>
          {selectedEvent && (
            <span className={styles.eventMeta}>
              {selectedEvent.city} · {new Date(selectedEvent.date).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        <div className={styles.layout}>
          <div className={styles.scanPanel}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === "camera" ? styles.tabBtnActive : ""}`}
                onClick={() => setTab("camera")}
              >
                <ScanIcon size={14} />
                <span>Câmera</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${tab === "manual" ? styles.tabBtnActive : ""}`}
                onClick={() => setTab("manual")}
              >
                <KeyboardIcon size={14} />
                <span>Código manual</span>
              </button>
            </div>

            {tab === "camera" ? (
              <QrScanner onDecode={handleScan} paused={Boolean(result) || validating} />
            ) : (
              <form className={styles.manualForm} onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  className={styles.manualInput}
                  placeholder="Digite o código do ingresso (ex.: MIC-PI-20260817-832941)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={validating || Boolean(result)}
                  autoFocus
                />
                <button
                  type="submit"
                  className={styles.btnValidate}
                  disabled={validating || Boolean(result) || !manualCode.trim()}
                >
                  {validating ? "Validando..." : "Validar entrada"}
                </button>
              </form>
            )}

            {result && (
              <div className={`${styles.resultCard} ${styles[`result${result.status}`]}`}>
                <div className={styles.resultIcon}>
                  {result.status === "VALID" && <CheckIcon size={22} />}
                  {result.status === "ALREADY_USED" && <AlertTriangleIcon size={20} />}
                  {(result.status === "WRONG_EVENT" || result.status === "INVALID") && <XIcon size={20} />}
                </div>
                <span className={styles.resultBadge}>{STATUS_LABEL[result.status]}</span>
                <h3 className={styles.resultTitle}>{result.title}</h3>
                {result.subtitle && <p className={styles.resultSubtitle}>{result.subtitle}</p>}
                {result.meta && <p className={styles.resultMeta}>{result.meta}</p>}
                <span className={styles.resultCode}>{result.code}</span>
                <button type="button" className={styles.btnNext} onClick={handleNext}>
                  Validar próximo
                </button>
              </div>
            )}
          </div>

          <div className={styles.historyPanel}>
            <h2 className={styles.historyTitle}>Últimas validações</h2>
            {history.length === 0 ? (
              <p className={styles.historyEmpty}>Nenhuma validação registrada ainda nesta sessão.</p>
            ) : (
              <ul className={styles.historyList}>
                {history.map((item) => (
                  <li key={item.id} className={styles.historyItem}>
                    <span className={`${styles.historyDot} ${styles[`dot${item.status}`]}`} />
                    <div className={styles.historyInfo}>
                      <span className={styles.historyCode}>{item.code}</span>
                      <span className={styles.historyLabel}>{STATUS_LABEL[item.status]}</span>
                    </div>
                    <span className={styles.historyTime}>{item.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
