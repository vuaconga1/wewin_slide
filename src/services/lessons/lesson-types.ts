import { z } from "zod";
import { coerceLayout, foldLayoutText, type SlideLayout } from "./layout-catalog";
import { coerceAnimation, coerceTransition, type MotionAnimation, type MotionTransition } from "./motion-catalog";

export { LAYOUT_CATALOG, SLIDE_LAYOUTS, coerceLayout, type SlideLayout } from "./layout-catalog";
export {
  DEFAULT_ANIMATION,
  DEFAULT_TRANSITION,
  MOTION_CATALOG,
  coerceAnimation,
  coerceTransition,
  type MotionAnimation,
  type MotionTransition,
} from "./motion-catalog";

export type VocabItem = { en: string; vi: string; example?: string };

export type SlideElementBox = {
  x?: number;
  y?: number;
  w?: number;
  text_vi?: string;
  text_en?: string;
  parts?: Record<string, string>;
};

export type SlideElements = Record<string, SlideElementBox>;

export type SlideChoice = {
  vi: string;
  en: string;
  correct?: boolean;
  feedback_vi?: string;
  feedback_en?: string;
  historical?: boolean;
  consequence_vi?: string;
  consequence_en?: string;
};

export type LessonSlide = {
  id?: string;
  layout: SlideLayout;
  type: string;
  animation: MotionAnimation;
  transition: MotionTransition;
  title_vi: string;
  title_en: string;
  body_vi: string;
  body_en: string;
  vocab: VocabItem[];
  question_vi: string;
  question_en: string;
  choices: SlideChoice[];
  image_url?: string | null;
  image_x: number;
  image_y: number;
  elements: SlideElements;
};

export type GraphNode = { id: string; label: string; type: string };
export type GraphEdge = { from: string; to: string; label: string };

export type TimeTravelOption = {
  id: string;
  textVi: string;
  textEn: string;
};

export type TimeTravelQuestion = {
  id: string;
  order: number;
  contextVi: string;
  contextEn: string;
  questionVi: string;
  questionEn: string;
  options: TimeTravelOption[];
  correctOptionId: string;
  historicalOutcomeVi: string;
  historicalOutcomeEn: string;
  incorrectChoiceResponseVi: string;
  incorrectChoiceResponseEn: string;
  sourceEvidence: string;
};

export type Mission = {
  questions: TimeTravelQuestion[];
};

export type HistoryChallenge = {
  statement_vi: string;
  statement_en: string;
  answer: "fact" | "interpretation" | "unsupported";
  explanation_vi: string;
  explanation_en: string;
};

export type Lesson = {
  id?: string;
  title_vi: string;
  title_en: string;
  warnings: string[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  slides: LessonSlide[];
  mission: Mission;
  ai_vs_history: HistoryChallenge[];
};

const DEMO_SHELL = "DEMO: Khi chạy AI thật, quyết định lịch sử phải được đối chiếu với nguồn.";

function text(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const plain = value.includes("<") ? value.replace(/<\/?[a-z][^>]*>/gi, "") : value;
  return plain.split(DEMO_SHELL).join("").trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asChoice(value: unknown): SlideChoice {
  const choice = asRecord(value);
  return {
    vi: text(choice.vi),
    en: text(choice.en),
    correct: choice.correct === true,
    feedback_vi: text(choice.feedback_vi),
    feedback_en: text(choice.feedback_en),
    historical: choice.historical === true,
    consequence_vi: text(choice.consequence_vi),
    consequence_en: text(choice.consequence_en),
  };
}

function hasWords(value: string) {
  return value.replace(/[“”"'`\s]/g, "").length > 0;
}

function readElements(value: unknown): SlideElements {
  const source = asRecord(value);
  const elements: SlideElements = {};
  for (const [key, item] of Object.entries(source)) {
    if (!/^[a-z0-9-]{1,40}$/.test(key)) continue;
    const box = asRecord(item);
    const next: SlideElementBox = {};
    if (typeof box.x === "number" && Number.isFinite(box.x)) next.x = box.x;
    if (typeof box.y === "number" && Number.isFinite(box.y)) next.y = box.y;
    if (typeof box.w === "number" && Number.isFinite(box.w)) next.w = box.w;
    const textVi = text(box.text_vi);
    const textEn = text(box.text_en);
    if (textVi) next.text_vi = textVi;
    if (textEn) next.text_en = textEn;
    const partsIn = asRecord(box.parts);
    const parts: Record<string, string> = {};
    for (const [part, partValue] of Object.entries(partsIn)) {
      if (!/^[a-z0-9-]{1,24}$/.test(part)) continue;
      const plain = text(partValue);
      if (plain) parts[part] = plain;
    }
    if (Object.keys(parts).length > 0) next.parts = parts;
    if (next.x == null && next.y == null && !next.text_vi && !next.text_en && !next.parts) continue;
    elements[key] = next;
  }
  return elements;
}

const TIME_TRAVEL_LIMIT = 3;
const TIME_TRAVEL_DROP_WARNING =
  "Một số câu Time Travel không đúng cấu trúc hoặc không đủ dữ kiện được tư liệu hỗ trợ nên đã được bỏ. Hệ thống không tự thêm dữ kiện lịch sử.";

const timeTravelOptionSchema = z.object({
  id: z.string().min(1),
  textVi: z.string().min(1),
  textEn: z.string().min(1),
});

const timeTravelQuestionSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().positive(),
    contextVi: z.string().min(1),
    contextEn: z.string().min(1),
    questionVi: z.string().min(1),
    questionEn: z.string().min(1),
    options: z.tuple([timeTravelOptionSchema, timeTravelOptionSchema]),
    correctOptionId: z.string().min(1),
    historicalOutcomeVi: z.string().min(1),
    historicalOutcomeEn: z.string().min(1),
    incorrectChoiceResponseVi: z.string(),
    incorrectChoiceResponseEn: z.string(),
    sourceEvidence: z.string().min(1),
  })
  .superRefine((question, ctx) => {
    const ids = question.options.map((option) => option.id);
    if (new Set(ids).size !== ids.length || !ids.includes(question.correctOptionId)) {
      ctx.addIssue({ code: "custom", message: "correctOptionId" });
    }
    const [first, second] = question.options;
    if (first.textVi === second.textVi && first.textEn === second.textEn) {
      ctx.addIssue({ code: "custom", message: "options" });
    }
    const responseVi = question.incorrectChoiceResponseVi.trim();
    const responseEn = question.incorrectChoiceResponseEn.trim();
    if (Boolean(responseVi) !== Boolean(responseEn)) ctx.addIssue({ code: "custom", message: "incorrectChoiceResponse" });
  });

function hasCounterfactual(value: string) {
  const sample = value.toLocaleLowerCase("vi");
  return [
    "sẽ xảy ra",
    "sẽ không",
    "lẽ ra",
    "giả sử",
    "dòng lịch sử khác",
    "lịch sử thay thế",
    "nếu chọn",
    "nếu em",
    "nếu bạn",
    "what if",
    "would have",
    "would not",
    "if you had",
    "if they had",
  ].some((phrase) => sample.includes(phrase));
}

function hasVerdictLabel(value: string) {
  return /^\s*(sai|đúng|chưa chính xác|đáp án sai|incorrect|wrong|not correct)\b/i.test(value);
}

function stripVerdictLabel(value: string) {
  return value.replace(/^\s*(?:sai|đúng|chưa chính xác|đáp án sai|incorrect|wrong|not correct)\s*[:.!-]?\s*/i, "").trim();
}

function readAlias(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in row) return text(row[key]);
  }
  return "";
}

function pairedText(row: Record<string, unknown>, viKeys: string[], enKeys: string[]) {
  const vi = readAlias(row, viKeys);
  const en = readAlias(row, enKeys);
  return { vi: vi || en, en: en || vi };
}

function projectTimeTravelQuestion(value: unknown, index: number) {
  const row = asRecord(value);
  if (!Array.isArray(row.options) || row.options.length < 2) return null;
  const requestedCorrectOptionId = readAlias(row, ["correctOptionId", "correct_option_id", "answerId", "answer_id"]);
  const markedIndex = row.options.findIndex((option) => {
    const item = asRecord(option);
    return readAlias(item, ["id"]) === requestedCorrectOptionId || item.historical === true || item.correct === true;
  });
  const rawOptions = markedIndex >= 2 ? [row.options[0], row.options[markedIndex]] : row.options.slice(0, 2);
  const options = rawOptions.map((option, optionIndex) => {
    const item = asRecord(option);
    const label = pairedText(item, ["textVi", "text_vi", "vi", "labelVi", "label_vi"], ["textEn", "text_en", "en", "labelEn", "label_en"]);
    return {
      id: readAlias(item, ["id"]) || String.fromCharCode(97 + optionIndex),
      textVi: label.vi,
      textEn: label.en,
    };
  });
  const context = pairedText(row, ["contextVi", "context_vi", "sceneVi", "scene_vi"], ["contextEn", "context_en", "sceneEn", "scene_en"]);
  const question = pairedText(row, ["questionVi", "question_vi"], ["questionEn", "question_en"]);
  const outcome = pairedText(
    row,
    ["historicalOutcomeVi", "historical_outcome_vi", "outcomeVi", "outcome_vi"],
    ["historicalOutcomeEn", "historical_outcome_en", "outcomeEn", "outcome_en"],
  );
  const evidence = readAlias(row, ["sourceEvidence", "source_evidence", "evidence"]);
  const response = pairedText(
    row,
    ["incorrectChoiceResponseVi", "incorrect_choice_response_vi", "feedbackVi", "feedback_vi"],
    ["incorrectChoiceResponseEn", "incorrect_choice_response_en", "feedbackEn", "feedback_en"],
  );
  const unsafeResponse = hasCounterfactual(response.vi) || hasCounterfactual(response.en) || hasVerdictLabel(response.vi) || hasVerdictLabel(response.en);
  let correctOptionId = requestedCorrectOptionId;
  if (!options.some((option) => option.id === correctOptionId)) {
    const marked = rawOptions
      .map((option, optionIndex) => ({ option: asRecord(option), id: options[optionIndex]?.id ?? "" }))
      .filter(({ option }) => option.historical === true || option.correct === true);
    if (marked.length === 1) correctOptionId = marked[0]?.id ?? "";
  }
  const orderValue = row.order;
  const order = typeof orderValue === "number" && Number.isInteger(orderValue) && orderValue > 0 ? orderValue : index + 1;
  return {
    id: readAlias(row, ["id"]) || `tt-${order}`,
    order,
    contextVi: context.vi || evidence || outcome.vi,
    contextEn: context.en || evidence || outcome.en,
    questionVi: question.vi,
    questionEn: question.en,
    options,
    correctOptionId,
    historicalOutcomeVi: stripVerdictLabel(outcome.vi),
    historicalOutcomeEn: stripVerdictLabel(outcome.en),
    incorrectChoiceResponseVi: unsafeResponse ? "" : response.vi,
    incorrectChoiceResponseEn: unsafeResponse ? "" : response.en,
    sourceEvidence: evidence || outcome.vi || outcome.en,
  };
}

function rawTimeTravelQuestions(value: unknown) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const mission = asRecord(value);
  return Array.isArray(mission.questions) ? mission.questions : [];
}

function legacyMissionAttempt(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const mission = asRecord(value);
  if (Array.isArray(mission.questions)) return false;
  return ["scene_vi", "scene_en", "question_vi", "question_en", "choices"].some((key) => {
    const child = mission[key];
    if (typeof child === "string") return hasWords(child);
    return Array.isArray(child) && child.length > 0;
  });
}

function normalizeMission(value: unknown, warnings: string[]): Mission {
  const raw = rawTimeTravelQuestions(value);
  const parsed = raw.flatMap((item, index) => {
    const projected = projectTimeTravelQuestion(item, index);
    if (!projected) return [];
    const result = timeTravelQuestionSchema.safeParse(projected);
    if (!result.success) return [];
    const question = result.data;
    return [
      {
        ...question,
        options: question.options.map((option) => ({ ...option })),
      } satisfies TimeTravelQuestion,
    ];
  });
  parsed.sort((a, b) => a.order - b.order);
  const limited = parsed.slice(0, TIME_TRAVEL_LIMIT);
  const dropped = raw.length - parsed.length + Math.max(0, parsed.length - TIME_TRAVEL_LIMIT);
  const rejected = dropped > 0 || legacyMissionAttempt(value);
  const questions = limited.map((question, index) => {
    const order = index + 1;
    const duplicate = limited.some((item, itemIndex) => itemIndex !== index && item.id === question.id);
    return { ...question, id: duplicate ? `${question.id}-${order}` : question.id, order };
  });
  if (rejected && !warnings.includes(TIME_TRAVEL_DROP_WARNING)) warnings.push(TIME_TRAVEL_DROP_WARNING);
  return { questions };
}

const SOURCE_FRAME = [
  /^(?:như\s+|theo\s+)?(?:tư liệu|tài liệu)(?:\s+đã)?(?:\s+(?:được\s+)?(?:nêu rõ|nêu|cho biết|ghi nhận|ghi|kiểm chứng|xác nhận|chứng minh))+(?:\s+rằng|\s+là)?\s*[:,]?\s*/i,
  /^(?:theo\s+)?(?:tư liệu|tài liệu)(?:\s+đã\s+kiểm chứng|\s+đã\s+nêu)?\s*[:,]?\s*/i,
  /^(?:the\s+)?(?:verified\s+)?sources?\s+(?:indicate|state|show|say|confirm|note)(?:\s+that)?\s*/i,
  /^according to the (?:verified\s+)?(?:source|document|text)s?\s*,?\s*(?:that\s+)?/i,
];

function stripSourceFrame(value: string) {
  let next = value.trim();
  let changed = true;
  while (next && changed) {
    changed = false;
    for (const pattern of SOURCE_FRAME) {
      const stripped = next.replace(pattern, "").trim();
      if (stripped && stripped !== next) {
        next = stripped;
        changed = true;
      }
    }
  }
  if (!next) return value.trim();
  return next.charAt(0).toLocaleUpperCase("vi") + next.slice(1);
}

function normalizeChallenges(value: unknown): HistoryChallenge[] {
  const list = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
  return list
    .map((item) => {
      const row = asRecord(item);
      const answer = text(row.answer, "unsupported");
      return {
        statement_vi: text(row.statement_vi),
        statement_en: text(row.statement_en),
        answer: answer === "fact" || answer === "interpretation" ? answer : "unsupported",
        explanation_vi: stripSourceFrame(text(row.explanation_vi)),
        explanation_en: stripSourceFrame(text(row.explanation_en)),
      } satisfies HistoryChallenge;
    })
    .filter((item) => hasWords(item.statement_vi) || hasWords(item.statement_en));
}

export function normalizeSlide(value: unknown, index: number): LessonSlide {
  const slide = asRecord(value);
  const rawType = text(slide.type, text(slide.layout, "context"));
  const layout = coerceLayout(text(slide.layout, rawType) || rawType);
  const vocab = Array.isArray(slide.vocab) ? slide.vocab.map((item) => {
    const row = asRecord(item);
    const example = text(row.example);
    return example ? { en: text(row.en), vi: text(row.vi), example } : { en: text(row.en), vi: text(row.vi) };
  }).filter((item) => item.en || item.vi).slice(0, 6) : [];
  const bodies = foldLayoutText(layout, slide, text(slide.body_vi), text(slide.body_en));

  return {
    id: text(slide.id) || undefined,
    layout,
    type: layout,
    animation: coerceAnimation(text(slide.animation)),
    transition: coerceTransition(text(slide.transition)),
    title_vi: text(slide.title_vi, `Slide ${index + 1}`),
    title_en: text(slide.title_en),
    body_vi: bodies.body_vi,
    body_en: bodies.body_en,
    vocab,
    question_vi: text(slide.question_vi),
    question_en: text(slide.question_en),
    choices: Array.isArray(slide.choices)
      ? slide.choices.map(asChoice).filter((choice) => hasWords(choice.vi) || hasWords(choice.en))
      : [],
    image_url: text(slide.image_url) || null,
    image_x: typeof slide.image_x === "number" ? slide.image_x : 72,
    image_y: typeof slide.image_y === "number" ? slide.image_y : 62,
    elements: readElements(slide.elements),
  };
}

export function normalizeLesson(value: unknown): Lesson {
  const lesson = asRecord(value);
  const graph = asRecord(lesson.graph);
  const slides = Array.isArray(lesson.slides) ? lesson.slides.slice(0, 30).map(normalizeSlide) : [];

  if (slides.length === 0) {
    throw new Error("Bài giảng chưa có slide.");
  }

  const warnings = Array.isArray(lesson.warnings)
    ? lesson.warnings.filter((item): item is string => typeof item === "string").map((item) => text(item)).filter(Boolean)
    : [];
  const mission = normalizeMission(lesson.mission, warnings);

  return {
    id: text(lesson.id) || undefined,
    title_vi: text(lesson.title_vi, slides[0]?.title_vi || "Bài giảng"),
    title_en: text(lesson.title_en),
    warnings,
    graph: {
      nodes: Array.isArray(graph.nodes)
        ? graph.nodes
            .map((node) => {
              const row = asRecord(node);
              return { id: text(row.id), label: text(row.label), type: text(row.type, "event") };
            })
            .filter((node) => hasWords(node.label))
        : [],
      edges: Array.isArray(graph.edges)
        ? graph.edges.map((edge) => {
            const row = asRecord(edge);
            return { from: text(row.from), to: text(row.to), label: text(row.label) };
          })
        : [],
    },
    slides,
    mission,
    ai_vs_history: normalizeChallenges(lesson.ai_vs_history),
  };
}
