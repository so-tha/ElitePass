"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
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

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"pessoais" | "seguranca" | "endereco" | "pagamento">("pessoais");

  // User Profile Form State
  const [name, setName] = useState("Gabriel Silva");
  const [email, setEmail] = useState("gabriel.silva@exemplo.com");
  const [cpf, setCpf] = useState("123.456.789-00");
  const [phone, setPhone] = useState("(11) 98765-4321");
  const [birthDate, setBirthDate] = useState("1998-05-14");

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState(true);

  // Address Form State
  const [cep, setCep] = useState("01310-100");
  const [street, setStreet] = useState("Avenida Paulista");
  const [number, setNumber] = useState("1000");
  const [complement, setComplement] = useState("Apto 42");
  const [neighborhood, setNeighborhood] = useState("Bela Vista");
  const [city, setCity] = useState("São Paulo");
  const [state, setState] = useState("SP");

  // Feedback State
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage(null);

    setTimeout(() => {
      setSaving(false);
      setToastMessage("Suas informações foram atualizadas com sucesso!");
      setTimeout(() => setToastMessage(null), 4000);
    }, 800);
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName.slice(0, 2).toUpperCase() || "EP";
  };

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        {/* ── ACCOUNT HERO HEADER ── */}
        <div className={styles.accountHeader}>
          <div className={styles.userSummary}>
            <div className={styles.avatarBadge}>{getInitials(name)}</div>
            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{name}</h1>
              <div className={styles.userEmail}>
                <span>{email}</span>
                <span className={styles.vipBadge}>★ Membro VIP</span>
              </div>
            </div>
          </div>

          <button
            className={styles.logoutBtn}
            onClick={() => {
              if (confirm("Deseja realmente sair da sua conta?")) {
                window.location.href = "/";
              }
            }}
          >
            Sair da Conta
          </button>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className={styles.contentGrid}>
          {/* ── SIDEBAR NAVIGATION ── */}
          <aside className={styles.sidebarNav}>
            <button
              className={`${styles.navItem} ${activeTab === "pessoais" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("pessoais")}
            >
              <UserIcon size={18} />
              <span>Dados Pessoais</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === "seguranca" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("seguranca")}
            >
              <LockIcon size={18} />
              <span>Segurança & Senha</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === "endereco" ? styles.navItemActive : ""}`}
              onClick={() => setActiveTab("endereco")}
            >
              <MapPinIcon size={18} />
              <span>Endereço de Cobrança</span>
            </button>

            <button
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

            {/* TAB 1: DADOS PESSOAIS */}
            {activeTab === "pessoais" && (
              <form onSubmit={handleSave} className={styles.formGrid}>
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
                    <span className={styles.inputBadge}>Verificado</span>
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
                      onChange={(e) => setCpf(e.target.value)}
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

                <div className={`${styles.formFooter} ${styles.fullWidth}`}>
                  <button type="button" className={styles.btnCancel} onClick={() => window.location.reload()}>
                    Descartar
                  </button>
                  <button type="submit" className={styles.btnSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SEGURAÇA & SENHA */}
            {activeTab === "seguranca" && (
              <form onSubmit={handleSave} className={styles.formGrid}>
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
                    />
                  </div>
                </div>

                <div className={`${styles.formFooter} ${styles.fullWidth}`}>
                  <button type="submit" className={styles.btnSave} disabled={saving}>
                    {saving ? "Atualizando..." : "Alterar Senha"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: ENDEREÇO DE COBRANÇA */}
            {activeTab === "endereco" && (
              <form onSubmit={handleSave} className={styles.formGrid}>
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
                    />
                  </div>
                </div>

                <div className={`${styles.formFooter} ${styles.fullWidth}`}>
                  <button type="submit" className={styles.btnSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Endereço"}
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
                    Seus cartões cadastrados para compra express em 1-clique.
                  </p>
                </div>

                <div className={`${styles.cardsGrid} ${styles.fullWidth}`}>
                  <div className={styles.creditCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardBrand}>VISA</span>
                      <span className={styles.cardDefault}>Principal</span>
                    </div>
                    <p className={styles.cardNumber}>•••• •••• •••• 4242</p>
                    <div className={styles.cardFooter}>
                      <span>GABRIEL SILVA</span>
                      <span>12/28</span>
                    </div>
                  </div>

                  <div className={styles.creditCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardBrand}>MASTERCARD</span>
                    </div>
                    <p className={styles.cardNumber}>•••• •••• •••• 8819</p>
                    <div className={styles.cardFooter}>
                      <span>GABRIEL SILVA</span>
                      <span>09/27</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.btnAddCard}
                    onClick={() => alert("Adicionar cartão em breve!")}
                  >
                    <PlusIcon size={22} />
                    <span>Adicionar Novo Cartão</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
