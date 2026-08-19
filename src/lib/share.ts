export interface ShareResult {
  message: string | null;
}

/** Compartilha um link via Web Share API (mobile/apps compatíveis) ou copia para a área de transferência. */
export async function shareLink(url: string, title: string, text: string): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { message: null };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return { message: null };
      // navigator.share falhou por outro motivo — cai para o fallback de copiar abaixo
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return { message: "Link copiado para a área de transferência!" };
  } catch {
    return { message: "Não foi possível compartilhar automaticamente. Copie o link manualmente." };
  }
}

export function buildTicketShareUrl(shareToken: string): string {
  return `${window.location.origin}/ticket/${shareToken}`;
}
