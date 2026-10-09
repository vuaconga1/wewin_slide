import dns from "node:dns/promises";
import { mkdir, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import mammoth from "mammoth";

const MAX_CHARS = 40_000;

export type ExtractedSource = {
  text: string;
  images: string[];
  warnings: string[];
};

function htmlToText(html: string) {
  return html
    .replace(/<(script|style|nav|footer)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPrivate(ip: string) {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
}

async function safeUrl(raw: string) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Link chỉ hỗ trợ http/https.");
  }
  const resolved = await dns.lookup(url.hostname);
  if (isPrivate(resolved.address)) {
    throw new Error("Không cho phép địa chỉ nội bộ.");
  }
  return url;
}

async function readPdf(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (
    data: Buffer,
  ) => Promise<{ text: string }>;
  const parsed = await pdfParse(buffer);
  const text = parsed.text.trim();
  if (text.length < 100) {
    throw new Error(
      "PDF có vẻ là ảnh scan. Bản này chưa OCR tự động; hãy dán text hoặc dùng PDF có text.",
    );
  }
  return text;
}

async function saveImage(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name).toLowerCase() || ".png";
  const filename = `${crypto.randomUUID()}${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  return `/uploads/${filename}`;
}

export async function extractSource(input: {
  text?: string;
  url?: string;
  files?: File[];
}): Promise<ExtractedSource> {
  const parts: string[] = [];
  const images: string[] = [];
  const warnings: string[] = [];

  if (input.text?.trim()) parts.push(input.text.trim());

  if (input.url?.trim()) {
    const url = await safeUrl(input.url.trim());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "WeWIN-History-Lab" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Không tải được link (${response.status})`);
      const length = Number(response.headers.get("content-length") || 0);
      if (length > 3_000_000) throw new Error("Trang web quá lớn.");
      parts.push(htmlToText((await response.text()).slice(0, 3_000_000)));
    } finally {
      clearTimeout(timer);
    }
  }

  for (const file of input.files ?? []) {
    if (!file.size) continue;
    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (name.endsWith(".pdf")) {
      parts.push(await readPdf(buffer));
    } else if (name.endsWith(".docx")) {
      parts.push((await mammoth.extractRawText({ buffer })).value);
    } else if (/\.(png|jpe?g|webp|gif)$/.test(name)) {
      images.push(await saveImage(file));
      warnings.push(
        `Đã lưu ảnh ${file.name} để giáo viên đặt vào slide. Hệ thống không dùng AI Vision để tự hiểu ảnh.`,
      );
    } else if (name.endsWith(".txt")) {
      parts.push(buffer.toString("utf8"));
    } else {
      throw new Error(`Định dạng chưa hỗ trợ: ${file.name}`);
    }
  }

  const text = parts.join("\n\n---\n\n").slice(0, MAX_CHARS);
  if (text.length < 80 && images.length === 0) {
    throw new Error("Chưa có đủ tư liệu. Hãy dán text, tải file hoặc nhập link.");
  }
  if (text.length < 80 && images.length > 0) {
    warnings.push("Ảnh không được OCR trong phiên bản này. Hãy dán phần chữ nếu ảnh chứa tư liệu.");
  }

  return { text, images, warnings };
}
