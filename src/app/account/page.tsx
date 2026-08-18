"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  CheckIcon,
  TicketIcon,
  MapPinIcon,
  PlusIcon,
  AlertTriangleIcon,
} from "@/components/icons";
import type { AccountProfile, UpdateProfilePayload } from "@/app/api/account/route";
import type { UpdateAddressPayload } from "@/app/api/account/address/route";
import type { ChangePasswordPayload } from "@/app/api/account/password/route";

const maskCPF = (v: string) =>
  v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);

export default function AccountPage() {
  const router = useRouter();
  const { user, accessToken, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"pessoais" | "seguranca" | "endereco" | "pagamento">("pessoais");

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  // User Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Address Form State
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Feedback & Modal State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const applyProfile = (p: AccountProfile) => {
    setProfile(p);
    setName(p.name);
    setEmail(p.email);
    setCpf(maskCPF(p.cpf));
    setPhone(p.phone ?? "");
    setBirthDate(p.birthDate ?? "");
    setCep(p.addressCep ?? "");
    setStreet(p.addressStreet ?? "");
    setNumber(p.addressNumber ?? "");
    setComplement(p.addressComplement ?? "");
    setNeighborhood(p.addressNeighborhood ?? "");
    setCity(p.addressCity ?? "");
    setState(p.addressState ?? "");
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/");
  }, [authLoading, user, router]);

  const fetchProfile = useCallback(async () => {
    if (!accessToken) return;
    setProfileLoading(true);
    setProfileLoadError(null);
    try {
      const res = await fetch("/api/account", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar seus dados.");
      applyProfile(data.user as AccountProfile);
    } catch (err) {
      setProfileLoadError(err instanceof Error ? err.message : "Erro ao carregar seus dados.");
    } finally {
      setProfileLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading || !user || !accessToken) return;
    fetchProfile();
  }, [authLoading, user, accessToken, fetchProfile]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const payload: UpdateProfilePayload = { name, email, cpf: cpf.replace(/\D/g, ""), phone, birthDate };
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível salvar seus dados.");
      applyProfile(data.user as AccountProfile);
      showToast("Suas informações foram atualizadas com sucesso!");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Não foi possível salvar seus dados.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação não corresponde à nova senha.");
      return;
    }

    setPasswordSaving(true);
    try {
      const payload: ChangePasswordPayload = { currentPassword, newPassword };
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível trocar sua senha.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Senha atualizada com sucesso!");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Não foi possível trocar sua senha.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setAddressSaving(true);
    setAddressError(null);
    try {
      const payload: UpdateAddressPayload = { cep, street, number, complement, neighborhood, city, state };
      const res = await fetch("/api/account/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível salvar o endereço.");
      applyProfile(data.user as AccountProfile);
      showToast("Endereço atualizado com sucesso!");
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Não foi possível salvar o endereço.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName.slice(0, 2).toUpperCase() || "EP";
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        {/* ── ACCOUNT HERO HEADER ── */}
        <div className={styles.accountHeader}>
          <div className={styles.userSummary}>
            <div className={styles.avatarBadge}>{getInitials(name || user.name)}</div>
            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{name || user.name}</h1>
              <div className={styles.userEmail}>
                <span>{email || user.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={() => setShowLogoutModal(true)}
          >
            Sair da Conta
          </button>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className={styles.contentGrid}>
          {/* ── SIDEBAR NAVIGATION ── */}
          <aside className={styles.sidebarNav}>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "pessoais" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("pessoais")}
            >
              <UserIcon size={18} />
              <span>Dados Pessoais</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "seguranca" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("seguranca")}
            >
              <LockIcon size={18} />
              <span>Segurança & Senha</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "endereco" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("endereco")}
            >
              <MapPinIcon size={18} />
              <span>Endereço de Cobrança</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "pagamento" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("pagamento")}
            >
              <TicketIcon size={18} />
              <span>Cartões & Pagamento</span>
            </button>
          </aside>

          {/* ── FORM CONTENT PANELS ── */}
          <section className={styles.panelCard}>
            {toastMessage && (
              <div className={styles.toastSuccess}>
                <CheckIcon size={16} />
                <span>{toastMessage}</span>
              </div>
            )}

            {profileLoadError && (
              <p className={styles.panelDesc} style={{ color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangleIcon size={14} /> {profileLoadError}
              </p>
            )}

            {profileLoading ? (
              <p className={styles.panelDesc}>Carregando seus dados...</p>
            ) : (
              <>
                {/* TAB 1: DADOS PESSOAIS */}
                {activeTab === "pessoais" && (
                  <form onSubmit={handleSaveProfile} className={styles.formGrid}>
                    <div className={styles.panelHeader + " " + styles.fullWidth}>
                      <h2 className={styles.panelTitle}>Dados Pessoais</h2>
                      <p className={styles.panelDesc}>
                        Mantenha seus dados atualizados para emissão correta dos seus ingressos nominais.
                      </p>
                    </div>

                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label className={styles.label}>Nome Completo</label>
                      <div className={styles.inputWrapper}>
                        <UserIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>E-mail Principal</label>
                      <div className={styles.inputWrapper}>
                        <MailIcon size={16} className={styles.inputIcon} />
                        <input
                          type="email"
                          className={styles.input}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>CPF (titular do ingresso)</label>
                      <div className={styles.inputWrapper}>
                        <UserIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={cpf}
                          onChange={(e) => setCpf(maskCPF(e.target.value))}
                          placeholder="000.000.000-00"
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Telefone / WhatsApp (para avisos do evento)</label>
                      <div className={styles.inputWrapper}>
                        <UserIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Data de Nascimento</label>
                      <div className={styles.inputWrapper}>
                        <UserIcon size={16} className={styles.inputIcon} />
                        <input
                          type="date"
                          className={styles.input}
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {profileError && (
                      <p className={`${styles.fullWidth}`} style={{ color: "#f87171", fontSize: 13 }}>{profileError}</p>
                    )}

                    <div className={`${styles.formFooter} ${styles.fullWidth}`}>
                      <button type="button" className={styles.btnCancel} onClick={() => profile && applyProfile(profile)}>
                        Descartar
                      </button>
                      <button type="submit" className={styles.btnSave} disabled={profileSaving}>
                        {profileSaving ? "Salvando..." : "Salvar Alterações"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: SEGURAÇA & SENHA */}
                {activeTab === "seguranca" && (
                  <form onSubmit={handleSavePassword} className={styles.formGrid}>
                    <div className={styles.panelHeader + " " + styles.fullWidth}>
                      <h2 className={styles.panelTitle}>Segurança & Acesso</h2>
                      <p className={styles.panelDesc}>
                        Gerencie sua senha de acesso e proteja a segurança dos seus bilhetes digitais.
                      </p>
                    </div>

                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label className={styles.label}>Senha Atual</label>
                      <div className={styles.inputWrapper}>
                        <LockIcon size={16} className={styles.inputIcon} />
                        <input
                          type="password"
                          className={styles.input}
                          placeholder="Digite sua senha atual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Nova Senha</label>
                      <div className={styles.inputWrapper}>
                        <LockIcon size={16} className={styles.inputIcon} />
                        <input
                          type="password"
                          className={styles.input}
                          placeholder="Mínimo 8 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Confirmar Nova Senha</label>
                      <div className={styles.inputWrapper}>
                        <LockIcon size={16} className={styles.inputIcon} />
                        <input
                          type="password"
                          className={styles.input}
                          placeholder="Repita a nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <p className={`${styles.fullWidth}`} style={{ color: "#f87171", fontSize: 13 }}>{passwordError}</p>
                    )}

                    <div className={`${styles.formFooter} ${styles.fullWidth}`}>
                      <button type="submit" className={styles.btnSave} disabled={passwordSaving}>
                        {passwordSaving ? "Atualizando..." : "Alterar Senha"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 3: ENDEREÇO DE COBRANÇA */}
                {activeTab === "endereco" && (
                  <form onSubmit={handleSaveAddress} className={styles.formGrid}>
                    <div className={styles.panelHeader + " " + styles.fullWidth}>
                      <h2 className={styles.panelTitle}>Endereço de Cobrança</h2>
                      <p className={styles.panelDesc}>
                        Endereço utilizado para checagem antifraude em pagamentos com cartão de crédito.
                      </p>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>CEP</label>
                      <div className={styles.inputWrapper}>
                        <MapPinIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={cep}
                          onChange={(e) => setCep(e.target.value)}
                          placeholder="00000-000"
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Estado</label>
                      <div className={styles.inputWrapper}>
                        <MapPinIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={`${styles.field} ${styles.fullWidth}`}>
                      <label className={styles.label}>Endereço / Logradouro</label>
                      <div className={styles.inputWrapper}>
                        <MapPinIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Número</label>
                      <div className={styles.inputWrapper}>
                        <MapPinIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Complemento</label>
                      <div className={styles.inputWrapper}>
                        <MapPinIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Bairro</label>
                      <div className={styles.inputWrapper}>
                        <MapPinIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={neighborhood}
                          onChange={(e) => setNeighborhood(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Cidade</label>
                      <div className={styles.inputWrapper}>
                        <MapPinIcon size={16} className={styles.inputIcon} />
                        <input
                          type="text"
                          className={styles.input}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {addressError && (
                      <p className={`${styles.fullWidth}`} style={{ color: "#f87171", fontSize: 13 }}>{addressError}</p>
                    )}

                    <div className={`${styles.formFooter} ${styles.fullWidth}`}>
                      <button type="submit" className={styles.btnSave} disabled={addressSaving}>
                        {addressSaving ? "Salvando..." : "Salvar Endereço"}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 4: CARTÕES & PAGAMENTO */}
                {activeTab === "pagamento" && (
                  <div className={styles.formGrid}>
                    <div className={styles.panelHeader + " " + styles.fullWidth}>
                      <h2 className={styles.panelTitle}>Cartões Salvos</h2>
                      <p className={styles.panelDesc}>
                        O cadastro de cartões estará disponível em breve no ambiente seguro do gateway de pagamento.
                      </p>
                    </div>

                    <div className={`${styles.cardsGrid} ${styles.fullWidth}`}>
                      <button
                        type="button"
                        className={styles.btnAddCard}
                        onClick={() => setShowCardModal(true)}
                      >
                        <PlusIcon size={20} />
                        <span>Adicionar Novo Cartão</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* ── CUSTOM IN-APP CONFIRMATION POPUPS ── */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Encerrar Sessão"
        description="Tem certeza de que deseja sair da sua conta na ElitePass?"
        confirmText="Sair"
        cancelText="Cancelar"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        onConfirm={() => {}}
        title="Adicionar Cartão"
        description="O cadastro de novos cartões de crédito estará disponível em breve no ambiente seguro do gateway."
        confirmText="Entendido"
        cancelText="Fechar"
        variant="default"
      />
    </div>
  );
}
