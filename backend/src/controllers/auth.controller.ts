import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { AuthenticatedRequest } from "../middlewares/requireAuth";


// ─── Schemas de validação ─────────────────────────────────────

const registerSchema = z.object({
  name:     z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email:    z.string().email("E-mail inválido"),
  cpf:      z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos (sem pontuação)"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── Controllers ──────────────────────────────────────────────

/** POST /auth/register */
export async function register(req: Request, res: Response): Promise<void> {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const { name, email, cpf, password } = parse.data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { cpf }] },
  });
  if (exists) {
    res.status(409).json({ error: "E-mail ou CPF já cadastrado." });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, cpf, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true },
  });

  const accessToken  = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    })
    .status(201)
    .json({ user, accessToken });
}

/** POST /auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Dados inválidos." });
    return;
  }

  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "E-mail ou senha incorretos." });
    return;
  }

  const accessToken  = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
}

/** POST /auth/refresh */
export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Refresh token não encontrado." });
    return;
  }

  try {
    const payload    = verifyRefreshToken(token);
    const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Refresh token inválido ou expirado." });
  }
}

/** POST /auth/logout */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("refreshToken").json({ message: "Logout realizado com sucesso." });
}

/** GET /auth/me */
export async function getMe(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, cpf: true, role: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  res.json({ user });
}

