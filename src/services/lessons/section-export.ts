import type { Lesson } from "./lesson-types";
import type { PdfSection } from "./pdf-name";

const ANSWER_LABEL = {
  fact: "FACT",
  interpretation: "INTERPRETATION",
  unsupported: "UNSUPPORTED",
} as const;

function missionPages(lesson: Lesson) {
  const title = lesson.title_vi || lesson.title_en || "Bài giảng";
  const questions = lesson.mission.questions;
  if (questions.length === 0) return [["Time Travel", title, "Nguồn chưa đủ để tạo Time Travel."]];
  return questions.map((question, index) =>
    [
      "Time Travel",
      `Câu ${index + 1}/${questions.length}`,
      question.contextVi,
      question.contextEn,
      question.questionVi,
      question.questionEn,
      ...question.options.map((option, optionIndex) => {
        const label = [option.textVi, option.textEn].filter((part) => part.trim()).join(" / ");
        return `${optionIndex + 1}. ${label}`;
      }),
    ].filter((line) => line.trim()),
  );
}

function singlePage(lesson: Lesson, section: Exclude<PdfSection, "lesson" | "mission">) {
  const title = lesson.title_vi || lesson.title_en || "Bài giảng";
  if (section === "graph") {
    const nodes = lesson.graph.nodes.filter((node) => node.label.trim());
    if (nodes.length === 0) return ["Knowledge Graph", title, "Nguồn chưa đủ để tạo Knowledge Graph."];
    const byId = new Map(nodes.map((node) => [node.id, node.label]));
    const links = lesson.graph.edges.flatMap((edge) => {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return [];
      const label = edge.label.trim();
      return [`${from} -> ${to}${label ? ` (${label})` : ""}`];
    });
    return [
      "Knowledge Graph",
      title,
      ...nodes.map((node) => `${node.type}: ${node.label}`),
      ...(links.length ? ["Liên kết", ...links] : []),
    ];
  }

  if (section === "verify") {
    const challenge = lesson.ai_vs_history.find((item) => item.statement_vi.trim() || item.statement_en.trim());
    if (!challenge) return ["AI vs History", title, "Nguồn chưa đủ để tạo AI vs History."];
    return [
      "AI vs History",
      title,
      challenge.statement_vi,
      challenge.statement_en,
      `Phân loại: ${ANSWER_LABEL[challenge.answer]}`,
      challenge.explanation_vi,
      challenge.explanation_en,
    ].filter((line) => line.trim());
  }

  return ["Learning Analytics", title, "Chưa có dữ liệu học tập."];
}

export function sectionPages(lesson: Lesson, section: Exclude<PdfSection, "lesson">) {
  if (section === "mission") return missionPages(lesson);
  return [singlePage(lesson, section)];
}
