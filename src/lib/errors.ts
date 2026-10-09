import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: "VALIDATION" | "NOT_FOUND" | "DATABASE" | "UNAUTHORIZED" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function messageFromUnknown(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
  }

  if (error instanceof AppError) {
    return error.message;
  }

  return "Không kết nối được cơ sở dữ liệu. Kiểm tra DATABASE_URL rồi chạy npm run db:push.";
}
