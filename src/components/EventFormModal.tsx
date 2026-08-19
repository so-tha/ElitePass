"use client";

import { useEffect, useState } from "react";
import styles from "./EventFormModal.module.css";
import { useAuth } from "@/lib/auth-context";
import { XIcon, PlusIcon, AlertTriangleIcon } from "./icons";
import type { EventFormPayload, EventTierInput } from "@/app/api/organizer/events/route";

export interface EditableEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: "SHOW" | "MOVIE";
  imageUrl: string | null;
  venue: string;
  city: string;
  date: string;
  capacity: number;
  tiers: EventTierInput[];
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  event?: EditableEvent | null;
}

const emptyTier = (): EventTierInput => ({
  id: `tier-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  priceUnit: 0,
  capacity: 0,
});

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormModal({ isOpen, onClose, onSaved, event }: EventFormModalProps) {
  const { accessToken } = useAuth();
  const isEditMode = !!event;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"SHOW" | "MOVIE">("SHOW");
  const [imageUrl, setImageUrl] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [tiers, setTiers] = useState<EventTierInput[]>([emptyTier()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setCategory(event.category);
      setType(event.type);
      setImageUrl(event.imageUrl ?? "");
      setVenue(event.venue);
      setCity(event.city);
      setDate(toDatetimeLocal(event.date));
      setCapacity(String(event.capacity));
      setTiers(event.tiers.length > 0 ? event.tiers : [emptyTier()]);
    } else {
      setTitle("");
      setDescription("");
      setCategory("");
      setType("SHOW");
      setImageUrl("");
      setVenue("");
      setCity("");
      setDate("");
      setCapacity("");
      setTiers([emptyTier()]);
    }
    setError(null);
  }, [isOpen, event]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateTier = (index: number, field: keyof EventTierInput, value: string) => {
    setTiers((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        if (field === "priceUnit" || field === "capacity") {
          return { ...t, [field]: Number(value) };
        }
        return { ...t, [field]: value };
      })
    );
  };

  const addTier = () => setTiers((prev) => [...prev, emptyTier()]);
  const removeTier = (index: number) => setTiers((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 3) return setError("Título deve ter ao menos 3 caracteres.");
    if (!category.trim()) return setError("Categoria é obrigatória.");
    if (!venue.trim()) return setError("Local é obrigatório.");
    if (!city.trim()) return setError("Cidade é obrigatória.");
    if (!date) return setError("Data e horário são obrigatórios.");
    const capacityNum = Number(capacity);
    if (!capacityNum || capacityNum <= 0) return setError("Capacidade deve ser maior que zero.");
    if (tiers.length === 0) return setError("Adicione ao menos um setor/tier.");
    for (const t of tiers) {
      if (!t.label.trim()) return setError("Todos os setores precisam de um nome.");
      if (!t.priceUnit || t.priceUnit <= 0) return setError(`Preço inválido no setor "${t.label || "sem nome"}".`);
      if (!t.capacity || t.capacity <= 0) return setError(`Capacidade inválida no setor "${t.label || "sem nome"}".`);
    }

    const tiersWithIds: EventTierInput[] = tiers.map((t, i) => ({
      ...t,
      id: t.id || `${t.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${i}`,
    }));

    const payload: EventFormPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      type,
      imageUrl: imageUrl.trim() || undefined,
      venue: venue.trim(),
      city: city.trim(),
      date,
      capacity: capacityNum,
      tiers: tiersWithIds,
    };

    setLoading(true);
    try {
      const url = isEditMode ? `/api/organizer/events/${event!.id}` : "/api/organizer/events";
      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Verifique os dados informados.";
        throw new Error(msg);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          <XIcon size={14} />
        </button>

        <h2 className={styles.title}>{isEditMode ? "Editar Evento" : "Novo Evento"}</h2>

        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangleIcon size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={`${styles.field} ${styles.colSpan2}`}>
              <label className={styles.label}>Título</label>
              <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do evento" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Categoria</label>
              <input className={styles.input} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Pop, Rock, Teatro..." />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tipo</label>
              <select className={styles.input} value={type} onChange={(e) => setType(e.target.value as "SHOW" | "MOVIE")}>
                <option value="SHOW">Show / Evento</option>
                <option value="MOVIE">Filme</option>
              </select>
            </div>

            <div className={`${styles.field} ${styles.colSpan2}`}>
              <label className={styles.label}>Descrição</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do evento (opcional)"
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Local</label>
              <input className={styles.input} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Nome do local" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cidade</label>
              <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Data e horário</label>
              <input type="datetime-local" className={styles.input} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Capacidade total</label>
              <input
                type="number"
                min={1}
                className={styles.input}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Ex: 500"
              />
            </div>

            <div className={`${styles.field} ${styles.colSpan2}`}>
              <label className={styles.label}>Imagem (URL)</label>
              <input className={styles.input} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://... (opcional)" />
            </div>
          </div>

          <div className={styles.tiersSection}>
            <div className={styles.tiersHeader}>
              <label className={styles.label}>Setores / Ingressos</label>
              <button type="button" className={styles.btnAddTier} onClick={addTier}>
                <PlusIcon size={12} /> Adicionar setor
              </button>
            </div>

            <div className={styles.tiersList}>
              {tiers.map((tier, i) => (
                <div key={tier.id || i} className={styles.tierRow}>
                  <input
                    className={styles.input}
                    value={tier.label}
                    onChange={(e) => updateTier(i, "label", e.target.value)}
                    placeholder="Nome (ex: Pista, VIP)"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={styles.input}
                    value={tier.priceUnit || ""}
                    onChange={(e) => updateTier(i, "priceUnit", e.target.value)}
                    placeholder="Preço (R$)"
                  />
                  <input
                    type="number"
                    min={0}
                    className={styles.input}
                    value={tier.capacity || ""}
                    onChange={(e) => updateTier(i, "capacity", e.target.value)}
                    placeholder="Qtd. ingressos"
                  />
                  <button
                    type="button"
                    className={styles.btnRemoveTier}
                    onClick={() => removeTier(i)}
                    disabled={tiers.length <= 1}
                    aria-label="Remover setor"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? "Salvando..." : isEditMode ? "Salvar alterações" : "Criar evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
