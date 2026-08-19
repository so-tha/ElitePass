import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthenticatedRequest } from "../middlewares/requireAuth";

const profileSelect = {
  id: true,
  name: true,
  email: true,
  cpf: true,
  role: true,
  phone: true,
  birthDate: true,
  addressCep: true,
  addressStreet: true,
  addressNumber: true,
  addressComplement: true,
  addressNeighborhood: true,
  addressCity: true,
  addressState: true,
  companyName: true,
  companyCnpj: true,
  companyEmail: true,
  companyPhone: true,
  createdAt: true,
} as const;

/** GET /account/me — Dados completos do usuário logado (perfil + endereço) */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: profileSelect });
  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  res.json({ user });
}

const updateProfileSchema = z.object({
  name:      z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email:     z.string().email("E-mail inválido"),
  cpf:       z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos (sem pontuação)"),
  phone:     z.string().trim().min(1, "Telefone obrigatório"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida"),
});

/** PATCH /account/profile — Atualiza nome, e-mail, CPF, telefone e data de nascimento */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const { name, email, cpf, phone, birthDate } = parse.data;

  const conflict = await prisma.user.findFirst({
    where: { OR: [{ email }, { cpf }], NOT: { id: userId } },
  });
  if (conflict) {
    res.status(409).json({ error: "E-mail ou CPF já está em uso por outra conta." });
    return;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email, cpf, phone, birthDate },
    select: profileSelect,
  });

  res.json({ user });
}

const updateAddressSchema = z.object({
  cep:          z.string().trim().min(1, "CEP obrigatório"),
  street:       z.string().trim().min(1, "Endereço obrigatório"),
  number:       z.string().trim().min(1, "Número obrigatório"),
  complement:   z.string().trim().optional().default(""),
  neighborhood: z.string().trim().min(1, "Bairro obrigatório"),
  city:         z.string().trim().min(1, "Cidade obrigatória"),
  state:        z.string().trim().min(2, "Estado obrigatório"),
});

/** PATCH /account/address — Atualiza o endereço de cobrança do usuário logado */
export async function updateAddress(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = updateAddressSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const { cep, street, number, complement, neighborhood, city, state } = parse.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      addressCep: cep,
      addressStreet: street,
      addressNumber: number,
      addressComplement: complement,
      addressNeighborhood: neighborhood,
      addressCity: city,
      addressState: state,
    },
    select: profileSelect,
  });

  res.json({ user });
}

const updateOrganizationSchema = z.object({
  companyName:  z.string().trim().min(1, "Nome da produtora é obrigatório"),
  companyCnpj:  z.string().trim().min(1, "CNPJ é obrigatório"),
  companyEmail: z.string().trim().email("E-mail comercial inválido"),
  companyPhone: z.string().trim().min(1, "Telefone de suporte é obrigatório"),
});

/** PATCH /account/organization — Atualiza os dados da produtora (ORGANIZER) */
export async function updateOrganization(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = updateOrganizationSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const { companyName, companyCnpj, companyEmail, companyPhone } = parse.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { companyName, companyCnpj, companyEmail, companyPhone },
    select: profileSelect,
  });

  res.json({ user });
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
  newPassword:     z.string().min(8, "Nova senha deve ter ao menos 8 caracteres"),
});

/** PATCH /account/password — Troca a senha do usuário logado */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = changePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const { currentPassword, newPassword } = parse.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    res.status(401).json({ error: "Senha atual incorreta." });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

  res.json({ message: "Senha atualizada com sucesso." });
}
