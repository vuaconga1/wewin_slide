import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/services/auth/auth.service";
import { generateLesson } from "@/services/lessons/generate-lesson";
import { lessonService } from "@/services/lessons/lesson.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const files = form
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);
    const count = Number(form.get("count") || 10);
    const duration = Number(form.get("duration") || 40);
    const generated = await generateLesson({
      topic: String(form.get("topic") || "").trim(),
      text: String(form.get("text") || ""),
      url: String(form.get("url") || ""),
      grade: String(form.get("grade") || "Grade 5"),
      cefr: String(form.get("cefr") || "A2"),
      mode: String(form.get("mode") || "Time Travel"),
      count: Number.isFinite(count) ? count : 10,
      duration: Number.isFinite(duration) ? duration : 40,
      template: String(form.get("template") || "auto"),
      notes: String(form.get("notes") || ""),
      files,
    });

    if (!generated.lesson.title_vi.trim()) {
      throw new Error("Nhập chủ đề.");
    }

    try {
      const saved = await lessonService.save(generated.lesson, {
        topic: String(form.get("topic") || generated.lesson.title_vi),
        grade: String(form.get("grade") || "Grade 5"),
        cefr: String(form.get("cefr") || "A2"),
        mode: String(form.get("mode") || "Time Travel"),
        durationMin: duration,
        requestedCount: count,
        template: String(form.get("template") || "auto"),
        notes: String(form.get("notes") || ""),
        sourceText: generated.sourceText,
      }, user.id);
      return NextResponse.json({ lesson: saved });
    } catch (error) {
      console.error(error instanceof Error ? error.name : "save-failed");
      return NextResponse.json({
        lesson: {
          ...generated.lesson,
          warnings: [
            ...generated.lesson.warnings,
            "Chưa lưu được vào cơ sở dữ liệu. Bài giảng vẫn xem và chỉnh trong phiên này.",
          ],
        },
      });
    }
  } catch (error) {
    return jsonError(error, "Không tạo được bài giảng.");
  }
}
