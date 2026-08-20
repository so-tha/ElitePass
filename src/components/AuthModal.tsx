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

        <button
          type="button"
          className={styles.btnGoogle}
          onClick={() => {
            setError(null);
            setSuccess("Login via Google estará disponível em breve.");
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          Google
        </button>
      </div>
    </div>
  );
}
