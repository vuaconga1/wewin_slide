import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { login } from "@/services/auth/auth.service";

const bodySchema = z.object({
  username: z.string().trim().min(1, "Nhập tên đăng nhập."),
  password: z.string().min(1, "Nhập mật khẩu."),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const user = await login(body.username, body.password);
    return NextResponse.json({ user: { username: user.username, role: user.role } });
  } catch (error) {
    return jsonError(error, "Không đăng nhập được.");
  }
}
