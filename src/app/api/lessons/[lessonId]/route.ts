import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { requireUser } from "@/services/auth/auth.service";
import { lessonService } from "@/services/lessons/lesson.service";
import { normalizeLesson } from "@/services/lessons/lesson-types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const user = await requireUser();
    const { lessonId } = await context.params;
    const lesson = await lessonService.get(lessonId, user);
    return NextResponse.json({ lesson });
  } catch (error) {
    return jsonError(error, "Không mở được bài giảng.");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  try {
    const user = await requireUser();
    const { lessonId } = await context.params;
    const lesson = normalizeLesson(await request.json());
    const saved = await lessonService.update(lessonId, lesson, user);
    return NextResponse.json({ lesson: saved });
  } catch (error) {
    return jsonError(error, "Không lưu được bài giảng.");
  }
}
