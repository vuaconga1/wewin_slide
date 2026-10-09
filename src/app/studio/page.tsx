import { redirect } from "next/navigation";
import { AppHeader } from "@/components/history-lab/app-header";
import { HistoryLab } from "@/components/history-lab/history-lab";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/services/auth/auth.service";
import { lessonService } from "@/services/lessons/lesson.service";
import type { Lesson } from "@/services/lessons/lesson-types";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const query = await searchParams;
  const id = typeof query.id === "string" ? query.id : undefined;
  let initialLesson: Lesson | null = null;
  let loadError = "";
  if (id) {
    try {
      initialLesson = await lessonService.get(id, user);
    } catch (error) {
      loadError = error instanceof AppError ? error.message : "Không mở được bài giảng.";
    }
  }

  return (
    <>
      <AppHeader user={user} />
      <HistoryLab key={id ?? "new"} initialLesson={initialLesson} loadError={loadError} />
    </>
  );
}
