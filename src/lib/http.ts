import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

function statusFor(error: AppError) {
  if (error.code === "UNAUTHORIZED") return 401;
  if (error.code === "FORBIDDEN") return 403;
  if (error.code === "NOT_FOUND") return 404;
  if (error.code === "DATABASE") return 503;
  return 400;
}

export function jsonError(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: statusFor(error) });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    const secret = /postgres:\/\/|OPENAI|API_KEY|\bsk-/i.test(error.message);
    return NextResponse.json({ error: secret ? fallback : error.message || fallback }, { status: 400 });
  }

  return NextResponse.json({ error: fallback }, { status: 400 });
}
