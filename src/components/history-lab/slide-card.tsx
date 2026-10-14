"use client";

import Image from "next/image";

import { createContext, useContext, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Block, LiveText, SlideStage } from "@/components/history-lab/slide-stage";
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
import { applyElementText, SLIDE_TITLE_CHROME, splitIdeas, type TextOp } from "@/services/lessons/slide-elements";
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

function StageBlock({
  id,
  className,
  children,
  style,
  still,
}: {
  id: string;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  still?: boolean;
}) {
  const motion = useMotion();
  return (
    <Block
      id={id}
      className={[still ? "" : motion.className, className].filter(Boolean).join(" ")}
      style={{ ...(still ? null : motion.style), ...style }}
    >
      {children}
    </Block>
  );
}

function Bilingual({
  lang,
  vi,
  en,
  id,
  opFor,
}: {
  lang: Lang;
  vi: string;
  en: string;
  id: string;
  opFor: (field: "vi" | "en") => TextOp;
}) {
  return (
    <>
      {lang !== "en" ? <LiveText className="vi" slot={{ id, op: opFor("vi") }} value={vi} /> : null}
      {lang !== "vi" ? <LiveText className="en" slot={{ id, op: opFor("en") }} value={en} /> : null}
    </>
  );
}

function IdeaList({
  lang,
  vi,
  en,
  region,
}: {
  lang: Lang;
  vi: string;
  en: string;
  region: "body" | "context" | "summary" | "map";
}) {
  const viIdeas = lang === "en" ? [] : splitIdeas(vi);
  const enIdeas = lang === "vi" ? [] : splitIdeas(en);
  const primary = lang === "en" ? enIdeas : viIdeas;
  const field = lang === "en" ? "en" : "vi";
  if (primary.length === 0 && enIdeas.length === 0) return null;
  return (
    <div className="lang-split">
      {primary.length > 0 ? (
        <div className="ideas">
          {primary.map((point, index) => (
            <StageBlock className="idea" id={`${region}-${index}`} key={`${region}-${index}`}>
              <LiveText slot={{ id: `${region}-${index}`, op: { type: "idea", region, index, field } }} value={point} />
            </StageBlock>
          ))}
        </div>
      ) : null}
      {lang === "both" && enIdeas.length > 0 ? (
        <StageBlock className="en-panel" id={`${region}-en`}>
          {enIdeas.map((point, index) => (
            <LiveText
              as="p"
              className="en-line"
              key={`${region}-en-${index}`}
              slot={{ id: `${region}-en`, op: { type: "idea", region, index, field: "en" } }}
              value={point}
            />
          ))}
        </StageBlock>
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

function PointList({
  lang,
  vi,
  en,
  id,
  opFor,
}: {
  lang: Lang;
  vi: string[];
  en: string[];
  id: string;
  opFor: (index: number, field: "vi" | "en") => TextOp;
}) {
  const count = Math.max(vi.length, en.length);
  if (count === 0) return null;
  return (
    <ul className="slot-points">
      {Array.from({ length: count }, (_, index) => (
        <Point
          key={`${id}-${index}`}
          lang={lang}
          vi={vi[index] ?? ""}
          en={en[index] ?? ""}
          id={id}
          opFor={(field) => opFor(index, field)}
        />
      ))}
    </ul>
  );
}

function Point({
  lang,
  vi,
  en,
  id,
  opFor,
}: {
  lang: Lang;
  vi: string;
  en: string;
  id: string;
  opFor: (field: "vi" | "en") => TextOp;
}) {
  const motion = useMotion();
  return (
    <li className={motion.className} style={motion.style}>
      <Bilingual lang={lang} vi={vi} en={en} id={id} opFor={opFor} />
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
          <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} region="body" />
        </div>
        {slide.image_url ? (
          <StageBlock id="image-frame" className="map-frame" still>
            <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} framed />
          </StageBlock>
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
          <StageBlock className="card" id={`obj-${index}`} key={`obj-${index}`}>
            <span className="obj-index">{index + 1}</span>
            <Bilingual
              lang={lang}
              vi={vi[index] ?? ""}
              en={en[index] ?? ""}
              id={`obj-${index}`}
              opFor={(field) => ({ type: "lines", region: "objectives", index, field })}
            />
          </StageBlock>
        ))}
      </div>
    );
  }

  if (slide.layout === "context") {
    const vi = readContext(slide.body_vi);
    const en = readContext(slide.body_en);
    return (
      <div className={vi.know.length || en.know.length ? "split-2" : undefined}>
        <IdeaList lang={lang} vi={vi.narrative} en={en.narrative} region="context" />
        {vi.know.length || en.know.length ? (
          <StageBlock className="card" id="know">
            <b className="slot-kicker">{face(lang, "Cần biết trước", "Know first")}</b>
            <PointList
              lang={lang}
              vi={vi.know}
              en={en.know}
              id="know"
              opFor={(index, field) => ({ type: "lines", region: "know", index, field })}
            />
          </StageBlock>
        ) : null}
      </div>
    );
  }

  if (slide.layout === "timeline") {
    const items = readTimeline(slide.body_vi, slide.body_en);
    if (items.length === 0) return <EmptyNote lang={lang} vi="Chưa có mốc thời gian." en="No timeline points yet." />;
    return (
      <div className={`slots ${items.length >= 4 ? "four" : "three"}`}>
        {items.map((item, index) => (
          <StageBlock className="card time-card" id={`time-${index}`} key={`time-${index}`}>
            {item.label ? (
              <LiveText
                as="b"
                className="slot-kicker"
                slot={{ id: `time-${index}`, op: { type: "timeline", index, part: "label" } }}
                value={item.label}
              />
            ) : null}
            {lang !== "en" ? (
              <LiveText className="vi" slot={{ id: `time-${index}`, op: { type: "timeline", index, part: "vi" } }} value={item.vi} />
            ) : null}
            {lang !== "vi" ? (
              <LiveText className="en" slot={{ id: `time-${index}`, op: { type: "timeline", index, part: "en" } }} value={item.en} />
            ) : null}
          </StageBlock>
        ))}
      </div>
    );
  }

  if (slide.layout === "map") {
    const vi = readMap(slide.body_vi);
    const en = readMap(slide.body_en);
    return (
      <div className="split-2">
        <StageBlock id="image-frame" className="map-frame" still>
          {slide.image_url ? (
            <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} framed />
          ) : (
            <EmptyNote lang={lang} vi="Chưa có bản đồ" en="No map yet" />
          )}
        </StageBlock>
        <div>
          {vi.place || en.place ? (
            <StageBlock id="map-place">
              <div className="slot-kicker">
                <Bilingual
                  lang={lang}
                  vi={vi.place}
                  en={en.place}
                  id="map-place"
                  opFor={(field) => ({ type: "map", part: "place", field })}
                />
              </div>
            </StageBlock>
          ) : null}
          <IdeaList lang={lang} vi={vi.description} en={en.description} region="map" />
          <PointList
            lang={lang}
            vi={vi.captions}
            en={en.captions}
            id="map-notes"
            opFor={(index, field) => ({ type: "lines", region: "caption", index, field })}
          />
        </div>
      </div>
    );
  }

  if (slide.layout === "character") {
    const vi = readCharacter(slide.body_vi);
    const en = readCharacter(slide.body_en);
    const rows = [
      { part: "role" as const, vi: "Vai trò", en: "Role", valueVi: vi.role, valueEn: en.role },
      { part: "action" as const, vi: "Hành động", en: "Action", valueVi: vi.action, valueEn: en.action },
      { part: "meaning" as const, vi: "Ý nghĩa", en: "Meaning", valueVi: vi.meaning, valueEn: en.meaning },
    ].filter((row) => row.valueVi || row.valueEn);
    return (
      <div className="split-2">
        <StageBlock id="image-frame" className="portrait" still>
          {slide.image_url ? (
            <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} framed />
          ) : (
            <EmptyNote lang={lang} vi="Chưa có chân dung" en="No portrait yet" />
          )}
        </StageBlock>
        <div>
          {vi.name || en.name ? (
            <StageBlock id="char-name">
              <div className="slot-kicker">
                <Bilingual
                  lang={lang}
                  vi={vi.name}
                  en={en.name}
                  id="char-name"
                  opFor={(field) => ({ type: "character", part: "name", field })}
                />
              </div>
            </StageBlock>
          ) : null}
          {rows.length === 0 ? <IdeaList lang={lang} vi={vi.narrative || slide.body_vi} en={en.narrative || slide.body_en} region="body" /> : null}
          {rows.map((row) => (
            <StageBlock className="card char-row" id={`char-${row.part}`} key={row.part}>
              <b className="slot-kicker">{face(lang, row.vi, row.en)}</b>
              <Bilingual
                lang={lang}
                vi={row.valueVi}
                en={row.valueEn}
                id={`char-${row.part}`}
                opFor={(field) => ({ type: "character", part: row.part, field })}
              />
            </StageBlock>
          ))}
        </div>
      </div>
    );
  }

  if (slide.layout === "comparison") {
    const vi = readComparison(slide.body_vi);
    const en = readComparison(slide.body_en);
    const sides = [
      { id: "side-a", side: "a" as const, vi: vi.a, en: en.a, emptyVi: "Chưa có ý cho vế A.", emptyEn: "No points for side A." },
      { id: "side-b", side: "b" as const, vi: vi.b, en: en.b, emptyVi: "Chưa có ý cho vế B.", emptyEn: "No points for side B." },
    ];
    return (
      <>
        <div className="slots two">
          {sides.map((side) => (
            <StageBlock className="card" id={side.id} key={side.id}>
              <LiveText
                as="b"
                className="slot-kicker"
                slot={{
                  id: side.id,
                  op: { type: "compare-label", side: side.side, field: lang === "en" ? "en" : "vi" },
                }}
                value={lang === "en" ? side.en.label || side.vi.label : side.vi.label}
              />
              {lang === "both" && side.en.label ? (
                <LiveText
                  className="en"
                  slot={{ id: side.id, op: { type: "compare-label", side: side.side, field: "en" } }}
                  value={side.en.label}
                />
              ) : null}
              {side.vi.points.length === 0 && side.en.points.length === 0 ? (
                <EmptyNote lang={lang} vi={side.emptyVi} en={side.emptyEn} />
              ) : (
                <PointList
                  lang={lang}
                  vi={side.vi.points}
                  en={side.en.points}
                  id={side.id}
                  opFor={(index, field) => ({ type: "compare-point", side: side.side, index, field })}
                />
              )}
            </StageBlock>
          ))}
        </div>
        {vi.conclusion || en.conclusion ? (
          <StageBlock className="fb" id="compare-end">
            <Bilingual
              lang={lang}
              vi={vi.conclusion}
              en={en.conclusion}
              id="compare-end"
              opFor={(field) => ({ type: "compare-end", field })}
            />
          </StageBlock>
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
            <StageBlock className="card" id={`cause-${index}`}>
              <b className="slot-kicker">{face(lang, section.vi, section.en)}</b>
              {section.pointsVi.length === 0 && section.pointsEn.length === 0 ? (
                <EmptyNote lang={lang} vi="Chưa có ý." en="No point yet." />
              ) : (
                <PointList
                  lang={lang}
                  vi={section.pointsVi}
                  en={section.pointsEn}
                  id={`cause-${index}`}
                  opFor={(point, field) => ({ type: "cause", section: index, point, field })}
                />
              )}
            </StageBlock>
          </div>
        ))}
      </div>
    );
  }

  if (slide.layout === "quote") {
    return (
      <div className="quote-mark">
        {slide.body_vi || slide.body_en ? (
          <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} region="body" />
        ) : (
          <EmptyNote lang={lang} vi="Chưa có nội dung." en="No text yet." />
        )}
      </div>
    );
  }

  if (slide.layout === "vocab") {
    if (slide.vocab.length === 0) return <EmptyNote lang={lang} vi="Chưa có từ vựng." en="No vocabulary yet." />;
    return (
      <div className="vocab">
        {slide.vocab.slice(0, 6).map((item, index) => (
          <StageBlock className="card" id={`vocab-${index}`} key={`vocab-${index}`}>
            <b style={{ color: "#ffd98b" }}>
              <LiveText as="span" slot={{ id: `vocab-${index}`, op: { type: "vocab", index, part: "en" } }} value={item.en} />
            </b>
            <br />
            <LiveText slot={{ id: `vocab-${index}`, op: { type: "vocab", index, part: "vi" } }} value={item.vi} />
            {item.example ? (
              <>
                <br />
                <LiveText className="en" slot={{ id: `vocab-${index}`, op: { type: "vocab", index, part: "example" } }} value={item.example} />
              </>
            ) : null}
          </StageBlock>
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
          <IdeaList lang={lang} vi={vi.conclusion} en={en.conclusion} region="summary" />
        </div>
        {vi.points.length || en.points.length ? (
          <div className="slots three">
            {Array.from({ length: Math.max(vi.points.length, en.points.length) }, (_, index) => (
              <StageBlock className="card" id={`summary-${index}`} key={`summary-${index}`}>
                <Bilingual
                  lang={lang}
                  vi={vi.points[index] ?? ""}
                  en={en.points[index] ?? ""}
                  id={`summary-${index}`}
                  opFor={(field) => ({ type: "lines", region: "summary-point", index, field })}
                />
              </StageBlock>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  return <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} region="body" />;
}

export function SlideCard({
  slide,
  index,
  lang,
  answered,
  onAnswer,
  editableImage,
  onImageMove,
  arrange,
  onSlideChange,
}: {
  slide: LessonSlide;
  index: number;
  lang: Lang;
  answered?: number;
  onAnswer?: (choice: number) => void;
  editableImage?: boolean;
  onImageMove?: (x: number, y: number) => void;
  arrange?: boolean;
  onSlideChange?: (patch: Partial<LessonSlide>) => void;
}) {
  const titleField = lang === "en" && slide.title_en ? "en" : "vi";
  const titleText = titleField === "en" ? slide.title_en : slide.title_vi;
  const embedImage = slide.layout === "title" || slide.layout === "map" || slide.layout === "character";
  const visibleChoices = slide.choices.filter((choice) => choice.vi.trim() || choice.en?.trim());
  const showQuiz = slide.layout === "quiz" || Boolean(slide.question_vi || slide.question_en || visibleChoices.length > 0);
  const showVocab = slide.layout !== "vocab" && slide.vocab.length > 0;
  const choiceEditable = Boolean(arrange) || !onAnswer;

  return (
    <SlideStage
      key={`${slide.id ?? "slide"}-${index}`}
      className={`slide layout-${slide.layout} anim-${slide.animation} trans-${slide.transition} ${slide.image_url ? "has-image" : "no-image"}`}
      arrange={arrange}
      elements={slide.elements ?? {}}
      onElements={(elements) => onSlideChange?.({ elements })}
      onText={(slot, value) => {
        const patch = applyElementText(slide, slot, value);
        if (Object.keys(patch).length > 0) onSlideChange?.(patch);
      }}
    >
      <MotionStage className="slide-fill">
      <div className="slide-head">
      <div className="slide-mast">
        <Image src="/assets/wewin-logo.png" alt="WEWIN AI HISTORY LAB" width={110} height={28} sizes="110px" />
        <span>VIỆT NAM — HÀNH TRÌNH DÂN TỘC</span>
      </div>
      <div
        className="slide-titles"
        style={{
          "--slide-kicker-size": `${SLIDE_TITLE_CHROME.kickerPx}px`,
          "--slide-title-size": `${SLIDE_TITLE_CHROME.titleViPx}px`,
          "--slide-subtitle-size": `${SLIDE_TITLE_CHROME.titleEnPx}px`,
        } as CSSProperties}
      >
      <StageBlock id="tag" className="block-wide" still>
        <div className="tag">{layoutById(slide.layout).label.toUpperCase()}</div>
      </StageBlock>
      <StageBlock id="title" className="block-wide">
        <LiveText as="h2" slot={{ id: "title", op: { type: "title", field: titleField } }} value={titleText} />
      </StageBlock>
      {lang === "both" && slide.title_en ? (
        <StageBlock id="subtitle" className="block-wide">
          <LiveText as="p" className="slide-subtitle" slot={{ id: "subtitle", op: { type: "title", field: "en" } }} value={slide.title_en} />
        </StageBlock>
      ) : null}
      </div>
      </div>
      <div className="slide-copy">
      {slide.layout === "quiz" ? <IdeaList lang={lang} vi={slide.body_vi} en={slide.body_en} region="body" /> : (
        <LayoutBody slide={slide} lang={lang} editableImage={editableImage} onImageMove={onImageMove} />
      )}
      {showQuiz && (slide.question_vi || slide.question_en) ? (
        <StageBlock id="question" className={slide.layout === "quiz" ? "quiz-ask block-wide" : "block-wide"} style={{ marginTop: 18, fontWeight: 800 }}>
          {slide.layout === "summary" ? (
            <b className="slot-kicker">{face(lang, "Câu suy ngẫm", "Think further")}</b>
          ) : null}
          <Bilingual
            lang={lang}
            vi={slide.question_vi}
            en={slide.question_en}
            id="question"
            opFor={(field) => ({ type: "question", field })}
          />
        </StageBlock>
      ) : null}
      {slide.layout === "quiz" && !slide.question_vi && !slide.question_en && visibleChoices.length === 0 ? (
        <EmptyNote lang={lang} vi="Chưa có câu hỏi." en="No question yet." />
      ) : null}
      {showVocab ? (
        <div className="vocab">
          {slide.vocab.map((item, itemIndex) => (
            <StageBlock className="card" id={`extra-vocab-${itemIndex}`} key={`extra-vocab-${itemIndex}`}>
              <b style={{ color: "#ffd98b" }}>
                <LiveText as="span" slot={{ id: `extra-vocab-${itemIndex}`, op: { type: "vocab", index: itemIndex, part: "en" } }} value={item.en} />
              </b>
              <br />
              <LiveText slot={{ id: `extra-vocab-${itemIndex}`, op: { type: "vocab", index: itemIndex, part: "vi" } }} value={item.vi} />
            </StageBlock>
          ))}
        </div>
      ) : null}
      {showQuiz && visibleChoices.length > 0 ? (
        <div className="choices">
          {slide.choices.map((choice, choiceIndex) => {
            if (!choice.vi.trim() && !(choice.en ?? "").trim()) return null;
            return (
              <StageBlock id={`choice-${choiceIndex}`} key={`choice-${choiceIndex}`}>
                {choiceEditable ? (
                  <div className="ch">
                    <LiveText className="vi" slot={{ id: `choice-${choiceIndex}`, op: { type: "choice", index: choiceIndex, field: "vi" } }} value={choice.vi} />
                    <LiveText className="en" slot={{ id: `choice-${choiceIndex}`, op: { type: "choice", index: choiceIndex, field: "en" } }} value={choice.en} />
                  </div>
                ) : (
                  <ChoiceButton
                    choice={choice}
                    picked={answered != null}
                    marked={visibleChoices.some((item) => item.correct)}
                    selected={answered === choiceIndex}
                    onPick={() => onAnswer?.(choiceIndex)}
                  />
                )}
              </StageBlock>
            );
          })}
        </div>
      ) : null}
      {answered != null && slide.choices[answered] ? (
        <StageBlock id="feedback" className="fb">
          {show(lang, slide.choices[answered].feedback_vi ?? "", slide.choices[answered].feedback_en ?? "")}
        </StageBlock>
      ) : null}
      {embedImage ? null : <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} />}
      </div>
      </MotionStage>
    </SlideStage>
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
