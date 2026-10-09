import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Lesson } from "./lesson-types";
import type { PdfSection } from "./pdf-name";

const PAGE_WIDTH = 960;
const PAGE_HEIGHT = 540;
const MARGIN = 48;

const navy = rgb(0.024, 0.102, 0.227);
const white = rgb(1, 1, 1);
const gold = rgb(1, 0.851, 0.545);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
        continue;
      }
      if (current) lines.push(current);
      current = word;
    }
    if (current) lines.push(current);
  }
  return lines;
}

function drawLines(
  page: PDFPage,
  lines: string[],
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  y: number,
  gap: number,
) {
  let cursor = y;
  for (const line of lines) {
    if (cursor < MARGIN) break;
    if (line) {
      page.drawText(line, { x: MARGIN, y: cursor, size, font, color });
    }
    cursor -= size + gap;
  }
  return cursor;
}

const ANSWER_LABEL = {
  fact: "FACT",
  interpretation: "INTERPRETATION",
  unsupported: "UNSUPPORTED",
} as const;

function sectionLines(lesson: Lesson, section: Exclude<PdfSection, "lesson">) {
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

  if (section === "mission") {
    const mission = lesson.mission;
    const choices = mission?.choices.filter((choice) => choice.vi.trim() || choice.en.trim()) ?? [];
    const hasCopy = Boolean(
      mission &&
        (mission.scene_vi.trim() ||
          mission.scene_en.trim() ||
          mission.question_vi.trim() ||
          mission.question_en.trim() ||
          choices.length > 0),
    );
    if (!mission || !hasCopy) return ["Time Travel", title, "Nguồn chưa đủ để tạo Time Travel."];
    return [
      "Time Travel",
      title,
      mission.scene_vi,
      mission.scene_en,
      mission.question_vi,
      mission.question_en,
      ...choices.flatMap((choice, index) => [
        `${index + 1}. ${[choice.vi, choice.en].filter((part) => part.trim()).join(" / ")}`,
        choice.consequence_vi.trim() ? `Hệ quả: ${choice.consequence_vi}` : "",
        choice.consequence_en.trim() ? `Consequence: ${choice.consequence_en}` : "",
      ]),
    ].filter((line) => line.trim());
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

async function openDocument() {
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "fonts", "BeVietnamPro-Regular.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "BeVietnamPro-Bold.ttf")),
  ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  return { doc, regular, bold };
}

function paintLines(doc: PDFDocument, regular: PDFFont, bold: PDFFont, lines: string[]) {
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: navy });
  let y = PAGE_HEIGHT - MARGIN - 8;

  const nextPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: navy });
    y = PAGE_HEIGHT - MARGIN - 8;
  };

  lines.forEach((line, index) => {
    const heading = index < 2;
    const size = index === 0 ? 14 : index === 1 ? 28 : 16;
    const font = heading ? bold : regular;
    const color = index === 0 ? gold : white;
    const wrapped = wrapText(line, font, size, maxWidth);
    for (const row of wrapped) {
      if (y < MARGIN + size) nextPage();
      if (row) page.drawText(row, { x: MARGIN, y, size, font, color });
      y -= size + (heading ? 8 : 6);
    }
    y -= heading ? 6 : 4;
  });
}

export async function renderLessonPdf(lesson: Lesson, section: PdfSection = "lesson") {
  if (section !== "lesson") {
    const { doc, regular, bold } = await openDocument();
    paintLines(doc, regular, bold, sectionLines(lesson, section));
    return doc.save();
  }

  const { doc, regular, bold } = await openDocument();
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  lesson.slides.forEach((slide, index) => {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: navy });
    let y = PAGE_HEIGHT - MARGIN - 14;
    page.drawText(`${index + 1} / ${lesson.slides.length}`, {
      x: MARGIN,
      y,
      size: 12,
      font: regular,
      color: gold,
    });
    y -= 36;
    y = drawLines(page, wrapText(slide.title_vi || slide.title_en || "Slide", bold, 28, maxWidth).slice(0, 2), bold, 28, white, y, 6);
    y -= 8;
    if (slide.title_en) {
      y = drawLines(page, wrapText(slide.title_en, regular, 16, maxWidth).slice(0, 2), regular, 16, gold, y, 4);
      y -= 10;
    }
    y = drawLines(page, wrapText(slide.body_vi, regular, 16, maxWidth).slice(0, 8), regular, 16, white, y, 5);
    y -= 8;
    if (slide.body_en) {
      drawLines(page, wrapText(slide.body_en, regular, 14, maxWidth).slice(0, 8), regular, 14, gold, y, 4);
    }
  });

  if (doc.getPageCount() === 0) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: navy });
    page.drawText(lesson.title_vi || "Lesson", { x: MARGIN, y: PAGE_HEIGHT / 2, size: 28, font: bold, color: white });
  }

  return doc.save();
}
