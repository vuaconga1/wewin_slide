import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/services/auth/auth.service";
import { normalizeLesson } from "@/services/lessons/lesson-types";
import { pdfFileName, pdfSection } from "@/services/lessons/pdf-name";
import { renderLessonPdf } from "@/services/lessons/render-pdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = (await request.json()) as { lesson?: unknown; section?: unknown };
    const section = pdfSection(body.section);
    const lesson = normalizeLesson(body.lesson ?? body);
    const bytes = await renderLessonPdf(lesson, section);
    const filename = pdfFileName(lesson.title_vi || lesson.title_en || "lesson", section);
    const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "");
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return jsonError(error, "Không tải được PDF.");
  }
}
