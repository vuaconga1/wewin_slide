import type { Lesson } from "@/services/lessons/lesson-types";
import { pdfFileName } from "@/services/lessons/pdf-name";

export async function downloadLessonPdf(lesson: Lesson) {
  const response = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lesson),
  });
  if (!response.ok) {
    let message = "Không tải được PDF.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      message = "Không tải được PDF.";
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pdfFileName(lesson.title_vi || lesson.title_en || "lesson");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
