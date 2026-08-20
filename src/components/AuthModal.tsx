"use client";

import { useState, useEffect } from "react";
import styles from "./AuthModal.module.css";
import { useAuth } from "@/lib/auth-context";
import {
  XIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  AlertTriangleIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
} from "./icons";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccess(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "E-mail ou senha incorretos.");
        login(data.user, data.accessToken);
        setSuccess("Login realizado com sucesso! Bem-vindo(a) de volta.");
        setTimeout(() => onClose(), 1200);
      } else {
        const cleanCpf = cpf.replace(/\D/g, "");
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, cpf: cleanCpf, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          const errObj = data.error;
          const msg = typeof errObj === "string" ? errObj : "Verifique os dados informados.";
          throw new Error(msg);
        }
        login(data.user, data.accessToken);
        setSuccess("Cadastro realizado com sucesso! Conectando...");
        setTimeout(() => onClose(), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar solicitação.");
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

        <div className={styles.header}>
          <div className={styles.logoRow}>
            <div className={styles.logoBadge}>EP</div>
            <span className={styles.logoText}>ElitePass</span>
          </div>
          <p className={styles.subtitle}>
            {mode === "login"
              ? "Acesse sua conta para gerenciar ingressos"
              : "Crie sua conta e garanta os melhores eventos"}
          </p>
        </div>

        <div className={styles.tabRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === "login" ? styles.tabActive : ""}`}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${mode === "register" ? styles.tabActive : ""}`}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangleIcon size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successBanner}>
            <CheckIcon size={14} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "register" && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Nome Completo</label>
                <div className={styles.inputWrapper}>
                  <UserIcon size={15} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>CPF (11 dígitos)</label>
                <div className={styles.inputWrapper}>
                  <UserIcon size={15} className={styles.inputIcon} />
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label}>E-mail</label>
            <div className={styles.inputWrapper}>
              <MailIcon size={15} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.input}
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Senha</label>
            <div className={styles.inputWrapper}>
              <LockIcon size={15} className={styles.inputIcon} />
              <input
                type={showPass ? "text" : "password"}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.togglePassBtn}
                onClick={() => setShowPass(!showPass)}
                aria-label="Alternar exibição de senha"
              >
                {showPass ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
              </button>
            </div>
          </div>

          {mode === "login" && (
            <a href="#recuperar" className={styles.forgotLink}>
              Esqueceu a senha?
            </a>
          )}

          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar na Conta"
                : "Criar Minha Conta"}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>ou continuar com</span>
          <div className={styles.dividerLine} />
        </div>
      </div>
    </div>
  );
}
