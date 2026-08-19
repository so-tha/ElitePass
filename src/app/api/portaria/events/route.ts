import { NextRequest, NextResponse } from "next/server";

export interface PortariaEventItem {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  imageUrl: string | null;
}

/**
 * GET /api/portaria/events
 *
 * Lista os eventos locais publicados (criados por organizadores nesta plataforma)
 * para a portaria escolher em qual evento está validando a entrada.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const res = await fetch(`${backendUrl}/api/events`, {
      cache: "no-store",
      headers: { authorization: authHeader },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/portaria/events]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
