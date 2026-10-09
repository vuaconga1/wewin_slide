import { prisma } from "@/services/db/prisma";
import { hashPassword } from "@/services/auth/password";

const DEV_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "ADMIN" as const },
  { username: "user", password: "user123", role: "USER" as const },
];

export async function ensureDevUsers() {
  if (process.env.NODE_ENV === "production") return;

  const emailAdmin = await prisma.user.findUnique({ where: { username: "admin@wewin.local" } });
  const shortAdmin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (emailAdmin && !shortAdmin) {
    await prisma.user.update({
      where: { id: emailAdmin.id },
      data: { username: "admin" },
    });
  }

  for (const account of DEV_ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { username: account.username } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        username: account.username,
        passwordHash: await hashPassword(account.password),
        role: account.role,
      },
    });
  }
}
