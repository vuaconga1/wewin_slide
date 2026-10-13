"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { hasPlacement, textKey, type TextSlot } from "@/services/lessons/slide-elements";
import type { SlideElements } from "@/services/lessons/lesson-types";

type StageApi = {
  arrange: boolean;
  elements: SlideElements;
  selected: string | null;
  editing: string | null;
  register: (id: string, node: HTMLElement | null) => void;
  pointerDown: (id: string, event: ReactPointerEvent<HTMLElement>) => void;
  commit: (slot: TextSlot, value: string) => void;
  finishEdit: () => void;
};

const StageContext = createContext<StageApi | null>(null);

function useStage() {
  const stage = useContext(StageContext);
  if (!stage) throw new Error("Slide block is outside the slide stage.");
  return stage;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function SlideStage({
  className,
  arrange,
  elements,
  onElements,
  onText,
  children,
}: {
  className: string;
  arrange?: boolean;
  elements: SlideElements;
  onElements?: (elements: SlideElements) => void;
  onText?: (slot: TextSlot, value: string) => void;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const [draft, setDraft] = useState<SlideElements | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const live = draft ?? elements;
  const liveRef = useRef(live);
  liveRef.current = live;
  const onElementsRef = useRef(onElements);
  onElementsRef.current = onElements;
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const register = useCallback((id: string, node: HTMLElement | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  const pointerDown = (id: string, event: ReactPointerEvent<HTMLElement>) => {
    if (!arrange || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("img")) return;
    if (target.isContentEditable) return;
    setSelected(id);
    const stage = stageRef.current;
    if (!stage) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    let origin: SlideElements | null = null;

    let done = false;
    const move = (pointer: PointerEvent | MouseEvent) => {
      const dx = pointer.clientX - startX;
      const dy = pointer.clientY - startY;
      if (!moved) {
        if (Math.hypot(dx, dy) < 4) return;
        moved = true;
        pointer.preventDefault();
        setEditing(null);
        origin = capture(stage, nodes.current, liveRef.current);
      }
      if (!origin) return;
      const base = origin[id];
      if (!base || typeof base.x !== "number" || typeof base.y !== "number") return;
      const bounds = stage.getBoundingClientRect();
      const next: SlideElements = {
        ...origin,
        [id]: {
          ...base,
          x: clamp(base.x + (dx / bounds.width) * 100, 0, 94),
          y: clamp(base.y + (dy / bounds.height) * 100, 0, 92),
        },
      };
      liveRef.current = next;
      setDraft(next);
    };

    const up = (pointer: PointerEvent | MouseEvent) => {
      if (done) return;
      done = true;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("mouseup", up);
      if (moved) {
        onElementsRef.current?.(liveRef.current);
        setDraft(null);
        return;
      }
      const key = (pointer.target as HTMLElement | null)?.closest("[data-slot]")?.getAttribute("data-slot");
      setEditing(key ?? null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("mousemove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("mouseup", up);
  };

  const api: StageApi = {
    arrange: Boolean(arrange),
    elements: live,
    selected: arrange ? selected : null,
    editing: arrange ? editing : null,
    register,
    pointerDown,
    commit: (slot, value) => onTextRef.current?.(slot, value),
    finishEdit: () => setEditing(null),
  };

  const freeform = hasPlacement(live);

  return (
    <StageContext.Provider value={api}>
      <div
        ref={stageRef}
        className={[className, freeform ? "is-free" : ""].filter(Boolean).join(" ")}
        onPointerDown={(event) => {
          if (!arrange) return;
          const target = event.target as HTMLElement;
          if (target.closest("[data-block]")) return;
          setSelected(null);
          setEditing(null);
        }}
      >
        {children}
      </div>
    </StageContext.Provider>
  );
}

function capture(stage: HTMLElement, nodes: Map<string, HTMLElement>, existing: SlideElements) {
  const bounds = stage.getBoundingClientRect();
  const next: SlideElements = { ...existing };
  if (bounds.width < 1 || bounds.height < 1) return next;
  for (const [id, node] of nodes) {
    const prev = next[id];
    if (typeof prev?.x === "number" && typeof prev?.y === "number") continue;
    const box = node.getBoundingClientRect();
    next[id] = {
      ...prev,
      x: ((box.left - bounds.left) / bounds.width) * 100,
      y: ((box.top - bounds.top) / bounds.height) * 100,
      w: Math.max(1, (box.width / bounds.width) * 100),
    };
  }
  return next;
}

export function Block({
  id,
  className,
  style,
  children,
}: {
  id: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const stage = useStage();
  const place = stage.elements[id];
  const placed = typeof place?.x === "number" && typeof place?.y === "number";
  const selected = stage.arrange && stage.selected === id;
  const register = stage.register;
  const ref = useCallback((node: HTMLDivElement | null) => register(id, node), [register, id]);

  return (
    <div
      ref={ref}
      data-block={id}
      className={["stage-block", className, placed ? "is-placed" : "", stage.arrange ? "is-live" : "", selected ? "is-selected" : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...style,
        ...(placed
          ? {
              left: `${place.x}%`,
              top: `${place.y}%`,
              width: typeof place.w === "number" ? `${place.w}%` : undefined,
            }
          : null),
      }}
      onPointerDown={stage.arrange ? (event) => stage.pointerDown(id, event) : undefined}
    >
      {children}
    </div>
  );
}

export function LiveText({
  as = "div",
  className,
  slot,
  value,
}: {
  as?: "div" | "p" | "h2" | "span" | "b";
  className?: string;
  slot: TextSlot;
  value: string;
}) {
  const stage = useStage();
  const key = textKey(slot);
  const active = stage.arrange && stage.editing === key;
  const ref = useRef<HTMLElement>(null);
  const Tag = as;

  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [active]);

  if (!value && !active) return null;

  return (
    <Tag
      ref={ref as never}
      className={className}
      data-slot={key}
      contentEditable={active || undefined}
      suppressContentEditableWarning
      spellCheck={false}
      onPointerDown={(event) => {
        if (active) event.stopPropagation();
      }}
      onBlur={(event) => {
        if (!active) return;
        const next = event.currentTarget.innerText.replace(/\u00a0/g, " ").trim();
        stage.finishEdit();
        if (next !== value.trim()) stage.commit(slot, next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}
