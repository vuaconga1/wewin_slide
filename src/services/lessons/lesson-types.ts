import { coerceLayout, foldLayoutText, type SlideLayout } from "./layout-catalog";

export { LAYOUT_CATALOG, SLIDE_LAYOUTS, coerceLayout, type SlideLayout } from "./layout-catalog";

export type VocabItem = { en: string; vi: string; example?: string };

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
};

export type GraphNode = { id: string; label: string; type: string };
export type GraphEdge = { from: string; to: string; label: string };

export type Mission = {
  scene_vi: string;
  scene_en: string;
  question_vi: string;
  question_en: string;
  choices: SlideChoice[];
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
  mission: Mission | null;
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

function normalizeMission(value: unknown): Mission | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const mission = asRecord(value);
  const choices = (Array.isArray(mission.choices) ? mission.choices.map(asChoice) : []).filter(
    (choice) => hasWords(choice.vi) || hasWords(choice.en),
  );
  const scene_vi = text(mission.scene_vi);
  const scene_en = text(mission.scene_en);
  const question_vi = text(mission.question_vi);
  const question_en = text(mission.question_en);
  if (![scene_vi, scene_en, question_vi, question_en].some(hasWords) && choices.length === 0) return null;
  return { scene_vi, scene_en, question_vi, question_en, choices };
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
        explanation_vi: text(row.explanation_vi),
        explanation_en: text(row.explanation_en),
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
    title_vi: text(slide.title_vi, `Slide ${index + 1}`),
    title_en: text(slide.title_en),
    body_vi: bodies.body_vi,
    body_en: bodies.body_en,
    vocab,
    question_vi: text(slide.question_vi),
    question_en: text(slide.question_en),
    choices: Array.isArray(slide.choices) ? slide.choices.map(asChoice) : [],
    image_url: text(slide.image_url) || null,
    image_x: typeof slide.image_x === "number" ? slide.image_x : 72,
    image_y: typeof slide.image_y === "number" ? slide.image_y : 62,
  };
}

export function normalizeLesson(value: unknown): Lesson {
  const lesson = asRecord(value);
  const graph = asRecord(lesson.graph);
  const slides = Array.isArray(lesson.slides) ? lesson.slides.slice(0, 30).map(normalizeSlide) : [];

  if (slides.length === 0) {
    throw new Error("Bài giảng chưa có slide.");
  }

  return {
    id: text(lesson.id) || undefined,
    title_vi: text(lesson.title_vi, slides[0]?.title_vi || "Bài giảng"),
    title_en: text(lesson.title_en),
    warnings: Array.isArray(lesson.warnings)
      ? lesson.warnings.filter((item): item is string => typeof item === "string").map((item) => text(item)).filter(Boolean)
      : [],
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
    mission: normalizeMission(lesson.mission),
    ai_vs_history: normalizeChallenges(lesson.ai_vs_history),
  };
}
