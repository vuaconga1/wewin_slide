"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "@/services/lessons/lesson-types";

type Lang = "vi" | "both" | "en";

function show(lang: Lang, vi: string, en: string) {
  return (
    <>
      {lang !== "en" && vi ? <div className="vi">{vi}</div> : null}
      {lang !== "vi" && en ? <div className="en">{en}</div> : null}
    </>
  );
}

export function SourceGap({ message }: { message: string }) {
  return (
    <div className="empty">
      <p>{message}</p>
    </div>
  );
}

type NodeBox = { cx: number; cy: number; width: number; height: number };

/** Where a ray from a pill's center leaves the stadium (border-radius: 999px). */
function pillBoundary(box: NodeBox, towardX: number, towardY: number) {
  const dx = towardX - box.cx;
  const dy = towardY - box.cy;
  const len = Math.hypot(dx, dy);
  if (len < 0.001 || box.width < 1 || box.height < 1) return { x: box.cx, y: box.cy };
  const ux = dx / len;
  const uy = dy / len;
  const hw = box.width / 2;
  const hh = box.height / 2;
  const horizontal = box.width >= box.height;
  const radius = horizontal ? hh : hw;
  const straight = Math.max(0, (horizontal ? hw : hh) - radius);

  if (horizontal && Math.abs(uy) > 1e-8) {
    const t = (uy > 0 ? radius : -radius) / uy;
    const x = ux * t;
    if (t > 0 && Math.abs(x) <= straight + 0.01) {
      return { x: box.cx + ux * t, y: box.cy + uy * t };
    }
  }
  if (!horizontal && Math.abs(ux) > 1e-8) {
    const t = (ux > 0 ? radius : -radius) / ux;
    const y = uy * t;
    if (t > 0 && Math.abs(y) <= straight + 0.01) {
      return { x: box.cx + ux * t, y: box.cy + uy * t };
    }
  }

  const capRight = horizontal ? ux >= 0 : false;
  const capDown = horizontal ? false : uy >= 0;
  const capX = horizontal ? (capRight ? straight : -straight) : 0;
  const capY = horizontal ? 0 : capDown ? straight : -straight;
  const t = outerCapDistance(ux, uy, capX, capY, radius, (x, y) => {
    if (horizontal) return capRight ? x >= capX - 0.5 : x <= capX + 0.5;
    return capDown ? y >= capY - 0.5 : y <= capY + 0.5;
  });
  if (t == null) return { x: box.cx, y: box.cy };
  return { x: box.cx + ux * t, y: box.cy + uy * t };
}

function outerCapDistance(
  ux: number,
  uy: number,
  capX: number,
  capY: number,
  radius: number,
  onCap: (x: number, y: number) => boolean,
) {
  const b = -2 * (ux * capX + uy * capY);
  const c = capX * capX + capY * capY - radius * radius;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const sqrt = Math.sqrt(disc);
  const hits = [(-b - sqrt) / 2, (-b + sqrt) / 2].filter((t) => t > 0.01 && onCap(ux * t, uy * t));
  if (hits.length === 0) return null;
  return Math.max(...hits);
}

function boxesEqual(a: Map<string, NodeBox>, b: Map<string, NodeBox>) {
  if (a.size !== b.size) return false;
  for (const [id, box] of b) {
    const prev = a.get(id);
    if (!prev) return false;
    if (
      Math.abs(prev.cx - box.cx) > 0.5 ||
      Math.abs(prev.cy - box.cy) > 0.5 ||
      Math.abs(prev.width - box.width) > 0.5 ||
      Math.abs(prev.height - box.height) > 0.5
    ) {
      return false;
    }
  }
  return true;
}

export function GraphView({ lesson }: { lesson: Lesson }) {
  const nodes = useMemo(
    () => lesson.graph.nodes.filter((node) => node.label.trim()),
    [lesson],
  );
  const edges = lesson.graph.edges;
  const graphRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [metrics, setMetrics] = useState<{ boxes: Map<string, NodeBox>; width: number; height: number }>({
    boxes: new Map(),
    width: 0,
    height: 0,
  });

  const positions = useMemo(() => {
    const next = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1) - Math.PI / 2;
      next.set(node.id, { x: 50 + 34 * Math.cos(angle), y: 50 + 34 * Math.sin(angle) });
    });
    return next;
  }, [nodes]);

  useLayoutEffect(() => {
    const root = graphRef.current;
    if (!root) return;

    const measure = () => {
      const origin = svgRef.current?.getBoundingClientRect() ?? root.getBoundingClientRect();
      const next = new Map<string, NodeBox>();
      for (const node of nodes) {
        const element = nodeRefs.current.get(node.id);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) continue;
        next.set(node.id, {
          cx: rect.left - origin.left + rect.width / 2,
          cy: rect.top - origin.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
      const width = origin.width;
      const height = origin.height;
      setMetrics((prev) =>
        boxesEqual(prev.boxes, next) && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : { boxes: next, width, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const element of nodeRefs.current.values()) observer.observe(element);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [nodes]);

  if (nodes.length === 0) return <SourceGap message="Nguồn chưa đủ để tạo Knowledge Graph." />;

  const { boxes } = metrics;
  const segments = edges.flatMap((edge, index) => {
    const from = boxes.get(edge.from);
    const to = boxes.get(edge.to);
    if (!from || !to) return [];
    const start = pillBoundary(from, to.cx, to.cy);
    const end = pillBoundary(to, from.cx, from.cy);
    if (Math.hypot(end.x - start.x, end.y - start.y) < 1) return [];
    return [{ key: `${edge.from}-${edge.to}-${edge.label}-${index}`, edge, start, end }];
  });

  return (
    <>
      <div className="bar">
        <div>
          <h3>Historical Knowledge Graph</h3>
          <small>AI cấu trúc hóa Person • Event • Time • Place • Cause • Consequence</small>
        </div>
        <span className="badge">SOURCE-GROUNDED</span>
      </div>
      <div className="graph" ref={graphRef}>
        <svg
          ref={svgRef}
          className="graph-lines"
          viewBox={`0 0 ${Math.max(metrics.width, 1)} ${Math.max(metrics.height, 1)}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {segments.map((segment) => (
            <line
              key={segment.key}
              x1={segment.start.x}
              y1={segment.start.y}
              x2={segment.end.x}
              y2={segment.end.y}
              stroke="#ffd98b"
              strokeOpacity={0.53}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {segments.map((segment) => {
          const label = segment.edge.label.trim();
          if (!label) return null;
          return (
            <span
              key={`${segment.key}-label`}
              className="edge-label"
              style={{
                left: (segment.start.x + segment.end.x) / 2,
                top: (segment.start.y + segment.end.y) / 2,
              }}
            >
              {label}
            </span>
          );
        })}
        {nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) return null;
          return (
            <div
              key={node.id}
              className="node"
              ref={(element) => {
                if (element) nodeRefs.current.set(node.id, element);
                else nodeRefs.current.delete(node.id);
              }}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              title={node.type}
            >
              {node.label}
            </div>
          );
        })}
        <div className="legend">AI không chỉ tạo slide — AI biến nguồn phi cấu trúc thành bản đồ tri thức lịch sử.</div>
      </div>
    </>
  );
}

export function MissionView({ lesson, lang }: { lesson: Lesson; lang: Lang }) {
  const mission = lesson.mission;
  const [open, setOpen] = useState<number | null>(null);
  const hasCopy = Boolean(
    mission &&
      (mission.scene_vi.trim() ||
        mission.scene_en.trim() ||
        mission.question_vi.trim() ||
        mission.question_en.trim() ||
        mission.choices.some((choice) => choice.vi.trim() || choice.en.trim())),
  );
  if (!mission || !hasCopy) return <SourceGap message="Nguồn chưa đủ để tạo Time Travel." />;

  return (
    <div className="mission">
      <div className="tag">⏳ AI TIME TRAVEL MISSION</div>
      <h2>ENTER HISTORY</h2>
      {show(lang, mission.scene_vi, mission.scene_en)}
      <div style={{ fontSize: 22, fontWeight: 800, margin: "22px 0 8px" }}>
        {show(lang, mission.question_vi, mission.question_en)}
      </div>
      {mission.choices.map((choice, index) => (
        <div key={`${choice.vi}-${index}`}>
          {choice.vi.trim() || choice.en.trim() ? (
            <button type="button" className="ch" onClick={() => setOpen(index)}>
              {[choice.vi.trim(), choice.en.trim()].filter(Boolean).join(" / ")}
            </button>
          ) : null}
          <div className={open === index ? "fb" : "fb hide"}>
            {show(lang, choice.consequence_vi ?? "", choice.consequence_en ?? "")}
          </div>
        </div>
      ))}
    </div>
  );
}

export function VerifyView({ lesson, lang }: { lesson: Lesson; lang: Lang }) {
  const challenge = lesson.ai_vs_history.find(
    (item) => item.statement_vi.trim() || item.statement_en.trim(),
  );
  const [picked, setPicked] = useState<string | null>(null);
  if (!challenge) return <SourceGap message="Nguồn chưa đủ để tạo AI vs History." />;
  const correct = picked === challenge.answer;

  return (
    <div className="verify">
      <div className="tag" style={{ color: "#9a6700" }}>
        🤖 AI vs HISTORY
      </div>
      <h2>Can you catch the AI?</h2>
      <p>Không tin AI ngay. Hãy phân loại claim và yêu cầu bằng chứng.</p>
      <div className="statement">
        {challenge.statement_vi.trim() ? <div>“{challenge.statement_vi}”</div> : null}
        {challenge.statement_en.trim() ? <small>{challenge.statement_en}</small> : null}
      </div>
      <div className="answers">
        <button type="button" className="btn" onClick={() => setPicked("fact")}>
          🟢 FACT
        </button>
        <button type="button" className="btn" onClick={() => setPicked("interpretation")}>
          🟡 INTERPRETATION
        </button>
        <button type="button" className="btn" onClick={() => setPicked("unsupported")}>
          🔴 UNSUPPORTED
        </button>
      </div>
      {picked ? (
        <div className="fb" style={{ background: correct ? "#e8f7ef" : "#fff1ee" }}>
          <b>{correct ? "✅ Chính xác" : "🤔 Hãy kiểm chứng lại"}</b>
          {show(lang, challenge.explanation_vi, challenge.explanation_en)}
        </div>
      ) : null}
    </div>
  );
}

export function ReportView() {
  return (
    <div className="empty">
      <div>
        <h3>Learning Analytics</h3>
        <p>Chưa có dữ liệu học tập.</p>
      </div>
    </div>
  );
}
