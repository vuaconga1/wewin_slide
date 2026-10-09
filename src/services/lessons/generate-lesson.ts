import { extractSource } from "@/services/sources/extract-source";
import { isLayout, layoutInstruction } from "./layout-catalog";
import {
  normalizeLesson,
  SLIDE_LAYOUTS,
  type Lesson,
  type LessonSlide,
  type SlideLayout,
} from "./lesson-types";

export type GenerateRequest = {
  topic: string;
  text: string;
  url: string;
  grade: string;
  cefr: string;
  mode: string;
  count: number;
  duration: number;
  template: string;
  notes: string;
  files: File[];
};

const SYSTEM = `Bạn là chuyên gia Lịch sử Việt Nam, CLIL và thiết kế bài giảng song ngữ Anh–Việt. Chỉ dùng thông tin trong TƯ LIỆU. Không tự thêm dữ kiện lịch sử. Không mô tả hay gắn hình ảnh bằng AI Vision. Không OCR. Không tạo ghi chú giảng dạy. Không tạo câu trích khóa nguồn. Không trả teacher_notes, source_quote hay source_ok. Trả JSON hợp lệ, không markdown, không HTML, không CSS.
Tạo đúng số slide giáo viên yêu cầu, từ 3 đến 30.
${layoutInstruction()}
Mỗi slide có tiêu đề song ngữ và thân bài song ngữ đúng dạng layout đã chọn. vocab chỉ khi layout là vocab. question và choices chỉ khi layout là quiz.
Tiếng Anh viết lại đúng CEFR, không dịch từng chữ. Tên riêng giữ tiếng Việt. Trường type để cùng giá trị với layout.
Khi tư liệu đủ, viết mission và ai_vs_history từ TƯ LIỆU. mission là một cảnh quyết định: scene_vi, scene_en, question_vi, question_en, và ít nhất hai choices có vi, en, historical, consequence_vi, consequence_en. ai_vs_history có câu statement_vi, statement_en, answer (fact, interpretation hoặc unsupported), explanation_vi, explanation_en. Nếu tư liệu không đủ cho một phần, không bịa nội dung: mission là null, ai_vs_history là [], graph.nodes là []. Thân slide để rỗng nếu không có câu trong tư liệu để điền.
JSON: {"title_vi":"","title_en":"","warnings":[],"graph":{"nodes":[{"id":"","label":"","type":"person|event|time|place|cause|decision|consequence"}],"edges":[{"from":"","to":"","label":""}]},"slides":[{"layout":"context","type":"context","title_vi":"","title_en":"","body_vi":"","body_en":"","vocab":[{"en":"","vi":"","example":""}],"question_vi":"","question_en":"","choices":[{"vi":"","en":"","correct":false,"feedback_vi":"","feedback_en":""}]}],"mission":{"scene_vi":"","scene_en":"","question_vi":"","question_en":"","choices":[{"vi":"","en":"","historical":false,"consequence_vi":"","consequence_en":""}]},"ai_vs_history":[{"statement_vi":"","statement_en":"","answer":"fact|interpretation|unsupported","explanation_vi":"","explanation_en":""}]}`;

function splitChunks(source: string, count: number) {
  const clean = source.replace(/\s+/g, " ").trim();
  if (!clean) return Array.from({ length: count }, () => "");
  const paragraphs = source
    .split(/\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 40);
  const pieces = paragraphs.length >= count ? paragraphs : clean.split(/(?<=[.!?])\s+/);
  if (pieces.length === 0) return Array.from({ length: count }, () => clean.slice(0, 280));
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * pieces.length) / count);
    const end = Math.floor(((index + 1) * pieces.length) / count);
    return pieces.slice(start, Math.max(end, start + 1)).join(" ").slice(0, 500);
  });
}

function layoutFor(index: number, total: number, template: string): SlideLayout {
  if (index === 0) return "title";
  if (index === total - 1) return "summary";
  if ((SLIDE_LAYOUTS as readonly string[]).includes(template)) return template as SlideLayout;
  const middle: SlideLayout[] = [
    "objectives",
    "context",
    "timeline",
    "character",
    "map",
    "cause-effect",
    "comparison",
    "quote",
    "vocab",
    "quiz",
  ];
  return middle[(index - 1) % middle.length] ?? "context";
}

function sourceSentence(source: string) {
  const clean = source.replace(/\s+/g, " ").trim();
  const sentence = clean.split(/(?<=[.!?])\s+/)[0]?.slice(0, 400) ?? "";
  return sentence.length >= 40 ? sentence : "";
}

function draftLesson(request: GenerateRequest, source: string, warnings: string[]): Lesson {
  const sentence = sourceSentence(source);
  const chunks = splitChunks(source, request.count);
  const grounded = chunks.some((chunk) => chunk.trim().length >= 40);
  const slides: LessonSlide[] = chunks.map((chunk, index) => {
    const layout = layoutFor(index, request.count, request.template);
    return {
      layout,
      type: layout,
      title_vi: index === 0 ? request.topic : `${request.topic} · ${index + 1}`,
      title_en: index === 0 ? request.topic : `${request.topic} · part ${index + 1}`,
      body_vi: chunk,
      body_en: chunk
        ? "English wording is added when an AI key is configured. The Vietnamese text stays with the source."
        : "",
      vocab: [],
      question_vi: layout === "quiz" && chunk ? "Câu nào có trong tư liệu vừa đọc?" : "",
      question_en: layout === "quiz" && chunk ? "Which statement is supported by the source?" : "",
      choices:
        layout === "quiz" && chunk
          ? [
              {
                vi: "Đối chiếu với câu trong tư liệu",
                en: "Check the sentence in the source",
                correct: true,
                feedback_vi: "Kết luận cần bám vào nguồn.",
                feedback_en: "A conclusion should stay with the source.",
              },
              {
                vi: "Thêm một dữ kiện không có trong nguồn",
                en: "Add a fact that is not in the source",
                correct: false,
                feedback_vi: "Không thêm dữ kiện ngoài tư liệu.",
                feedback_en: "Do not add facts beyond the source.",
              },
            ]
          : [],
      image_url: null,
      image_x: 72,
      image_y: 62,
    };
  });

  const nodes = grounded
    ? slides.slice(0, 6).map((slide, index) => ({
        id: `n${index + 1}`,
        label: slide.title_vi.slice(0, 28),
        type: slide.layout,
      }))
    : [];

  return normalizeLesson({
    title_vi: request.topic,
    title_en: request.topic,
    warnings,
    graph: {
      nodes,
      edges: nodes.slice(1).map((node, index) => ({
        from: nodes[index]?.id,
        to: node.id,
        label: "tiếp theo",
      })),
    },
    slides,
    mission: sentence
      ? {
          scene_vi: sentence,
          scene_en: "",
          question_vi: "Em sẽ làm gì trước khi kết luận?",
          question_en: "What will you do before concluding?",
          choices: [
            {
              vi: "Tìm câu chứng minh trong tư liệu",
              en: "Find a supporting sentence in the source",
              historical: true,
              consequence_vi: "Em kiểm chứng trước khi kết luận.",
              consequence_en: "You checked the source before concluding.",
            },
            {
              vi: "Kết luận khi chưa đọc nguồn",
              en: "Conclude before reading the source",
              historical: false,
              consequence_vi: "Kết luận chưa có bằng chứng.",
              consequence_en: "The conclusion does not have evidence yet.",
            },
          ],
        }
      : null,
    ai_vs_history: sentence
      ? [
          {
            statement_vi: sentence,
            statement_en: "",
            answer: "fact",
            explanation_vi: "Câu này có trong tư liệu đã đưa vào.",
            explanation_en: "This sentence is in the source that was provided.",
          },
        ]
      : [],
  });
}

function parseModelJson(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI không trả JSON hợp lệ.");
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}

function lessonPrompt(request: GenerateRequest, source: string) {
  return `Chủ đề: ${request.topic}
Khối: ${request.grade}
CEFR: ${request.cefr}
Mode: ${request.mode}
Thời lượng: ${request.duration} phút
Số slide bắt buộc: ${request.count}
${isLayout(request.template) ? `Template ưu tiên: ${request.template}. Dùng layout này cho các slide giữa. Slide đầu nên là title, slide cuối nên là summary. Chỉ điền chữ vào layout có sẵn.` : "Template ưu tiên: auto. Tự chọn layout trong danh sách cố định. Slide đầu nên là title, slide cuối nên là summary."}
Ghi chú giáo viên: ${request.notes}
TƯ LIỆU:
"""
${source || "(Không có tư liệu. Không bịa nội dung. body_vi và body_en để rỗng, graph.nodes để [], mission để null, ai_vs_history để [].)"}
"""`;
}

async function generateWithOpenAI(request: GenerateRequest, source: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.MODEL || "gpt-5-nano",
      max_completion_tokens: request.count > 15 ? 24000 : 16000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: lessonPrompt(request, source) },
      ],
    }),
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string | null } }[];
  };
  if (!response.ok) throw new Error(data.error?.message || "Lỗi gọi AI");
  const raw = data.choices?.[0]?.message?.content ?? "";
  if (!raw.trim()) throw new Error("AI không trả nội dung.");
  return normalizeLesson(parseModelJson(raw));
}

async function generateWithModel(request: GenerateRequest, source: string) {
  const user = lessonPrompt(request, source);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: request.count > 15 ? 12000 : 9000,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    content?: { type: string; text?: string }[];
  };
  if (!response.ok) throw new Error(data.error?.message || "Lỗi gọi AI");
  const raw = (data.content ?? []).filter((block) => block.type === "text").map((block) => block.text ?? "").join("");
  if (!raw.trim()) throw new Error("AI không trả nội dung.");
  return normalizeLesson(parseModelJson(raw));
}

function fitCount(lesson: Lesson, count: number) {
  const slides = lesson.slides.slice(0, count);
  while (slides.length < count) {
    const seed = slides[slides.length - 1] ?? lesson.slides[0];
    if (!seed) break;
    slides.push({
      ...seed,
      id: undefined,
      title_vi: `${lesson.title_vi} · ${slides.length + 1}`,
      title_en: `${lesson.title_en || lesson.title_vi} · ${slides.length + 1}`,
      layout: "summary",
      type: "summary",
    });
  }
  const warnings = [...lesson.warnings];
  if (lesson.slides.length !== count) {
    warnings.push("AI trả số slide khác yêu cầu. Hệ thống đã chỉnh về đúng số lượng giáo viên nhập.");
  }
  return { ...lesson, slides, warnings };
}

export async function generateLesson(request: GenerateRequest) {
  if (request.count < 3) throw new Error("Số slide tối thiểu là 3.");
  if (request.count > 30) throw new Error("Số slide tối đa là 30.");

  const extracted = await extractSource({
    text: request.text,
    url: request.url,
    files: request.files,
  });
  const warnings = [...extracted.warnings];
  if (request.count >= 20) {
    warnings.push("Số slide lớn. Thời gian xử lý và chi phí AI có thể tăng.");
  }
  if (sourceSentence(extracted.text) && extracted.text.length < request.count * 120) {
    warnings.push("Tài liệu ngắn so với số slide. Nội dung có thể bị lặp hoặc thiếu chiều sâu.");
  }

  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const lesson = hasOpenAI
    ? await generateWithOpenAI(request, extracted.text)
    : hasAnthropic
      ? await generateWithModel(request, extracted.text)
      : draftLesson(request, extracted.text, [
          ...warnings,
          "Chưa có OPENAI_API_KEY. Hệ thống đã chia tư liệu thành đúng số slide và gán layout. Phần tiếng Anh sẽ được AI viết khi có API key.",
        ]);

  if (hasOpenAI || hasAnthropic) lesson.warnings = [...warnings, ...lesson.warnings];

  const fitted = fitCount(lesson, request.count);
  if (extracted.images[0] && fitted.slides[0]) {
    fitted.slides[0] = { ...fitted.slides[0], image_url: extracted.images[0] };
  }

  return { lesson: fitted, sourceText: extracted.text };
}
