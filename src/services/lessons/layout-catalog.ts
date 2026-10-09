export const LAYOUT_CATALOG = [
  {
    id: "title",
    label: "Mở đầu",
    when: "Slide mở bài: tên sự kiện, niên đại và câu dẫn.",
    fields: "title_vi, title_en, body_vi/body_en là câu dẫn. Không tạo khung HTML.",
  },
  {
    id: "objectives",
    label: "Mục tiêu học tập",
    when: "Khi cần nêu mục tiêu của bài, tối đa ba ý.",
    fields: "body_vi và body_en: mỗi dòng một mục tiêu, tối đa 3.",
  },
  {
    id: "context",
    label: "Bối cảnh",
    when: "Khi kể bối cảnh lịch sử trước sự kiện chính.",
    fields: "Đoạn đầu là bối cảnh. Các dòng bắt đầu bằng \"- \" là ý Cần biết trước, tối đa 3.",
  },
  {
    id: "timeline",
    label: "Dòng thời gian",
    when: "Khi có các mốc thời gian hoặc diễn biến nối tiếp.",
    fields: "Mỗi dòng body_vi và body_en dạng `nhãn | mô tả`, tối đa 4. Không chia bằng HTML.",
  },
  {
    id: "map",
    label: "Bản đồ / địa điểm",
    when: "Khi bài nói về địa điểm, khu vực hoặc vị trí.",
    fields: "Dòng `Địa điểm: ...`, rồi đoạn mô tả, rồi tối đa 3 dòng \"- \" chú thích. Ảnh chỉ khi giáo viên đã có.",
  },
  {
    id: "character",
    label: "Nhân vật",
    when: "Khi giới thiệu một người, phe hoặc lực lượng.",
    fields: "Các dòng Tên, Vai trò, Hành động, Ý nghĩa trong body_vi; bản tiếng Anh dùng Name, Role, Action, Meaning.",
  },
  {
    id: "comparison",
    label: "So sánh",
    when: "Khi đối chiếu hai phe, hai giai đoạn hoặc hai cách hiểu.",
    fields: "A: nhãn, các dòng \"- \" của vế A, B: nhãn, các dòng \"- \" của vế B, rồi dòng --- và câu kết. Không lặp một đoạn cho cả hai vế.",
  },
  {
    id: "cause-effect",
    label: "Nguyên nhân – diễn biến – kết quả",
    when: "Khi tách nguyên nhân, diễn biến và hệ quả.",
    fields: "Ba mục Nguyên nhân, Diễn biến, Hệ quả; mỗi mục có các dòng \"- \". Bản tiếng Anh dùng Cause, Development, Consequence.",
  },
  {
    id: "quote",
    label: "Trích dẫn tư liệu",
    when: "Khi một câu nguyên văn trong tư liệu cần được nêu bật.",
    fields: "body_vi là câu cần nêu bật. body_en là lời tiếng Anh theo CEFR. Không tạo teacher_notes, source_quote hay source_ok.",
  },
  {
    id: "vocab",
    label: "Từ vựng",
    when: "Khi cần học từ tiếng Anh gắn với bài.",
    fields: "vocab tối đa 6 mục {en, vi, example}. example là câu ngắn lấy từ nội dung bài.",
  },
  {
    id: "quiz",
    label: "Câu hỏi nhanh",
    when: "Khi cần một câu trắc nghiệm trên slide.",
    fields: "question_vi, question_en và 2–4 choices {vi, en, correct, feedback_vi, feedback_en}. Không đặt trắc nghiệm vào layout khác.",
  },
  {
    id: "summary",
    label: "Tổng kết",
    when: "Slide kết: câu chốt, ý cần nhớ, câu hỏi suy ngẫm.",
    fields: "Dòng đầu body là câu kết. Tối đa 3 dòng \"- \" là ý cần nhớ. question_vi/question_en là câu suy ngẫm nếu có.",
  },
] as const;

export type SlideLayout = (typeof LAYOUT_CATALOG)[number]["id"];

export const SLIDE_LAYOUTS = LAYOUT_CATALOG.map((item) => item.id) as readonly SlideLayout[];

const ALIASES: Record<string, SlideLayout> = {
  intro: "title",
  cover: "title",
  opening: "title",
  opener: "title",
  objective: "objectives",
  goal: "objectives",
  goals: "objectives",
  story: "context",
  background: "context",
  narrative: "context",
  time: "timeline",
  chronology: "timeline",
  location: "map",
  place: "map",
  geography: "map",
  person: "character",
  people: "character",
  portrait: "character",
  compare: "comparison",
  versus: "comparison",
  contrast: "comparison",
  cause: "cause-effect",
  effect: "cause-effect",
  causeeffect: "cause-effect",
  choice: "cause-effect",
  document: "quote",
  citation: "quote",
  excerpt: "quote",
  vocabulary: "vocab",
  glossary: "vocab",
  words: "vocab",
  question: "quiz",
  questions: "quiz",
  mcq: "quiz",
  test: "quiz",
  review: "summary",
  closing: "summary",
  conclusion: "summary",
  end: "summary",
};

const HINTS: { test: RegExp; layout: SlideLayout }[] = [
  { test: /object|muc.?tieu|goal/, layout: "objectives" },
  { test: /time|chronolog|dong.?thoi.?gian/, layout: "timeline" },
  { test: /map|place|location|dia.?diem|ban.?do|geo/, layout: "map" },
  { test: /char|person|nhan.?vat|portrait|figure/, layout: "character" },
  { test: /compar|so.?sanh|versus|contrast/, layout: "comparison" },
  { test: /cause|effect|nguyen.?nhan|he.?qua|consequence/, layout: "cause-effect" },
  { test: /quote|trich|document|excerpt|citation/, layout: "quote" },
  { test: /vocab|tu.?vung|glossar/, layout: "vocab" },
  { test: /quiz|question|trac.?nghiem|mcq/, layout: "quiz" },
  { test: /summ|review|tong.?ket|closing|conclusion/, layout: "summary" },
  { test: /title|cover|mo.?dau|opening|intro/, layout: "title" },
  { test: /context|boi.?canh|background|story/, layout: "context" },
];

export function isLayout(value: string): value is SlideLayout {
  return (SLIDE_LAYOUTS as readonly string[]).includes(value);
}

export function layoutById(id: SlideLayout) {
  return LAYOUT_CATALOG.find((item) => item.id === id) ?? LAYOUT_CATALOG[2];
}

/** Map any model-written name onto a catalog id. Unknown names never become a new layout. */
export function coerceLayout(value: string): SlideLayout {
  const key = value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (isLayout(key)) return key;
  const compact = key.replace(/-/g, "");
  if (ALIASES[key]) return ALIASES[key];
  if (ALIASES[compact]) return ALIASES[compact];
  for (const hint of HINTS) {
    if (hint.test.test(key)) return hint.layout;
  }
  return "context";
}

export function layoutInstruction() {
  const lines = LAYOUT_CATALOG.map(
    (item) => `- ${item.id} (${item.label}): ${item.when} Điền: ${item.fields}`,
  );
  return `Chỉ chọn layout trong danh sách cố định sau. Không bịa id mới, không xuất HTML/CSS, không mô tả bố cục mới. Nếu phân vân, dùng context.
${lines.join("\n")}
Slide đầu nên là title, slide cuối nên là summary khi nội dung cho phép. Không bắt buộc dùng hết layout.`;
}

type Pair = { vi: string; en: string };

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readPairs(value: unknown, limit: number): Pair[] {
  if (!Array.isArray(value)) return [];
  const pairs: Pair[] = [];
  for (const item of value) {
    if (pairs.length >= limit) break;
    if (typeof item === "string") {
      const vi = item.trim();
      if (vi) pairs.push({ vi, en: "" });
      continue;
    }
    const row = record(item);
    const vi = str(row.text_vi) || str(row.vi) || str(row.text) || str(row.description_vi);
    const en = str(row.text_en) || str(row.en) || str(row.description_en);
    if (vi || en) pairs.push({ vi, en });
  }
  return pairs;
}

function bulletBlock(title: string, lines: string[]) {
  const points = lines.map((line) => line.trim()).filter(Boolean);
  if (!title && points.length === 0) return "";
  const body = points.map((line) => `- ${line.replace(/^[-*•]\s+/, "")}`).join("\n");
  if (!title) return body;
  return body ? `${title}\n${body}` : title;
}

function timelinePairs(value: unknown): Pair[] {
  if (!Array.isArray(value)) return [];
  const pairs: Pair[] = [];
  for (const item of value) {
    if (pairs.length >= 4) break;
    if (typeof item === "string") {
      const vi = item.trim();
      if (vi) pairs.push({ vi: vi.includes("|") ? vi : vi, en: "" });
      continue;
    }
    const row = record(item);
    const label = str(row.label) || str(row.date) || str(row.time);
    const vi = str(row.text_vi) || str(row.vi) || str(row.description_vi) || str(row.text);
    const en = str(row.text_en) || str(row.en) || str(row.description_en);
    if (!label && !vi && !en) continue;
    pairs.push({
      vi: label ? `${label} | ${vi}` : vi,
      en: en ? (label ? `${label} | ${en}` : en) : "",
    });
  }
  return pairs;
}

/**
 * If the model returned structured text fields, fold them into body_vi/body_en
 * so the saved slide stays inside the existing text columns.
 */
export function foldLayoutText(
  layout: SlideLayout,
  raw: Record<string, unknown>,
  bodyVi: string,
  bodyEn: string,
): { body_vi: string; body_en: string } {
  const keep = { body_vi: bodyVi, body_en: bodyEn };

  if (layout === "timeline") {
    const items = timelinePairs(raw.timeline_items ?? raw.timeline);
    if (items.length === 0) return keep;
    return {
      body_vi: items.map((item) => item.vi).filter(Boolean).join("\n"),
      body_en: items.map((item) => item.en).filter(Boolean).join("\n"),
    };
  }

  if (layout === "objectives") {
    const items = readPairs(raw.objectives ?? raw.objective_items, 3);
    if (items.length === 0) return keep;
    return {
      body_vi: items.map((item) => item.vi).filter(Boolean).join("\n"),
      body_en: items.map((item) => item.en).filter(Boolean).join("\n"),
    };
  }

  if (layout === "context") {
    const know = readPairs(raw.know_before ?? raw.prerequisites, 3);
    if (know.length === 0) return keep;
    return {
      body_vi: [bodyVi, ...know.map((item) => `- ${item.vi}`)].filter(Boolean).join("\n"),
      body_en: [bodyEn, ...know.map((item) => (item.en ? `- ${item.en}` : ""))].filter(Boolean).join("\n"),
    };
  }

  if (layout === "map") {
    const place = record(raw.place);
    const placeVi = str(raw.place_vi) || str(place.vi) || (typeof raw.place === "string" ? str(raw.place) : "");
    const placeEn = str(raw.place_en) || str(place.en);
    const captions = readPairs(raw.captions, 3);
    const descriptionVi = str(raw.description_vi) || bodyVi;
    const descriptionEn = str(raw.description_en) || bodyEn;
    if (!placeVi && captions.length === 0) return keep;
    return {
      body_vi: [placeVi ? `Địa điểm: ${placeVi}` : "", descriptionVi, ...captions.map((item) => `- ${item.vi}`)]
        .filter(Boolean)
        .join("\n"),
      body_en: [placeEn ? `Place: ${placeEn}` : "", descriptionEn, ...captions.map((item) => (item.en ? `- ${item.en}` : ""))]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (layout === "character") {
    const block = record(raw.character);
    const name = str(block.name) || str(raw.character_name);
    const roleVi = str(block.role_vi) || str(block.role);
    const roleEn = str(block.role_en);
    const actionVi = str(block.action_vi) || str(block.action) || str(block.decision_vi);
    const actionEn = str(block.action_en) || str(block.decision_en);
    const meaningVi = str(block.meaning_vi) || str(block.meaning);
    const meaningEn = str(block.meaning_en);
    if (!name && !roleVi && !actionVi && !meaningVi) return keep;
    return {
      body_vi: [
        name ? `Tên: ${name}` : "",
        roleVi ? `Vai trò: ${roleVi}` : "",
        actionVi ? `Hành động: ${actionVi}` : "",
        meaningVi ? `Ý nghĩa: ${meaningVi}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      body_en: [
        name ? `Name: ${name}` : "",
        roleEn ? `Role: ${roleEn}` : "",
        actionEn ? `Action: ${actionEn}` : "",
        meaningEn ? `Meaning: ${meaningEn}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (layout === "comparison") {
    const block = record(raw.comparison);
    const a = readPairs(block.points_a ?? raw.points_a ?? raw.side_a, 4);
    const b = readPairs(block.points_b ?? raw.points_b ?? raw.side_b, 4);
    if (a.length === 0 && b.length === 0) return keep;
    const labelA = str(block.label_a) || str(raw.label_a) || "Vế A";
    const labelB = str(block.label_b) || str(raw.label_b) || "Vế B";
    const labelAEn = str(block.label_a_en) || labelA;
    const labelBEn = str(block.label_b_en) || labelB;
    const conclusionVi = str(block.conclusion_vi) || str(raw.conclusion_vi);
    const conclusionEn = str(block.conclusion_en) || str(raw.conclusion_en);
    return {
      body_vi: [`A: ${labelA}`, ...a.map((item) => `- ${item.vi}`), `B: ${labelB}`, ...b.map((item) => `- ${item.vi}`), conclusionVi ? `---\n${conclusionVi}` : ""]
        .filter(Boolean)
        .join("\n"),
      body_en: [`A: ${labelAEn}`, ...a.map((item) => (item.en ? `- ${item.en}` : "")), `B: ${labelBEn}`, ...b.map((item) => (item.en ? `- ${item.en}` : "")), conclusionEn ? `---\n${conclusionEn}` : ""]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (layout === "cause-effect") {
    const causes = readPairs(raw.causes, 4);
    const developments = readPairs(raw.developments, 4);
    const consequences = readPairs(raw.consequences, 4);
    if (causes.length === 0 && developments.length === 0 && consequences.length === 0) return keep;
    return {
      body_vi: [
        bulletBlock("Nguyên nhân:", causes.map((item) => item.vi)),
        bulletBlock("Diễn biến:", developments.map((item) => item.vi)),
        bulletBlock("Hệ quả:", consequences.map((item) => item.vi)),
      ]
        .filter(Boolean)
        .join("\n"),
      body_en: [
        bulletBlock("Cause:", causes.map((item) => item.en)),
        bulletBlock("Development:", developments.map((item) => item.en)),
        bulletBlock("Consequence:", consequences.map((item) => item.en)),
      ]
        .filter((section) => section.includes("\n-"))
        .join("\n"),
    };
  }

  if (layout === "summary") {
    const points = readPairs(raw.summary_points ?? raw.remember, 3);
    const conclusionVi = str(raw.conclusion_vi);
    const conclusionEn = str(raw.conclusion_en);
    if (points.length === 0 && !conclusionVi) return keep;
    return {
      body_vi: [conclusionVi || bodyVi, ...points.map((item) => `- ${item.vi}`)].filter(Boolean).join("\n"),
      body_en: [conclusionEn || bodyEn, ...points.map((item) => (item.en ? `- ${item.en}` : ""))].filter(Boolean).join("\n"),
    };
  }

  return keep;
}

function linesOf(body: string) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isBullet(line: string) {
  return /^[-*•]\s+/.test(line);
}

function bulletText(line: string) {
  return line.replace(/^[-*•]\s+/, "").trim();
}

function sentences(body: string) {
  return body
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export type TimelineItem = { label: string; vi: string; en: string };

export function readTimeline(bodyVi: string, bodyEn: string): TimelineItem[] {
  const viLines = linesOf(bodyVi);
  const enLines = linesOf(bodyEn);
  if (viLines.some((line) => line.includes("|"))) {
    return viLines
      .filter((line) => line.includes("|"))
      .slice(0, 4)
      .map((line, index) => {
        const [label, ...rest] = line.split("|");
        const enLine = enLines[index] ?? "";
        const enText = enLine.includes("|") ? enLine.split("|").slice(1).join("|").trim() : enLine.trim();
        return { label: label.trim(), vi: rest.join("|").trim(), en: enText };
      });
  }
  return bodyVi
    .split(/[.;]\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((vi) => ({ label: "", vi, en: "" }));
}

export function readObjectives(body: string) {
  const rows = linesOf(body);
  if (rows.length === 0) return [];
  if (rows.length === 1) return sentences(rows[0]).slice(0, 3);
  return rows.slice(0, 3);
}

export function readContext(body: string) {
  const rows = linesOf(body);
  const know = rows.filter(isBullet).map(bulletText).slice(0, 3);
  const narrative = rows.filter((line) => !isBullet(line)).join(" ");
  return { narrative, know };
}

export function readMap(body: string) {
  const rows = linesOf(body);
  const captions = rows.filter(isBullet).map(bulletText).slice(0, 3);
  const rest = rows.filter((line) => !isBullet(line));
  const placeLine = rest.find((line) => /^(địa điểm|dia diem|place|location)\s*:/i.test(line));
  if (placeLine) {
    return {
      place: placeLine.replace(/^(địa điểm|dia diem|place|location)\s*:\s*/i, "").trim(),
      description: rest.filter((line) => line !== placeLine).join(" "),
      captions,
    };
  }
  const prose = rest.join(" ");
  const lead = prose.match(
    /(?:địa điểm(?:\s+xuất phát)?|nơi xuất phát|starting place|place(?:\s+of\s+departure)?)\s+(?:là|is|:)\s+([^.]{3,90})/i,
  );
  if (lead) {
    const bits = sentences(prose);
    const mark = lead[1].trim().slice(0, 16);
    const after = bits.filter((bit) => !bit.toLowerCase().includes(mark.toLowerCase()));
    return {
      place: lead[1].trim(),
      description: after[0] ?? "",
      captions: captions.length > 0 ? captions : after.slice(1, 4),
    };
  }
  if (rest.length > 1 && rest[0].length <= 80) {
    return { place: rest[0], description: rest.slice(1).join(" "), captions };
  }
  const bits = sentences(prose);
  if (bits.length > 2) {
    return { place: "", description: bits[0] ?? "", captions: captions.length > 0 ? captions : bits.slice(1, 4) };
  }
  return { place: "", description: prose, captions };
}

const CHARACTER_FIELDS = [
  { key: "name", test: /^(tên|ten|name)\s*:\s*/i },
  { key: "role", test: /^(vai trò|vai tro|role)\s*:\s*/i },
  { key: "action", test: /^(hành động|hanh dong|quyết định|quyet dinh|action|decision)\s*:\s*/i },
  { key: "meaning", test: /^(ý nghĩa|y nghia|meaning)\s*:\s*/i },
] as const;

const PERSON_NAME = /(?:Nguyễn|Phan|Trần|Lê|Hồ|Lý|Đinh|Võ|Vũ)\s+[A-ZÀ-ỸĐ][A-Za-zÀ-ỹĐđ]+(?:\s+[A-ZÀ-ỸĐ][A-Za-zÀ-ỹĐđ]+){0,3}/g;

function personNames(value: string) {
  return value.match(PERSON_NAME) ?? [];
}

function isPersonName(value: string) {
  const names = personNames(value);
  return names.length === 1 && names[0] === value.trim();
}

export function readCharacter(body: string) {
  const found: Record<(typeof CHARACTER_FIELDS)[number]["key"], string> = {
    name: "",
    role: "",
    action: "",
    meaning: "",
  };
  const leftover: string[] = [];
  const labeledNames: string[] = [];
  for (const line of linesOf(body)) {
    const field = CHARACTER_FIELDS.find((item) => item.test.test(line));
    if (!field) {
      leftover.push(line);
      continue;
    }
    const value = line.replace(field.test, "").trim();
    if (field.key === "name") labeledNames.push(...personNames(value));
    else found[field.key] = value;
  }
  const pool = [...labeledNames, ...leftover.flatMap(personNames)];
  const named = found.role || found.action || found.meaning ? pool.at(-1) : pool[0];
  found.name = named && isPersonName(named) ? named : pool[0] ?? "";
  const narrative = found.role || found.action || found.meaning ? "" : leftover.join(" ");
  return { ...found, narrative };
}

export type ComparedSide = { label: string; points: string[] };

export function readComparison(body: string): { a: ComparedSide; b: ComparedSide; conclusion: string } {
  const rows = body.split(/\r?\n/).map((line) => line.trim());
  const hasMarks = rows.some((line) => /^A\s*:/i.test(line)) && rows.some((line) => /^B\s*:/i.test(line));
  if (!hasMarks) {
    const bits = sentences(body.replace(/\n+/g, " "));
    if (bits.length <= 1) {
      return { a: { label: "Vế A", points: bits }, b: { label: "Vế B", points: [] }, conclusion: "" };
    }
    const mid = Math.ceil(bits.length / 2);
    return {
      a: { label: "Vế A", points: bits.slice(0, mid) },
      b: { label: "Vế B", points: bits.slice(mid) },
      conclusion: "",
    };
  }

  let side: "a" | "b" | "end" = "a";
  const a: ComparedSide = { label: "Vế A", points: [] };
  const b: ComparedSide = { label: "Vế B", points: [] };
  const conclusion: string[] = [];
  for (const line of rows) {
    if (!line) continue;
    if (/^A\s*:/i.test(line)) {
      side = "a";
      a.label = line.replace(/^A\s*:\s*/i, "").trim() || "Vế A";
      continue;
    }
    if (/^B\s*:/i.test(line)) {
      side = "b";
      b.label = line.replace(/^B\s*:\s*/i, "").trim() || "Vế B";
      continue;
    }
    if (/^---\s*$/.test(line)) {
      side = "end";
      continue;
    }
    if (side === "end") {
      conclusion.push(line);
      continue;
    }
    const point = isBullet(line) ? bulletText(line) : line;
    if (side === "a") a.points.push(point);
    else b.points.push(point);
  }
  return { a, b, conclusion: conclusion.join(" ") };
}

export function readCauseEffect(body: string) {
  const rows = linesOf(body);
  const header =
    /^(nguyên nhân|nguyen nhan|cause|diễn biến|dien bien|development|hệ quả|he qua|kết quả|ket qua|consequence)\s*:?\s*$/i;
  if (!rows.some((line) => header.test(line))) {
    const bits = sentences(body);
    const buckets: [string[], string[], string[]] = [[], [], []];
    bits.forEach((bit, index) => {
      const slot = bits.length === 1 ? 0 : Math.min(2, Math.floor((index * 3) / bits.length));
      buckets[slot].push(bit);
    });
    return { causes: buckets[0], developments: buckets[1], consequences: buckets[2] };
  }

  const sections = { causes: [] as string[], developments: [] as string[], consequences: [] as string[] };
  let current: keyof typeof sections | null = null;
  for (const line of rows) {
    const name = line.replace(/:\s*$/, "").toLowerCase();
    if (/^(nguyên nhân|nguyen nhan|cause)$/.test(name)) {
      current = "causes";
      continue;
    }
    if (/^(diễn biến|dien bien|development)$/.test(name)) {
      current = "developments";
      continue;
    }
    if (/^(hệ quả|he qua|kết quả|ket qua|consequence)$/.test(name)) {
      current = "consequences";
      continue;
    }
    if (!current) continue;
    sections[current].push(isBullet(line) ? bulletText(line) : line);
  }
  return sections;
}

export function readSummary(body: string) {
  const rows = linesOf(body);
  const points = rows.filter(isBullet).map(bulletText).slice(0, 3);
  const conclusion = rows.filter((line) => !isBullet(line)).join(" ");
  if (points.length === 0 && rows.length > 1) {
    return { conclusion: rows[0], points: rows.slice(1, 4) };
  }
  return { conclusion, points };
}
