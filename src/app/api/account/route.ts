import { NextRequest, NextResponse } from "next/server";

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: "CLIENT" | "ORGANIZER" | "DOORMAN";
  phone: string | null;
  birthDate: string | null;
  addressCep: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
}

const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  try {
    const res = await fetch(`${backendUrl}/api/account/me`, {
      cache: "no-store",
      headers: { authorization: authHeader },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/account GET]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  try {
    const body = await req.text();
    const res = await fetch(`${backendUrl}/api/account/profile`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: authHeader },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/account PATCH]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
