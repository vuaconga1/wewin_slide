export function pdfFileName(title: string) {
  const safe = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${safe || "lesson"}.pdf`;
}
