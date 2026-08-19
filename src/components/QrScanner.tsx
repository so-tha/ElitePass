"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import styles from "./QrScanner.module.css";

interface QrScannerProps {
  onDecode: (text: string) => void;
  /** Quando true, a câmera é desligada (ex.: enquanto um resultado é exibido). */
  paused: boolean;
}

const ELEMENT_ID = "portaria-qr-reader";

export function QrScanner({ onDecode, paused }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onDecodeRef = useRef(onDecode);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    if (paused) {
      return () => {
        setReady(false);
        setError(null);
      };
    }

    let cancelled = false;

    const instance = new Html5Qrcode(ELEMENT_ID);
    scannerRef.current = instance;

    const startPromise = instance
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => onDecodeRef.current(decodedText),
        () => {
          /* erro de leitura por frame — ignorado, é normal enquanto não há QR no quadro */
        }
      )
      .then(() => {
        if (!cancelled) setReady(true);
        return true;
      })
      .catch(() => {
        if (!cancelled) {
          setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
        }
        return false;
      });

    return () => {
      cancelled = true;
      scannerRef.current = null;
      startPromise.then((started) => {
        if (!started) return;
        instance
          .stop()
          .then(() => instance.clear())
          .catch(() => {});
      });
    };
  }, [paused]);

  return (
    <div className={styles.wrapper}>
      <div id={ELEMENT_ID} className={styles.reader} />
      {paused && <div className={styles.overlay}>Câmera pausada</div>}
      {!paused && !ready && !error && <div className={styles.overlay}>Iniciando câmera...</div>}
      {!paused && error && <div className={styles.overlayError}>{error}</div>}
      {!paused && ready && <div className={styles.hint}>Aponte a câmera para o QR Code do ingresso</div>}
    </div>
  );
}
