import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Lesson } from "./lesson-types";

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

export async function renderLessonPdf(lesson: Lesson) {
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "fonts", "BeVietnamPro-Regular.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "BeVietnamPro-Bold.ttf")),
  ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
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
