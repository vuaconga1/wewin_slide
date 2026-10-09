import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/services/auth/auth.service";

export async function POST(request: Request) {
  try {
    await requireUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Chọn một hình ảnh.");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Chỉ nhận file hình ảnh.");
    }
    if (file.size > 8_000_000) throw new Error("Ảnh lớn hơn 8MB.");

    const extension = path.extname(file.name).toLowerCase() || ".png";
    const filename = `${crypto.randomUUID()}${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    return jsonError(error, "Không tải được ảnh.");
  }
}
