import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const { id } = await params;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const res = await fetch(`${backendUrl}/api/orders/${id}/confirm`, {
      method: "POST",
      headers: { authorization: authHeader },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/orders/[id]/confirm]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
