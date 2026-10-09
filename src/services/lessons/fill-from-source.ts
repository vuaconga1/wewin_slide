import type { GraphEdge, GraphNode, HistoryChallenge, Lesson, Mission, SlideChoice } from "./lesson-types";

const ENOUGH = 280;

function clean(source: string) {
  return source.replace(/\s+/g, " ").trim();
}

function clip(value: string, max = 180) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const value of values) {
    const label = value.replace(/\s+/g, " ").trim();
    const key = label.toLocaleLowerCase("vi");
    if (label.length < 2 || seen.has(key)) continue;
    seen.add(key);
    rows.push(label);
  }
  return rows;
}

function graphFrom(source: string, title: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const people = unique([...source.matchAll(/Tên:\s*([^.]{2,80})/gi)].map((match) => match[1] ?? "")).slice(0, 3);
  const times = unique(
    [...source.matchAll(/(\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4})/gi)].map((match) => match[1] ?? ""),
  ).sort((a, b) => Number(b.includes("1911")) - Number(a.includes("1911")) || Number(b.includes("1941")) - Number(a.includes("1941")));
  const placeLead = source.match(
    /(?:địa điểm(?:\s+xuất phát)?|nơi xuất phát)\s+là\s+([^.]{3,80})/i,
  );
  const places = unique([
    placeLead?.[1]?.split(",")[0] ?? "",
    ...[...source.matchAll(/(?:^|[^A-Za-zÀ-ỹĐđ])(?:tại|ở)\s+([A-ZĐÀÁÂĂÈÉÊÌÍÒÓÔƠÙÚÝ][^,.]{2,40})/g)].map(
      (match) => match[1] ?? "",
    ),
  ]).slice(0, 2);
  const cause = source.match(/Nguyên nhân:\s*([^.]{8,180})/i)?.[1] ?? "";
  const consequence = source.match(/Hệ quả:\s*([^.]{8,180})/i)?.[1] ?? "";
  const decision = source.match(/Quyết định then chốt[^:]*:\s*([^.]{8,160})/i)?.[1] ?? "";

  const specs: { label: string; type: string }[] = [
    { label: clip(title, 48), type: "event" },
    ...people.slice(0, 2).map((label) => ({ label: clip(label, 48), type: "person" })),
    ...times.slice(0, 1).map((label) => ({ label, type: "time" })),
    ...places.slice(0, 1).map((label) => ({ label: clip(label, 48), type: "place" })),
    ...(cause ? [{ label: clip(cause, 48), type: "cause" }] : []),
    ...(decision ? [{ label: clip(decision, 48), type: "decision" }] : []),
    ...(consequence ? [{ label: clip(consequence, 48), type: "consequence" }] : []),
  ].filter((item) => item.label.length > 1);

  const nodes = specs.slice(0, 8).map((item, index) => ({
    id: `s${index + 1}`,
    label: item.label,
    type: item.type,
  }));
  const event = nodes.find((node) => node.type === "event");
  const edges: GraphEdge[] = [];
  if (event) {
    for (const node of nodes) {
      if (node.id === event.id) continue;
      if (node.type === "cause") edges.push({ from: node.id, to: event.id, label: "dẫn tới" });
      else if (node.type === "consequence") edges.push({ from: event.id, to: node.id, label: "dẫn tới" });
      else edges.push({ from: event.id, to: node.id, label: "gắn với" });
    }
  }
  return { nodes, edges };
}

function choice(vi: string, historical: boolean, consequence: string): SlideChoice {
  return {
    vi: clip(vi, 140),
    en: "",
    historical,
    consequence_vi: clip(consequence, 180),
    consequence_en: "",
  };
}

function missionFrom(source: string): Mission | null {
  const scene =
    source.match(/Sáng ngày[^.]{10,220}\./i)?.[0] ??
    source.match(/Ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4}[^.]{10,220}\./i)?.[0] ??
    "";
  const first = source.match(/Việc thứ nhất[^:]*:\s*([^.]+)\.\s*Hệ quả[^.]{0,40}là\s+([^.]+)\./i);
  const second = source.match(/Việc thứ hai[^:]*:\s*([^.]+)\.\s*Hệ quả[^.]{0,40}là\s+([^.]+)\./i);
  if (scene && first?.[1] && first[2] && second?.[1] && second[2]) {
    return {
      scene_vi: clip(scene, 240),
      scene_en: "",
      question_vi: "Em chọn việc nào?",
      question_en: "",
      choices: [choice(first[1], true, first[2]), choice(second[1], false, second[2])],
    };
  }

  const toFrance = /sang Pháp/i.test(source);
  const notJapan = /không sang Nhật/i.test(source);
  if (!scene || !toFrance || !notJapan) return null;
  return {
    scene_vi: clip(scene, 240),
    scene_en: "",
    question_vi: "Trong ngày ra đi, em chọn hướng nào?",
    question_en: "",
    choices: [
      choice("Xuống tàu và sang Pháp", true, "Đây là hướng đi được ghi trong tư liệu."),
      choice("Sang Nhật Bản", false, "Tư liệu nói Người không sang Nhật trong ngày ra đi."),
    ],
  };
}

function challengesFrom(source: string): HistoryChallenge[] {
  const fact = source.match(/Sự thật có trong tư liệu:\s*([^.]+)\./i)?.[1];
  if (fact) {
    return [
      {
        statement_vi: clip(fact, 220),
        statement_en: "",
        answer: "fact",
        explanation_vi: "Câu này được ghi là sự thật trong tư liệu.",
        explanation_en: "",
      },
    ];
  }
  const sentence = source.split(/(?<=[.!?])\s+/).find((part) => part.trim().length >= 40);
  if (!sentence) return [];
  return [
    {
      statement_vi: clip(sentence, 220),
      statement_en: "",
      answer: "fact",
      explanation_vi: "Câu này có trong tư liệu đã đưa vào.",
      explanation_en: "",
    },
  ];
}

export function fillFromSource(lesson: Lesson, source: string): Lesson {
  const text = clean(source);
  if (text.length < ENOUGH) return lesson;
  const graph = lesson.graph.nodes.length > 0 ? lesson.graph : graphFrom(text, lesson.title_vi);
  const mission = lesson.mission ?? missionFrom(text);
  const ai_vs_history = lesson.ai_vs_history.length > 0 ? lesson.ai_vs_history : challengesFrom(text);
  return { ...lesson, graph, mission, ai_vs_history };
}
