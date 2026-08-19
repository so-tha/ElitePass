import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const res = await fetch(`${backendUrl}/api/events/${id}`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/organizer/events/[id]] GET", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.text();
    const res = await fetch(`${backendUrl}/api/events/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: authHeader },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/organizer/events/[id]] PUT", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const res = await fetch(`${backendUrl}/api/events/${id}`, {
      method: "DELETE",
      headers: { authorization: authHeader },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/organizer/events/[id]] DELETE", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
