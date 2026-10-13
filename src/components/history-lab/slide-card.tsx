"use client";

import { createContext, useContext, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  layoutById,
  readCauseEffect,
  readCharacter,
  readComparison,
  readContext,
  readMap,
  readObjectives,
  readSummary,
  readTimeline,
} from "@/services/lessons/layout-catalog";
import type { LessonSlide } from "@/services/lessons/lesson-types";

type Lang = "vi" | "both" | "en";

const MotionStep = createContext<() => number>(() => 0);

function useMotion() {
  const next = useContext(MotionStep);
  const step = useRef<number | null>(null);
  if (step.current == null) step.current = next();
  return {
    className: "el",
    style: { animationDelay: `${Math.min(step.current, 10) * 75}ms` },
  };
}

function El({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  const motion = useMotion();
  return (
    <div className={[motion.className, className].filter(Boolean).join(" ")} style={{ ...motion.style, ...style }}>
      {children}
    </div>
  );
}

function MotionStage({ className, children }: { className: string; children: ReactNode }) {
  const count = useRef(0);
  count.current = 0;
  const next = () => {
    const value = count.current;
    count.current += 1;
    return value;
  };
  return (
    <MotionStep.Provider value={next}>
      <div className={className}>{children}</div>
    </MotionStep.Provider>
  );
}

function mainIdeas(text: string) {
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

function IdeaList({ lang, vi, en }: { lang: Lang; vi: string; en: string }) {
  const viIdeas = lang === "en" ? [] : mainIdeas(vi);
  const enIdeas = lang === "vi" ? [] : mainIdeas(en);
  const primary = lang === "en" ? enIdeas : viIdeas;
  if (primary.length === 0 && enIdeas.length === 0) return null;
  return (
    <div className="lang-split">
      {primary.length > 0 ? (
        <div className="ideas">
          {primary.map((point) => (
            <El className="idea" key={point}>
              {point}
            </El>
          ))}
        </div>
      ) : null}
      {lang === "both" && enIdeas.length > 0 ? (
        <El className="en-panel">
          {enIdeas.map((point) => (
            <p className="en-line" key={point}>
              {point}
            </p>
          ))}
        </El>
      ) : null}
    </div>
  );
}

function show(lang: Lang, vi: string, en: string) {
  return (
    <>
      {lang !== "en" && vi ? <El className="vi">{vi}</El> : null}
      {lang !== "vi" && en ? <El className="en">{en}</El> : null}
    </>
  );
}

function face(lang: Lang, vi: string, en: string) {
  if (lang === "en") return en || vi;
  if (lang === "both") return en && en !== vi ? `${vi} / ${en}` : vi;
  return vi;
}

function EmptyNote({ lang, vi, en }: { lang: Lang; vi: string; en: string }) {
  return <El className="layout-empty">{face(lang, vi, en)}</El>;
}

function PointList({ lang, vi, en }: { lang: Lang; vi: string[]; en: string[] }) {
  const count = Math.max(vi.length, en.length);
  if (count === 0) return null;
  return (
    <ul className="slot-points">
      {Array.from({ length: count }, (_, index) => (
        <Point key={`${vi[index] ?? ""}-${en[index] ?? ""}-${index}`} lang={lang} vi={vi[index] ?? ""} en={en[index] ?? ""} />
      ))}
    </ul>
  );
}

function Point({ lang, vi, en }: { lang: Lang; vi: string; en: string }) {
  const motion = useMotion();
  return (
    <li className={motion.className} style={motion.style}>
      {lang !== "en" && vi ? <div className="vi">{vi}</div> : null}
      {lang !== "vi" && en ? <div className="en">{en}</div> : null}
    </li>
  );
}

function dragImage(event: ReactPointerEvent<HTMLImageElement>, onImageMove: (x: number, y: number) => void) {
  const parent = event.currentTarget.parentElement;
  if (!parent) return;
  const bounds = parent.getBoundingClientRect();
  const move = (pointer: PointerEvent) => {
    const x = ((pointer.clientX - bounds.left) / bounds.width) * 100;
    const y = ((pointer.clientY - bounds.top) / bounds.height) * 100;
    onImageMove(Math.min(88, Math.max(8, x)), Math.min(84, Math.max(12, y)));
  };
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}

function FrameImage({
  slide,
  editableImage,
  onImageMove,
  framed,
}: {
  slide: LessonSlide;
  editableImage?: boolean;
  onImageMove?: (x: number, y: number) => void;
  framed?: boolean;
}) {
  const motion = useMotion();
  if (!slide.image_url) return null;
  return (
    // The teacher places this image by hand. It is not chosen by a vision model.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={[framed ? "framed-photo" : "shot", motion.className].join(" ")}
      alt=""
      src={slide.image_url}
      style={
        framed
          ? { objectPosition: `${slide.image_x}% ${slide.image_y}%`, cursor: editableImage ? "grab" : undefined, ...motion.style }
          : { left: `${slide.image_x}%`, top: `${slide.image_y}%`, ...motion.style }
      }
      onPointerDown={
        editableImage
          ? (event) => {
              dragImage(event, (x, y) => onImageMove?.(x, y));
            }
          : undefined
      }
    />
  );
}

function LayoutBody({
  slide,
  lang,
  editableImage,
  onImageMove,
}: {
  slide: LessonSlide;
  lang: Lang;
  editableImage?: boolean;
  onImageMove?: (x: number, y: number) => void;
}) {
  if (slide.layout === "title") {
    return (
      <div className={slide.image_url ? "title-split" : undefined}>
        <div className="title-lead">
          <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} />
        </div>
        {slide.image_url ? (
          <div className="map-frame">
            <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} framed />
          </div>
        ) : null}
      </div>
    );
  }

  if (slide.layout === "objectives") {
    const vi = readObjectives(slide.body_vi);
    const en = readObjectives(slide.body_en);
    const count = Math.max(vi.length, en.length);
    if (count === 0) return <EmptyNote lang={lang} vi="Chưa có mục tiêu." en="No objectives yet." />;
    return (
      <div className="slots three">
        {Array.from({ length: count }, (_, index) => (
          <El className="card" key={vi[index] ?? en[index] ?? index}>
            <span className="obj-index">{index + 1}</span>
            {show(lang, vi[index] ?? "", en[index] ?? "")}
          </El>
        ))}
      </div>
    );
  }

  if (slide.layout === "context") {
    const vi = readContext(slide.body_vi);
    const en = readContext(slide.body_en);
    return (
      <div className={vi.know.length || en.know.length ? "split-2" : undefined}>
        <IdeaList lang={lang} vi={vi.narrative} en={en.narrative} />
        {vi.know.length || en.know.length ? (
          <El className="card">
            <b className="slot-kicker">{face(lang, "Cần biết trước", "Know first")}</b>
            <PointList lang={lang} vi={vi.know} en={en.know} />
          </El>
        ) : null}
      </div>
    );
  }

  if (slide.layout === "timeline") {
    const items = readTimeline(slide.body_vi, slide.body_en);
    if (items.length === 0) return <EmptyNote lang={lang} vi="Chưa có mốc thời gian." en="No timeline points yet." />;
    return (
      <div className={`slots ${items.length >= 4 ? "four" : "three"}`}>
        {items.map((item) => (
          <El className="card time-card" key={`${item.label}-${item.vi}`}>
            {item.label ? <b className="slot-kicker">{item.label}</b> : null}
            {item.vi ? <div className="vi">{item.vi}</div> : null}
            {lang !== "vi" && item.en ? <div className="en">{item.en}</div> : null}
          </El>
        ))}
      </div>
    );
  }

  if (slide.layout === "map") {
    const vi = readMap(slide.body_vi);
    const en = readMap(slide.body_en);
    return (
      <div className="split-2">
        <div className="map-frame">
          {slide.image_url ? (
            <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} framed />
          ) : (
            <EmptyNote lang={lang} vi="Chưa có bản đồ" en="No map yet" />
          )}
        </div>
        <div>
          {vi.place || en.place ? <El className="slot-kicker">{show(lang, vi.place, en.place)}</El> : null}
          <IdeaList lang={lang} vi={vi.description} en={en.description} />
          <PointList lang={lang} vi={vi.captions} en={en.captions} />
        </div>
      </div>
    );
  }

  if (slide.layout === "character") {
    const vi = readCharacter(slide.body_vi);
    const en = readCharacter(slide.body_en);
    const rows = [
      { vi: "Vai trò", en: "Role", valueVi: vi.role, valueEn: en.role },
      { vi: "Hành động", en: "Action", valueVi: vi.action, valueEn: en.action },
      { vi: "Ý nghĩa", en: "Meaning", valueVi: vi.meaning, valueEn: en.meaning },
    ].filter((row) => row.valueVi || row.valueEn);
    return (
      <div className="split-2">
        <div className="portrait">
          {slide.image_url ? (
            <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} framed />
          ) : (
            <EmptyNote lang={lang} vi="Chưa có chân dung" en="No portrait yet" />
          )}
        </div>
        <div>
          {vi.name || en.name ? <El className="slot-kicker">{show(lang, vi.name, en.name)}</El> : null}
          {rows.length === 0 ? <IdeaList lang={lang} vi={vi.narrative || slide.body_vi} en={en.narrative || slide.body_en} /> : null}
          {rows.map((row) => (
            <El className="card char-row" key={row.vi}>
              <b className="slot-kicker">{face(lang, row.vi, row.en)}</b>
              {show(lang, row.valueVi, row.valueEn)}
            </El>
          ))}
        </div>
      </div>
    );
  }

  if (slide.layout === "comparison") {
    const vi = readComparison(slide.body_vi);
    const en = readComparison(slide.body_en);
    return (
      <>
        <div className="slots two">
          <El className="card">
            <b className="slot-kicker">{face(lang, vi.a.label, en.a.label || vi.a.label)}</b>
            {vi.a.points.length === 0 && en.a.points.length === 0 ? (
              <EmptyNote lang={lang} vi="Chưa có ý cho vế A." en="No points for side A." />
            ) : (
              <PointList lang={lang} vi={vi.a.points} en={en.a.points} />
            )}
          </El>
          <El className="card">
            <b className="slot-kicker">{face(lang, vi.b.label, en.b.label || vi.b.label)}</b>
            {vi.b.points.length === 0 && en.b.points.length === 0 ? (
              <EmptyNote lang={lang} vi="Chưa có ý cho vế B." en="No points for side B." />
            ) : (
              <PointList lang={lang} vi={vi.b.points} en={en.b.points} />
            )}
          </El>
        </div>
        {vi.conclusion || en.conclusion ? (
          <El className="fb">{show(lang, vi.conclusion, en.conclusion)}</El>
        ) : null}
      </>
    );
  }

  if (slide.layout === "cause-effect") {
    const vi = readCauseEffect(slide.body_vi);
    const en = readCauseEffect(slide.body_en);
    const sections = [
      { vi: "Nguyên nhân", en: "Cause", pointsVi: vi.causes, pointsEn: en.causes },
      { vi: "Diễn biến", en: "Development", pointsVi: vi.developments, pointsEn: en.developments },
      { vi: "Hệ quả", en: "Consequence", pointsVi: vi.consequences, pointsEn: en.consequences },
    ];
    return (
      <div className="cause-flow">
        {sections.map((section, index) => (
          <div className="cause-step" key={section.vi}>
            {index > 0 ? (
              <div className="cause-arrow" aria-hidden="true">
                →
              </div>
            ) : null}
            <El className="card">
              <b className="slot-kicker">{face(lang, section.vi, section.en)}</b>
              {section.pointsVi.length === 0 && section.pointsEn.length === 0 ? (
                <EmptyNote lang={lang} vi="Chưa có ý." en="No point yet." />
              ) : (
                <PointList lang={lang} vi={section.pointsVi} en={section.pointsEn} />
              )}
            </El>
          </div>
        ))}
      </div>
    );
  }

  if (slide.layout === "quote") {
    return (
      <El className="quote-mark">
        {slide.body_vi || slide.body_en ? (
          <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} />
        ) : (
          <EmptyNote lang={lang} vi="Chưa có nội dung." en="No text yet." />
        )}
      </El>
    );
  }

  if (slide.layout === "vocab") {
    if (slide.vocab.length === 0) return <EmptyNote lang={lang} vi="Chưa có từ vựng." en="No vocabulary yet." />;
    return (
      <div className="vocab">
        {slide.vocab.slice(0, 6).map((item) => (
          <El className="card" key={`${item.en}-${item.vi}`}>
            <b style={{ color: "#ffd98b" }}>{item.en}</b>
            <br />
            {item.vi}
            {item.example ? (
              <>
                <br />
                <span className="en">{item.example}</span>
              </>
            ) : null}
          </El>
        ))}
      </div>
    );
  }

  if (slide.layout === "summary") {
    const vi = readSummary(slide.body_vi);
    const en = readSummary(slide.body_en);
    return (
      <>
        <div className="summary-lead">
          <IdeaList lang={lang} vi={vi.conclusion} en={en.conclusion} />
        </div>
        {vi.points.length || en.points.length ? (
          <div className="slots three">
            {Array.from({ length: Math.max(vi.points.length, en.points.length) }, (_, index) => (
              <El className="card" key={vi.points[index] ?? en.points[index] ?? index}>
                {show(lang, vi.points[index] ?? "", en.points[index] ?? "")}
              </El>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  return <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} />;
}

export function SlideCard({
  slide,
  index,
  lang,
  answered,
  onAnswer,
  editableImage,
  onImageMove,
}: {
  slide: LessonSlide;
  index: number;
  lang: Lang;
  answered?: number;
  onAnswer?: (choice: number) => void;
  editableImage?: boolean;
  onImageMove?: (x: number, y: number) => void;
}) {
  const title = lang === "en" ? slide.title_en || slide.title_vi : slide.title_vi;
  const embedImage = slide.layout === "title" || slide.layout === "map" || slide.layout === "character";
  const showQuiz = slide.layout === "quiz" || Boolean(slide.question_vi || slide.question_en || slide.choices.length > 0);
  const showVocab = slide.layout !== "vocab" && slide.vocab.length > 0;

  return (
    <MotionStage
      key={`${slide.id ?? "slide"}-${index}`}
      className={`slide layout-${slide.layout} anim-${slide.animation} trans-${slide.transition}`}
    >
      <div className="slide-mast">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/wewin-logo.png" alt="WEWIN AI HISTORY LAB" />
        <span>VIỆT NAM — HÀNH TRÌNH DÂN TỘC</span>
      </div>
      <div className="slide-copy">
      <El className="tag">
        {layoutById(slide.layout).label.toUpperCase()}
      </El>
      <El>
        <h2>
          {title}
          {lang === "both" && slide.title_en ? (
            <small>{slide.title_en}</small>
          ) : null}
        </h2>
      </El>
      {slide.layout === "quiz" ? <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} /> : (
        <LayoutBody slide={slide} lang={lang} editableImage={editableImage} onImageMove={onImageMove} />
      )}
      {showQuiz && (slide.question_vi || slide.question_en) ? (
        <El className={slide.layout === "quiz" ? "quiz-ask" : undefined} style={{ marginTop: 18, fontWeight: 800 }}>
          {slide.layout === "summary" ? (
            <b className="slot-kicker">{face(lang, "Câu suy ngẫm", "Think further")}</b>
          ) : null}
          {show(lang, slide.question_vi, slide.question_en)}
        </El>
      ) : null}
      {slide.layout === "quiz" && !slide.question_vi && !slide.question_en && slide.choices.length === 0 ? (
        <EmptyNote lang={lang} vi="Chưa có câu hỏi." en="No question yet." />
      ) : null}
      {showVocab ? (
        <div className="vocab">
          {slide.vocab.map((item) => (
            <El className="card" key={`${item.en}-${item.vi}`}>
              <b style={{ color: "#ffd98b" }}>{item.en}</b>
              <br />
              {item.vi}
            </El>
          ))}
        </div>
      ) : null}
      {showQuiz && slide.choices.length > 0 ? (
        <div className="choices">
          {slide.choices.map((choice, choiceIndex) => (
            <ChoiceButton
              key={`${choice.vi}-${choiceIndex}`}
              choice={choice}
              picked={answered != null}
              marked={slide.choices.some((item) => item.correct)}
              selected={answered === choiceIndex}
              onPick={() => onAnswer?.(choiceIndex)}
            />
          ))}
        </div>
      ) : null}
      {answered != null && slide.choices[answered] ? (
        <El className="fb">{show(lang, slide.choices[answered].feedback_vi ?? "", slide.choices[answered].feedback_en ?? "")}</El>
      ) : null}
      {embedImage ? null : <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} />}
      </div>
    </MotionStage>
  );
}

function ChoiceButton({
  choice,
  picked,
  marked,
  selected,
  onPick,
}: {
  choice: LessonSlide["choices"][number];
  picked: boolean;
  marked: boolean;
  selected: boolean;
  onPick: () => void;
}) {
  const motion = useMotion();
  const className = ["ch", motion.className, picked && marked && choice.correct ? "right" : "", picked && marked && selected && !choice.correct ? "wrong" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={className} style={motion.style} disabled={picked} onClick={onPick}>
      {choice.vi}
      {choice.en ? <span className="en">{choice.en}</span> : null}
    </button>
  );
}
