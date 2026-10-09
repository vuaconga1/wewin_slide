export const PDF_SECTIONS = ["lesson", "graph", "mission", "verify", "report"] as const;
export type PdfSection = (typeof PDF_SECTIONS)[number];

const SECTION_FILE: Record<Exclude<PdfSection, "lesson">, string> = {
  graph: "Knowledge Graph",
  mission: "Time Travel",
  verify: "AI vs History",
  report: "Learning Analytics",
};

export function pdfSection(value: unknown): PdfSection {
  return typeof value === "string" && (PDF_SECTIONS as readonly string[]).includes(value)
    ? (value as PdfSection)
    : "lesson";
}

export function pdfFileName(title: string, section: PdfSection = "lesson") {
  const safe = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const base = safe || "lesson";
  if (section === "lesson") return `${base}.pdf`;
  return `${base} - ${SECTION_FILE[section]}.pdf`;
}
