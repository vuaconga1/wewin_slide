import {
  readCauseEffect,
  readCharacter,
  readComparison,
  readContext,
  readMap,
  readObjectives,
  readSummary,
  readTimeline,
  type TimelineItem,
} from "./layout-catalog";
import type { LessonSlide, SlideElements } from "./lesson-types";

export type TextOp =
  | { type: "title"; field: "vi" | "en" }
  | { type: "body"; field: "vi" | "en" }
  | { type: "idea"; region: "body" | "context" | "summary" | "map"; index: number; field: "vi" | "en" }
  | { type: "lines"; region: "objectives" | "summary-point" | "know" | "caption"; index: number; field: "vi" | "en" }
  | { type: "timeline"; index: number; part: "label" | "vi" | "en" }
  | { type: "cause"; section: number; point: number; field: "vi" | "en" }
  | { type: "compare-label"; side: "a" | "b"; field: "vi" | "en" }
  | { type: "compare-point"; side: "a" | "b"; index: number; field: "vi" | "en" }
  | { type: "compare-end"; field: "vi" | "en" }
  | { type: "character"; part: "name" | "role" | "action" | "meaning" | "narrative"; field: "vi" | "en" }
  | { type: "map"; part: "place" | "description"; field: "vi" | "en" }
  | { type: "vocab"; index: number; part: "en" | "vi" | "example" }
  | { type: "question"; field: "vi" | "en" }
  | { type: "choice"; index: number; field: "vi" | "en" };

export type TextSlot = { id: string; op: TextOp };

const CAUSE_VI = ["Nguyên nhân", "Diễn biến", "Hệ quả"] as const;
const CAUSE_EN = ["Cause", "Development", "Consequence"] as const;

export function splitIdeas(text: string) {
  const bits = text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (bits.length <= 3) return bits;
  const ideas: string[] = [];
  let bucket = "";
  for (const bit of bits) {
    if (ideas.length >= 2) {
      bucket = bucket ? `${bucket} ${bit}` : bit;
      continue;
    }
    const next = bucket ? `${bucket} ${bit}` : bit;
    if (bucket && next.length > 150) {
      ideas.push(bucket);
      bucket = bit;
    } else {
      bucket = next;
      if (bucket.length >= 90) {
        ideas.push(bucket);
        bucket = "";
      }
    }
  }
  if (bucket) ideas.push(bucket);
  return ideas.slice(0, 3);
}

export function textKey(slot: TextSlot) {
  const op = slot.op;
  switch (op.type) {
    case "title":
      return `${slot.id}:title:${op.field}`;
    case "body":
      return `${slot.id}:body:${op.field}`;
    case "idea":
      return `${slot.id}:idea:${op.region}:${op.index}:${op.field}`;
    case "lines":
      return `${slot.id}:lines:${op.region}:${op.index}:${op.field}`;
    case "timeline":
      return `${slot.id}:time:${op.index}:${op.part}`;
    case "cause":
      return `${slot.id}:cause:${op.section}:${op.point}:${op.field}`;
    case "compare-label":
      return `${slot.id}:cmp-label:${op.side}:${op.field}`;
    case "compare-point":
      return `${slot.id}:cmp:${op.side}:${op.index}:${op.field}`;
    case "compare-end":
      return `${slot.id}:cmp-end:${op.field}`;
    case "character":
      return `${slot.id}:char:${op.part}:${op.field}`;
    case "map":
      return `${slot.id}:map:${op.part}:${op.field}`;
    case "vocab":
      return `${slot.id}:vocab:${op.index}:${op.part}`;
    case "question":
      return `${slot.id}:question:${op.field}`;
    case "choice":
      return `${slot.id}:choice:${op.index}:${op.field}`;
    default:
      return slot.id;
  }
}

export function hasPlacement(elements: SlideElements | undefined) {
  return Object.values(elements ?? {}).some((box) => typeof box?.x === "number" && typeof box?.y === "number");
}

export function positionsOnly(elements: SlideElements | undefined): SlideElements {
  const next: SlideElements = {};
  for (const [id, box] of Object.entries(elements ?? {})) {
    if (typeof box?.x !== "number" || typeof box?.y !== "number") continue;
    next[id] = {
      x: box.x,
      y: box.y,
      ...(typeof box.w === "number" ? { w: box.w } : {}),
    };
  }
  return next;
}

function replaceIdea(text: string, index: number, next: string) {
  const ideas = splitIdeas(text);
  if (ideas.length === 0) return next.trim();
  if (index < 0 || index >= ideas.length) return text;
  const copy = ideas.slice();
  copy[index] = next.trim();
  return copy.filter(Boolean).join("\n");
}

function replaceAt(lines: string[], index: number, value: string) {
  if (index < 0 || index >= lines.length) return null;
  const next = lines.slice();
  next[index] = value;
  return next;
}

function withBullets(prose: string, points: string[]) {
  return [prose.trim(), ...points.map((point) => point.trim()).filter(Boolean).map((point) => `- ${point}`)]
    .filter(Boolean)
    .join("\n");
}

function writeSummary(conclusion: string, points: string[]) {
  return withBullets(conclusion, points);
}

function writeObjectives(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean).join("\n");
}

function writeCause(titles: readonly string[], sections: string[][]) {
  return sections
    .map((points, index) => {
      const body = points
        .map((point) => point.trim())
        .filter(Boolean)
        .map((point) => `- ${point}`)
        .join("\n");
      if (!body) return "";
      return `${titles[index]}\n${body}`;
    })
    .filter(Boolean)
    .join("\n");
}

function writeComparison(side: ReturnType<typeof readComparison>) {
  const lines = [
    `A: ${side.a.label}`,
    ...side.a.points.map((point) => `- ${point}`),
    `B: ${side.b.label}`,
    ...side.b.points.map((point) => `- ${point}`),
  ];
  if (side.conclusion.trim()) lines.push("---", side.conclusion.trim());
  return lines.join("\n");
}

function writeCharacter(
  data: { name: string; role: string; action: string; meaning: string; narrative: string },
  lang: "vi" | "en",
) {
  const labels =
    lang === "vi"
      ? { name: "Tên", role: "Vai trò", action: "Hành động", meaning: "Ý nghĩa" }
      : { name: "Name", role: "Role", action: "Action", meaning: "Meaning" };
  if (!data.role && !data.action && !data.meaning) return data.narrative.trim();
  return [
    data.name ? `${labels.name}: ${data.name}` : "",
    data.role ? `${labels.role}: ${data.role}` : "",
    data.action ? `${labels.action}: ${data.action}` : "",
    data.meaning ? `${labels.meaning}: ${data.meaning}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function writeMap(data: { place: string; description: string; captions: string[] }, lang: "vi" | "en") {
  const label = lang === "vi" ? "Địa điểm" : "Place";
  return [data.place ? `${label}: ${data.place}` : "", data.description.trim(), ...data.captions.map((item) => item.trim()).filter(Boolean).map((item) => `- ${item}`)]
    .filter(Boolean)
    .join("\n");
}

function timelineLine(label: string, text: string) {
  if (label && text) return `${label} | ${text}`;
  return label || text;
}

function writeTimeline(items: TimelineItem[]) {
  return {
    body_vi: items.map((item) => timelineLine(item.label, item.vi)).filter(Boolean).join("\n"),
    body_en: items.map((item) => timelineLine(item.label, item.en)).filter(Boolean).join("\n"),
  };
}

function memoryKey(op: TextOp) {
  switch (op.type) {
    case "title":
    case "body":
    case "question":
      return op.field === "vi" ? "text_vi" : "text_en";
    case "idea":
      return `${op.field}-${op.index}`;
    case "lines":
      return `${op.region}-${op.field}-${op.index}`;
    case "timeline":
      return op.part === "vi" ? "text_vi" : op.part === "en" ? "text_en" : "label";
    case "cause":
      return `${op.field}-${op.section}-${op.point}`;
    case "compare-label":
      return `label-${op.side}-${op.field}`;
    case "compare-point":
      return `point-${op.side}-${op.index}-${op.field}`;
    case "compare-end":
      return op.field === "vi" ? "text_vi" : "text_en";
    case "character":
      return `${op.part}-${op.field}`;
    case "map":
      return `${op.part}-${op.field}`;
    case "vocab":
      return `${op.part}-${op.index}`;
    case "choice":
      return op.field === "vi" ? "text_vi" : "text_en";
    default:
      return "text";
  }
}

function remember(slide: LessonSlide, id: string, key: string, value: string, patch: Partial<LessonSlide>): Partial<LessonSlide> {
  const elements: SlideElements = { ...(patch.elements ?? slide.elements ?? {}) };
  const prev = elements[id] ?? {};
  if (key === "text_vi" || key === "text_en") {
    elements[id] = { ...prev, [key]: value };
  } else {
    elements[id] = { ...prev, parts: { ...prev.parts, [key]: value } };
  }
  return { ...patch, elements };
}

function bodyOf(slide: LessonSlide, field: "vi" | "en") {
  return field === "vi" ? slide.body_vi : slide.body_en;
}

export function applyElementText(slide: LessonSlide, slot: TextSlot, value: string): Partial<LessonSlide> {
  const op = slot.op;
  const trimmed = value.replace(/\s+/g, " ").trim();
  let patch: Partial<LessonSlide> = {};

  if (op.type === "title") {
    patch = op.field === "vi" ? { title_vi: trimmed } : { title_en: trimmed };
  } else if (op.type === "body") {
    patch = op.field === "vi" ? { body_vi: trimmed } : { body_en: trimmed };
  } else if (op.type === "idea") {
    if (op.region === "context") {
      const current = readContext(bodyOf(slide, op.field));
      const narrative = replaceIdea(current.narrative, op.index, trimmed);
      const body = withBullets(narrative, current.know);
      patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
    } else if (op.region === "summary") {
      const current = readSummary(bodyOf(slide, op.field));
      const conclusion = replaceIdea(current.conclusion, op.index, trimmed);
      const body = writeSummary(conclusion, current.points);
      patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
    } else if (op.region === "map") {
      const current = readMap(bodyOf(slide, op.field));
      const description = replaceIdea(current.description, op.index, trimmed);
      const body = writeMap({ ...current, description }, op.field);
      patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
    } else {
      const body = replaceIdea(bodyOf(slide, op.field), op.index, trimmed);
      patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
    }
  } else if (op.type === "lines") {
    const source = bodyOf(slide, op.field);
    if (op.region === "objectives") {
      const lines = replaceAt(readObjectives(source), op.index, trimmed);
      if (lines) patch = op.field === "vi" ? { body_vi: writeObjectives(lines) } : { body_en: writeObjectives(lines) };
    } else if (op.region === "summary-point") {
      const current = readSummary(source);
      const points = replaceAt(current.points, op.index, trimmed);
      if (points) {
        const body = writeSummary(current.conclusion, points);
        patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
      }
    } else if (op.region === "know") {
      const current = readContext(source);
      const know = replaceAt(current.know, op.index, trimmed);
      if (know) {
        const body = withBullets(current.narrative, know);
        patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
      }
    } else {
      const current = readMap(source);
      const captions = replaceAt(current.captions, op.index, trimmed);
      if (captions) {
        const body = writeMap({ ...current, captions }, op.field);
        patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
      }
    }
  } else if (op.type === "timeline") {
    const items = readTimeline(slide.body_vi, slide.body_en);
    const item = items[op.index];
    if (item) {
      if (op.part === "label") item.label = trimmed;
      if (op.part === "vi") item.vi = trimmed;
      if (op.part === "en") item.en = trimmed;
      patch = writeTimeline(items);
    }
  } else if (op.type === "cause") {
    const vi = readCauseEffect(slide.body_vi);
    const en = readCauseEffect(slide.body_en);
    const buckets = op.field === "vi" ? [vi.causes, vi.developments, vi.consequences] : [en.causes, en.developments, en.consequences];
    const points = replaceAt(buckets[op.section] ?? [], op.point, trimmed);
    if (points) {
      buckets[op.section] = points;
      patch =
        op.field === "vi"
          ? { body_vi: writeCause(CAUSE_VI, buckets) }
          : { body_en: writeCause(CAUSE_EN, buckets) };
    }
  } else if (op.type === "compare-label" || op.type === "compare-point" || op.type === "compare-end") {
    const field = op.field;
    const current = readComparison(bodyOf(slide, field));
    if (op.type === "compare-label") current[op.side].label = trimmed || current[op.side].label;
    if (op.type === "compare-point") {
      const points = replaceAt(current[op.side].points, op.index, trimmed);
      if (!points) return {};
      current[op.side].points = points;
    }
    if (op.type === "compare-end") current.conclusion = trimmed;
    const body = writeComparison(current);
    patch = field === "vi" ? { body_vi: body } : { body_en: body };
  } else if (op.type === "character") {
    const current = readCharacter(bodyOf(slide, op.field));
    const next = { ...current, [op.part]: trimmed };
    const body = writeCharacter(next, op.field);
    patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
  } else if (op.type === "map") {
    const current = readMap(bodyOf(slide, op.field));
    const next = { ...current, [op.part]: trimmed };
    const body = writeMap(next, op.field);
    patch = op.field === "vi" ? { body_vi: body } : { body_en: body };
  } else if (op.type === "vocab") {
    if (!slide.vocab[op.index]) return {};
    patch = {
      vocab: slide.vocab.map((item, index) => {
        if (index !== op.index) return item;
        if (op.part === "example") return { ...item, example: trimmed };
        return { ...item, [op.part]: trimmed };
      }),
    };
  } else if (op.type === "question") {
    patch = op.field === "vi" ? { question_vi: trimmed } : { question_en: trimmed };
  } else if (op.type === "choice") {
    if (!slide.choices[op.index]) return {};
    patch = {
      choices: slide.choices.map((choice, index) => (index === op.index ? { ...choice, [op.field]: trimmed } : choice)),
    };
  }

  if (Object.keys(patch).length === 0) return {};
  return remember(slide, slot.id, memoryKey(op), trimmed, patch);
}
