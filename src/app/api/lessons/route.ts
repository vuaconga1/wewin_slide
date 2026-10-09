import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/services/auth/auth.service";
import { lessonService, type LessonConfig } from "@/services/lessons/lesson.service";
import { normalizeLesson } from "@/services/lessons/lesson-types";

function textValue(row: Record<string, unknown>, key: string, fallback: string) {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function numberValue(row: Record<string, unknown>, key: string, fallback: number) {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function configFrom(value: unknown, title: string, slideCount: number): LessonConfig {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    topic: textValue(row, "topic", title),
    grade: textValue(row, "grade", "Grade 5"),
    cefr: textValue(row, "cefr", "A2"),
    mode: textValue(row, "mode", "Time Travel"),
    durationMin: numberValue(row, "durationMin", 40),
    requestedCount: numberValue(row, "requestedCount", slideCount),
    template: textValue(row, "template", "auto"),
    notes: textValue(row, "notes", ""),
    sourceText: textValue(row, "sourceText", ""),
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { lesson?: unknown; config?: unknown };
    const lesson = normalizeLesson(body.lesson ?? body);
    const saved = await lessonService.save(
      lesson,
      configFrom(body.config, lesson.title_vi, lesson.slides.length),
      user.id,
    );
    return NextResponse.json({ lesson: saved });
  } catch (error) {
    return jsonError(error, "Không lưu được bài giảng.");
  }
}
