import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { logout } from "@/services/auth/auth.service";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Không đăng xuất được.");
  }
}
