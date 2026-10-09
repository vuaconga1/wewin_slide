import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/services/db/prisma";
import { AppError } from "@/lib/errors";
import { ensureDevUsers } from "@/services/auth/dev-accounts";
import { verifyPassword } from "@/services/auth/password";
import type { SessionUser } from "@/services/auth/types";

export const SESSION_COOKIE = "wewin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("Đăng nhập để tiếp tục.", "UNAUTHORIZED");
  return user;
}

export async function login(username: string, password: string): Promise<SessionUser> {
  await ensureDevUsers();
  const user = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError("Sai tên đăng nhập hoặc mật khẩu.", "UNAUTHORIZED");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions(SESSION_SECONDS));
  return { id: user.id, username: user.username, role: user.role };
}

export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => undefined);
  }
  store.set(SESSION_COOKIE, "", cookieOptions(0));
}
