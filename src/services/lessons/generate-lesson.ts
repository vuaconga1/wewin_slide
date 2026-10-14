import { extractSource } from "@/services/sources/extract-source";
import { fillFromSource } from "./fill-from-source";
import { isLayout, layoutInstruction } from "./layout-catalog";
import { DEFAULT_ANIMATION, DEFAULT_TRANSITION, motionInstruction } from "./motion-catalog";
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
  urls: string[];
  grade: string;
  cefr: string;
  mode: string;
  count: number;
  duration: number;
  template: string;
  notes: string;
  files: File[];
};

export const LESSON_SYSTEM_PROMPT = `Bạn là chuyên gia Lịch sử Việt Nam, CLIL và thiết kế bài giảng song ngữ Anh–Việt. Chỉ dùng thông tin trong TƯ LIỆU. Không tự thêm dữ kiện lịch sử. Không mô tả hay gắn hình ảnh bằng AI Vision. Không OCR. Không tạo ghi chú giảng dạy. Không tạo câu trích khóa nguồn. Không trả teacher_notes, source_quote hay source_ok. Trả JSON hợp lệ, không markdown, không HTML, không CSS.
Tạo đúng số slide giáo viên yêu cầu, từ 3 đến 30.
${layoutInstruction()}
${motionInstruction()}
Mỗi slide có tiêu đề song ngữ và thân bài song ngữ đúng dạng layout đã chọn. vocab chỉ khi layout là vocab. Không dùng layout quiz. Không tạo câu trắc nghiệm trên slide. choices của mọi slide là []. Không tạo phần tử choice, kể cả object có vi hoặc en rỗng. question_vi và question_en chỉ dùng cho layout summary khi tư liệu gợi một câu suy ngẫm; mọi layout khác để hai trường này là "".
Mỗi slide phải mang nhiều ý từ phần tư liệu dành cho slide đó: đoạn thân bài, nhiều mốc, nhiều ý nguyên nhân – diễn biến – hệ quả hoặc nhiều điểm so sánh khi tư liệu có các ý đó. Không dừng ở một dòng nếu tư liệu còn câu phù hợp chưa đưa vào slide. Không bịa sự kiện, ngày tháng, nhân vật, địa điểm hay quan hệ nhân quả để lấp chỗ trống. Nếu tư liệu ngắn hơn số slide, chia các câu có sẵn ra đúng số slide, không thêm nội dung ngoài tư liệu.
Tiếng Anh viết lại đúng CEFR, không dịch từng chữ. Tên riêng giữ tiếng Việt. Trường type để cùng giá trị với layout.
Khi tư liệu có nhân vật, mốc thời gian, địa điểm hoặc một quyết định, phải điền graph, mission và ai_vs_history từ TƯ LIỆU trong cùng JSON này. ai_vs_history có câu statement_vi, statement_en, answer (fact, interpretation hoặc unsupported), explanation_vi, explanation_en. explanation chỉ nêu thẳng nội dung lịch sử. Không mở đầu bằng Tư liệu nêu rõ, Tài liệu đã nêu, Tài liệu đã kiểm chứng, Theo tư liệu, The source says hay The sources indicate.
graph có nút person, event, time, place, cause, decision, consequence và cạnh nối. Khi tư liệu đủ dữ kiện, tạo khoảng 6 đến 12 nút, tối đa 16, gồm các nhân vật, mốc thời gian, địa điểm, nguyên nhân, quyết định và hệ quả có trong tư liệu. Không dừng ở 1 hoặc 2 nút nếu tư liệu còn các dữ kiện đó. Không bịa nút ngoài tư liệu.
Time Travel nằm trong mission.questions, tối đa 3 câu, về 3 quyết định hoặc mốc rẽ khác nhau. Mỗi câu là một quyết định đã xảy ra để học sinh chọn hành động. Không tạo nhánh lịch sử thay thế. Không lặp cùng một quyết định. Nếu tư liệu có từ 3 mốc rẽ được ghi nhận thì trả đủ 3 câu. Chỉ trả 1 hoặc 2 câu khi tư liệu thật sự không còn quyết định tiếp theo. Chỉ để questions là [] khi tư liệu không có quyết định nào gắn với kết quả được ghi nhận, và khi đó thêm một cảnh báo vào warnings. Không đoán. Không bịa sự kiện, ngày tháng, nhân vật, lời thoại, động cơ hay quan hệ nhân quả.
Mỗi câu có id, order, contextVi, contextEn, questionVi, questionEn, options đúng 2 phần tử với id, textVi, textEn, correctOptionId trùng id của một lựa chọn, historicalOutcomeVi, historicalOutcomeEn, incorrectChoiceResponseVi, incorrectChoiceResponseEn, sourceEvidence. correctOptionId là lựa chọn đúng, tức hành động hoặc hướng đi được tư liệu ghi nhận. Lựa chọn còn lại chỉ gây nhiễu, vẫn liên quan đến bối cảnh. Câu hỏi chỉ yêu cầu chọn hành động. Không gọi lựa chọn đúng là nguyên nhân nếu tư liệu không nói đó là nguyên nhân. Không viết hệ quả cho lựa chọn sai.
historicalOutcome chỉ nêu diễn biến hoặc kết quả thật gắn với lựa chọn đúng. incorrectChoiceResponse là câu hiện khi chọn sai: nếu tư liệu chứng minh lựa chọn đúng gắn với kết quả, viết một câu ngắn phủ định trực tiếp kết quả ấy. Nếu tư liệu không chứng minh quan hệ nhân quả, để cả hai incorrectChoiceResponse là chuỗi rỗng. Không viết điều sẽ xảy ra nếu chọn phương án kia. Không viết Sai, Đúng, Chưa chính xác hay Đáp án sai. sourceEvidence là dữ kiện hoặc trích đoạn trong tư liệu hỗ trợ kết quả. Không thêm trường consequence, hypothetical, what_if.
Tiếng Anh của Time Travel theo CEFR đã chọn. Tên riêng giữ nguyên. Chỉ để graph.nodes rỗng, mission.questions rỗng và ai_vs_history rỗng khi tư liệu không có một sự kiện có thể kiểm chứng. Độ dài ngắn không phải lý do để bỏ Time Travel nếu tư liệu đã có quyết định và kết quả. Không bịa dữ kiện ngoài tư liệu. Thân slide để rỗng nếu không có câu trong tư liệu để điền.
JSON: {"title_vi":"","title_en":"","warnings":[],"graph":{"nodes":[{"id":"","label":"","type":"person|event|time|place|cause|decision|consequence"}],"edges":[{"from":"","to":"","label":""}]},"slides":[{"layout":"context","type":"context","animation":"rise","transition":"fade","title_vi":"","title_en":"","body_vi":"","body_en":"","vocab":[],"question_vi":"","question_en":"","choices":[]}],"mission":{"questions":[{"id":"tt1","order":1,"contextVi":"","contextEn":"","questionVi":"","questionEn":"","options":[{"id":"a","textVi":"","textEn":""},{"id":"b","textVi":"","textEn":""}],"correctOptionId":"a","historicalOutcomeVi":"","historicalOutcomeEn":"","incorrectChoiceResponseVi":"","incorrectChoiceResponseEn":"","sourceEvidence":""}]},"ai_vs_history":[{"statement_vi":"","statement_en":"","answer":"fact|interpretation|unsupported","explanation_vi":"","explanation_en":""}]}`;

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
      animation: DEFAULT_ANIMATION,
      transition: DEFAULT_TRANSITION,
      title_vi: index === 0 ? request.topic : `${request.topic} · ${index + 1}`,
      title_en: index === 0 ? request.topic : `${request.topic} · part ${index + 1}`,
      body_vi: chunk,
      body_en: chunk
        ? "English wording is added when an AI key is configured. The Vietnamese text stays with the source."
        : "",
      vocab: [],
      question_vi: "",
      question_en: "",
      choices: [],
      image_url: null,
      image_x: 72,
      image_y: 62,
      // Title lines stay unplaced so they use the shared under-logo header (SLIDE_TITLE_CHROME).
      elements: {},
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
    mission: { questions: [] },
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
Mỗi slide điền đủ câu trong phần tư liệu của slide đó. Không để thân bài là một dòng khi tư liệu còn câu chưa dùng. Không bịa để lấp khoảng trống. Không tạo slide quiz và không tạo choices.
Nếu tư liệu có ít nhất một quyết định đã xảy ra và kết quả được ghi nhận, mission.questions phải có câu bám đúng dữ kiện đó. Nếu có từ 3 quyết định hoặc mốc rẽ khác nhau thì trả đủ 3 câu, mỗi câu một thời điểm. Knowledge Graph điền các nhân vật, mốc, địa điểm, nguyên nhân, quyết định và hệ quả có trong tư liệu, không dừng ở 2 nút. Giải thích AI vs History nêu thẳng nội dung, không viết Tư liệu nêu rõ hay The sources indicate.
TƯ LIỆU:
"""
${source || "(Không có tư liệu. Không bịa nội dung. body_vi và body_en để rỗng, graph.nodes để [], mission.questions để [], ai_vs_history để [].)"}
"""`;
}

const LONG_PASTE = 12_000;
const PASTE_LIMIT_MESSAGE =
  "Ô Dán tư liệu đã kiểm chứng có quá nhiều chữ nên không tạo được bài. Hãy rút bớt nội dung trong ô này rồi tạo lại.";

function messageText(content: string | Array<{ text?: string }> | null | undefined) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => part.text ?? "").join("");
  return "";
}

function pastedTooMuch(text: string) {
  return text.trim().length > LONG_PASTE;
}

function sourceLimitError(error: unknown, pasted: string) {
  const message = error instanceof Error ? error.message : "";
  const tooLong = /context length|maximum context|context_length|too many tokens|input tokens/i.test(message);
  if (pastedTooMuch(pasted) && tooLong) return new Error(PASTE_LIMIT_MESSAGE);
  return error instanceof Error ? error : new Error("Lỗi gọi AI");
}

async function completeOpenAI(request: GenerateRequest, source: string, tokens: number) {
  const model = process.env.MODEL || "gpt-5-nano";
  const body: Record<string, unknown> = {
    model,
    max_completion_tokens: tokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: LESSON_SYSTEM_PROMPT },
      { role: "user", content: lessonPrompt(request, source) },
    ],
  };
  if (/^gpt-5|^o\d/i.test(model)) body.reasoning_effort = "low";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string | Array<{ text?: string }> | null }; finish_reason?: string }[];
  };
  if (!response.ok) throw sourceLimitError(new Error(data.error?.message || "Lỗi gọi AI"), request.text);
  const choice = data.choices?.[0];
  return { text: messageText(choice?.message?.content), finishReason: choice?.finish_reason ?? "" };
}

async function generateWithOpenAI(request: GenerateRequest, source: string) {
  const budget = source.length > LONG_PASTE || request.count > 15 ? 32_000 : 16_000;
  let raw = "";
  let finishReason = "";
  try {
    const result = await completeOpenAI(request, source, budget);
    raw = result.text;
    finishReason = result.finishReason;
  } catch (error) {
    throw sourceLimitError(error, request.text);
  }
  if (!raw.trim()) {
    throw new Error(pastedTooMuch(request.text) ? PASTE_LIMIT_MESSAGE : "AI không trả nội dung.");
  }
  try {
    return normalizeLesson(parseModelJson(raw));
  } catch (error) {
    if (pastedTooMuch(request.text) && finishReason === "length") throw new Error(PASTE_LIMIT_MESSAGE);
    throw error;
  }
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
      system: LESSON_SYSTEM_PROMPT,
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

function joinExtra(body: string, extra: string) {
  const next = extra.trim();
  if (!next || body.includes(next)) return body;
  return [body.trim(), next].filter(Boolean).join("\n");
}

export function settleGeneratedSlides(lesson: Lesson): Lesson {
  return {
    ...lesson,
    slides: lesson.slides.map((slide) => {
      const quiz = slide.layout === "quiz";
      const layout = quiz ? "summary" : slide.layout;
      const keepQuestion = layout === "summary" && !quiz;
      return {
        ...slide,
        layout,
        type: layout,
        body_vi: quiz ? joinExtra(slide.body_vi, slide.question_vi) : slide.body_vi,
        body_en: quiz ? joinExtra(slide.body_en, slide.question_en) : slide.body_en,
        question_vi: keepQuestion ? slide.question_vi : "",
        question_en: keepQuestion ? slide.question_en : "",
        choices: [],
        elements: slide.elements ?? {},
      };
    }),
  };
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
    urls: request.urls,
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
          "Chưa tạo câu Time Travel vì không có khóa AI. Hệ thống không tự viết quyết định lịch sử.",
        ]);

  if (hasOpenAI || hasAnthropic) lesson.warnings = [...warnings, ...lesson.warnings];

  const fitted = settleGeneratedSlides(fillFromSource(fitCount(lesson, request.count), extracted.text));
  if (
    (hasOpenAI || hasAnthropic) &&
    fitted.mission.questions.length === 0 &&
    extracted.text.trim().length >= 40 &&
    !fitted.warnings.some((item) => /time travel/i.test(item))
  ) {
    fitted.warnings.push(
      "Tư liệu chưa đủ một quyết định và kết quả lịch sử được xác nhận, nên không tạo câu Time Travel.",
    );
  }
  if (extracted.images[0] && fitted.slides[0]) {
    fitted.slides[0] = { ...fitted.slides[0], image_url: extracted.images[0] };
  }

  return { lesson: fitted, sourceText: extracted.text };
}
