"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
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

function show(lang: Lang, vi: string, en: string) {
  return (
    <>
      {lang !== "en" && vi ? <div className="vi">{vi}</div> : null}
      {lang !== "vi" && en ? <div className="en">{en}</div> : null}
    </>
  );
}

function face(lang: Lang, vi: string, en: string) {
  if (lang === "en") return en || vi;
  if (lang === "both") return en && en !== vi ? `${vi} / ${en}` : vi;
  return vi;
}

function EmptyNote({ lang, vi, en }: { lang: Lang; vi: string; en: string }) {
  return <div className="layout-empty">{face(lang, vi, en)}</div>;
}

function PointList({ lang, vi, en }: { lang: Lang; vi: string[]; en: string[] }) {
  const count = Math.max(vi.length, en.length);
  if (count === 0) return null;
  return (
    <ul className="slot-points">
      {Array.from({ length: count }, (_, index) => (
        <li key={`${vi[index] ?? ""}-${en[index] ?? ""}-${index}`}>{show(lang, vi[index] ?? "", en[index] ?? "")}</li>
      ))}
    </ul>
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
  if (!slide.image_url) return null;
  return (
    // The teacher places this image by hand. It is not chosen by a vision model.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={framed ? "framed-photo" : "shot"}
      alt=""
      src={slide.image_url}
      style={
        framed
          ? { objectPosition: `${slide.image_x}% ${slide.image_y}%`, cursor: editableImage ? "grab" : undefined }
          : { left: `${slide.image_x}%`, top: `${slide.image_y}%` }
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
        <div className="title-lead">{show(lang, slide.body_vi, slide.body_en)}</div>
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
          <div className="card" key={vi[index] ?? en[index] ?? index}>
            <span className="obj-index">{index + 1}</span>
            {show(lang, vi[index] ?? "", en[index] ?? "")}
          </div>
        ))}
      </div>
    );
  }

  if (slide.layout === "context") {
    const vi = readContext(slide.body_vi);
    const en = readContext(slide.body_en);
    return (
      <div className={vi.know.length || en.know.length ? "split-2" : undefined}>
        <div>{show(lang, vi.narrative, en.narrative)}</div>
        {vi.know.length || en.know.length ? (
          <div className="card">
            <b className="slot-kicker">{face(lang, "Cần biết trước", "Know first")}</b>
            <PointList lang={lang} vi={vi.know} en={en.know} />
          </div>
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
          <div className="card time-card" key={`${item.label}-${item.vi}`}>
            {item.label ? <b className="slot-kicker">{item.label}</b> : null}
            {item.vi ? <div className="vi">{item.vi}</div> : null}
            {lang !== "vi" && item.en ? <div className="en">{item.en}</div> : null}
          </div>
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
          {vi.place || en.place ? <b className="slot-kicker">{show(lang, vi.place, en.place)}</b> : null}
          {show(lang, vi.description, en.description)}
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
          {vi.name || en.name ? <b className="slot-kicker">{show(lang, vi.name, en.name)}</b> : null}
          {rows.length === 0 ? show(lang, vi.narrative || slide.body_vi, en.narrative || slide.body_en) : show(lang, vi.narrative, en.narrative)}
          {rows.map((row) => (
            <div className="card char-row" key={row.vi}>
              <b className="slot-kicker">{face(lang, row.vi, row.en)}</b>
              {show(lang, row.valueVi, row.valueEn)}
            </div>
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
          <div className="card">
            <b className="slot-kicker">{face(lang, vi.a.label, en.a.label || vi.a.label)}</b>
            {vi.a.points.length === 0 && en.a.points.length === 0 ? (
              <EmptyNote lang={lang} vi="Chưa có ý cho vế A." en="No points for side A." />
            ) : (
              <PointList lang={lang} vi={vi.a.points} en={en.a.points} />
            )}
          </div>
          <div className="card">
            <b className="slot-kicker">{face(lang, vi.b.label, en.b.label || vi.b.label)}</b>
            {vi.b.points.length === 0 && en.b.points.length === 0 ? (
              <EmptyNote lang={lang} vi="Chưa có ý cho vế B." en="No points for side B." />
            ) : (
              <PointList lang={lang} vi={vi.b.points} en={en.b.points} />
            )}
          </div>
        </div>
        {vi.conclusion || en.conclusion ? (
          <div className="fb">{show(lang, vi.conclusion, en.conclusion)}</div>
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
            <div className="card">
              <b className="slot-kicker">{face(lang, section.vi, section.en)}</b>
              {section.pointsVi.length === 0 && section.pointsEn.length === 0 ? (
                <EmptyNote lang={lang} vi="Chưa có ý." en="No point yet." />
              ) : (
                <PointList lang={lang} vi={section.pointsVi} en={section.pointsEn} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (slide.layout === "quote") {
    return (
      <div className="quote-mark">
        {slide.body_vi || slide.body_en ? (
          show(lang, slide.body_vi, slide.body_en)
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
        {slide.vocab.slice(0, 6).map((item) => (
          <div className="card" key={`${item.en}-${item.vi}`}>
            <b style={{ color: "#ffd98b" }}>{item.en}</b>
            <br />
            {item.vi}
            {item.example ? (
              <>
                <br />
                <span className="en">{item.example}</span>
              </>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  if (slide.layout === "summary") {
    const vi = readSummary(slide.body_vi);
    const en = readSummary(slide.body_en);
    return (
      <>
        <div className="summary-lead">{show(lang, vi.conclusion, en.conclusion)}</div>
        {vi.points.length || en.points.length ? (
          <div className="slots three">
            {Array.from({ length: Math.max(vi.points.length, en.points.length) }, (_, index) => (
              <div className="card" key={vi.points[index] ?? en.points[index] ?? index}>
                {show(lang, vi.points[index] ?? "", en.points[index] ?? "")}
              </div>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  return show(lang, slide.body_vi, slide.body_en);
}

export function SlideCard({
  slide,
  index,
  total,
  lang,
  answered,
  onAnswer,
  editableImage,
  onImageMove,
}: {
  slide: LessonSlide;
  index: number;
  total: number;
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
    <div className={`slide layout-${slide.layout}`}>
      <div className="tag">
        {layoutById(slide.layout).label.toUpperCase()} • {index + 1}/{total}
      </div>
      <h2>
        {title}
        {lang === "both" && slide.title_en ? (
          <small style={{ display: "block", fontSize: ".5em", color: "#ffd98b" }}>{slide.title_en}</small>
        ) : null}
      </h2>
      {slide.layout === "quiz" ? show(lang, slide.body_vi, slide.body_en) : (
        <LayoutBody slide={slide} lang={lang} editableImage={editableImage} onImageMove={onImageMove} />
      )}
      {showQuiz && (slide.question_vi || slide.question_en) ? (
        <div className={slide.layout === "quiz" ? "quiz-ask" : undefined} style={{ marginTop: 18, fontWeight: 800 }}>
          {slide.layout === "summary" ? (
            <b className="slot-kicker">{face(lang, "Câu suy ngẫm", "Think further")}</b>
          ) : null}
          {show(lang, slide.question_vi, slide.question_en)}
        </div>
      ) : null}
      {slide.layout === "quiz" && !slide.question_vi && !slide.question_en && slide.choices.length === 0 ? (
        <EmptyNote lang={lang} vi="Chưa có câu hỏi." en="No question yet." />
      ) : null}
      {showVocab ? (
        <div className="vocab">
          {slide.vocab.map((item) => (
            <div className="card" key={`${item.en}-${item.vi}`}>
              <b style={{ color: "#ffd98b" }}>{item.en}</b>
              <br />
              {item.vi}
            </div>
          ))}
        </div>
      ) : null}
      {showQuiz && slide.choices.length > 0 ? (
        <div className="choices">
          {slide.choices.map((choice, choiceIndex) => {
            const picked = answered != null;
            const hasAnswer = slide.choices.some((item) => item.correct);
            const className = [
              "ch",
              picked && hasAnswer && choice.correct ? "right" : "",
              picked && hasAnswer && answered === choiceIndex && !choice.correct ? "wrong" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={`${choice.vi}-${choiceIndex}`}
                type="button"
                className={className}
                disabled={picked}
                onClick={() => onAnswer?.(choiceIndex)}
              >
                {choice.vi}
                <br />
                <span style={{ opacity: 0.8 }}>{choice.en}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {answered != null && slide.choices[answered] ? (
        <div className="fb">{show(lang, slide.choices[answered].feedback_vi ?? "", slide.choices[answered].feedback_en ?? "")}</div>
      ) : null}
      {embedImage ? null : <FrameImage slide={slide} editableImage={editableImage} onImageMove={onImageMove} />}
    </div>
  );
}
