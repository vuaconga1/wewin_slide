"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { downloadLessonPdf } from "@/components/history-lab/download-pdf";
import { GraphView, MissionView, ReportView, SourceGap, VerifyView } from "@/components/history-lab/history-views";
import { SlideCard } from "@/components/history-lab/slide-card";
import { LAYOUT_CATALOG, type Lesson, type LessonSlide, type SlideLayout } from "@/services/lessons/lesson-types";

type Lang = "vi" | "both" | "en";
type View = "lesson" | "graph" | "mission" | "verify" | "report";

const TABS: { id: View; label: string }[] = [
  { id: "lesson", label: "📖 Bài học AI" },
  { id: "graph", label: "🧠 Knowledge Graph" },
  { id: "mission", label: "⏳ Time Travel" },
  { id: "verify", label: "🤖 AI vs History" },
  { id: "report", label: "📊 Learning Analytics" },
];

async function exportPptx(lesson: Lesson) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  lesson.slides.forEach((slide) => {
    const page = pptx.addSlide();
    page.background = { color: "0A3470" };
    page.addText(slide.title_vi || "", {
      x: 0.6, y: 0.4, w: 12, h: 0.6, fontSize: 30, bold: true, color: "FFFFFF",
    });
    page.addText(slide.title_en || "", {
      x: 0.6, y: 1.05, w: 12, h: 0.4, fontSize: 17, color: "FFD98B",
    });
    page.addText(`${slide.body_vi || ""}\n${slide.body_en || ""}`, {
      x: 0.6, y: 1.7, w: 12, h: 3.7, fontSize: 18, color: "FFFFFF",
    });
  });
  await pptx.writeFile({ fileName: "WEWIN-AI-History-Lab.pptx" });
}

type StudioConfig = {
  topic: string;
  grade: string;
  cefr: string;
  mode: string;
  durationMin: number;
  requestedCount: number;
  template: string;
  notes: string;
  sourceText: string;
};

function blankStudio(): StudioConfig {
  return {
    topic: "",
    grade: "Grade 5",
    cefr: "A2",
    mode: "Time Travel",
    durationMin: 40,
    requestedCount: 10,
    template: "auto",
    notes: "",
    sourceText: "",
  };
}

export function HistoryLab({
  initialLesson = null,
  loadError = "",
}: {
  initialLesson?: Lesson | null;
  loadError?: string;
}) {
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(initialLesson);
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState<Lang>("both");
  const [answered, setAnswered] = useState<Record<number, number>>({});
  const [view, setView] = useState<View>("lesson");
  const [editing, setEditing] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [error, setError] = useState(loadError);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(blankStudio);

  function startPresent() {
    if (!lesson) return;
    setPresenting(true);
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }

  function stopPresent() {
    setPresenting(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "F5" || !lesson) return;
      event.preventDefault();
      setPresenting(true);
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [lesson]);

  useEffect(() => {
    if (!presenting || !lesson) return;
    const slideCount = lesson.slides.length;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPresenting(false);
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      }
      if (event.key === "ArrowRight") setIndex((value) => Math.min(slideCount - 1, value + 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
      if (event.key === "F5") event.preventDefault();
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [presenting, lesson]);

  async function persist(next: Lesson) {
    if (!next.id) return next;
    const response = await fetch(`/api/lessons/${next.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = (await response.json()) as { lesson?: Lesson; error?: string };
    if (!response.ok || !data.lesson) {
      setError(data.error || "Không lưu được bài giảng.");
      return null;
    }
    setLesson(data.lesson);
    return data.lesson;
  }

  function resetStudio() {
    setLesson(null);
    setIndex(0);
    setAnswered({});
    setEditing(false);
    setPresenting(false);
    setView("lesson");
    setError("");
    setNotice("");
    setStudioConfig(blankStudio());
  }

  function onNew() {
    resetStudio();
    router.push("/studio");
  }

  function onOpen() {
    router.push("/");
  }

  async function onSave() {
    if (!lesson) {
      setError("Chưa có bài giảng để lưu.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (lesson.id) {
        const saved = await persist(lesson);
        if (saved) setNotice("Đã lưu thiết kế.");
        return;
      }
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lesson, config: studioConfig }),
      });
      const data = (await response.json()) as { lesson?: Lesson; error?: string };
      if (!response.ok || !data.lesson) throw new Error(data.error || "Không lưu được bài giảng.");
      setLesson(data.lesson);
      setNotice("Đã lưu thiết kế.");
      if (data.lesson.id) router.replace(`/studio?id=${data.lesson.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không lưu được bài giảng.");
    } finally {
      setBusy(false);
    }
  }

  async function onPdf() {
    if (!lesson) return;
    setError("");
    try {
      await downloadLessonPdf(lesson);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được PDF.");
    }
  }

  function onPresentClick(event: React.MouseEvent) {
    if (!lesson) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest(".slide")) return;
    if (target.closest("button, a, input, textarea, select")) return;
    setIndex((value) => Math.min(lesson.slides.length - 1, value + 1));
  }

  function onPresentContextMenu(event: React.MouseEvent) {
    event.preventDefault();
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest(".slide")) return;
    setIndex((value) => Math.max(0, value - 1));
  }

  function replaceSlides(slides: LessonSlide[]) {
    if (!lesson) return null;
    const next = { ...lesson, slides };
    setLesson(next);
    return next;
  }

  async function onGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const button = event.currentTarget.querySelector("#go");
    setError("");
    setNotice("");
    setBusy(true);
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = "AI đang phân tích nguồn & tạo trải nghiệm…";
    }
    const form = new FormData(event.currentTarget);
    setStudioConfig({
      topic: String(form.get("topic") || ""),
      grade: String(form.get("grade") || "Grade 5"),
      cefr: String(form.get("cefr") || "A2"),
      mode: String(form.get("mode") || "Time Travel"),
      durationMin: Number(form.get("duration") || 40),
      requestedCount: Number(form.get("count") || 10),
      template: String(form.get("template") || "auto"),
      notes: String(form.get("notes") || ""),
      sourceText: "",
    });
    try {
      const response = await fetch("/api/generate", { method: "POST", body: form });
      const data = (await response.json()) as { lesson?: Lesson; error?: string };
      if (!response.ok || !data.lesson) throw new Error(data.error || "Không tạo được bài giảng.");
      setLesson(data.lesson);
      setIndex(0);
      setAnswered({});
      setEditing(false);
      setView("graph");
      setNotice(data.lesson.warnings.join(" "));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tạo được bài giảng.");
    } finally {
      setBusy(false);
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
        button.textContent = "✨ GENERATE WITH AI";
      }
    }
  }

  const slide = lesson?.slides[index];
  const lessonHasMaterial = Boolean(
    lesson?.slides.some((item) => item.body_vi.trim() || item.body_en.trim()),
  );

  function patchSlide(patch: Partial<LessonSlide>, save = false) {
    if (!lesson || !slide) return;
    const slides = lesson.slides.map((item, slideIndex) => (slideIndex === index ? { ...item, ...patch } : item));
    const next = { ...lesson, slides };
    setLesson(next);
    if (save) void persist(next);
  }

  function moveSlide(from: number, to: number) {
    if (!lesson || from === to || to < 0 || to >= lesson.slides.length) return;
    const slides = [...lesson.slides];
    const [item] = slides.splice(from, 1);
    if (!item) return;
    slides.splice(to, 0, item);
    const next = { ...lesson, slides };
    setLesson(next);
    setIndex(to);
    void persist(next);
  }

  return (
    <>
      <div className="filebar">
        <button type="button" className="btn" onClick={onNew}>New</button>
        <button type="button" className="btn" onClick={onOpen}>Open</button>
        <button type="button" className="btn primary" onClick={() => void onSave()} disabled={!lesson || busy}>Save</button>
        <button type="button" className="btn" onClick={() => void onPdf()} disabled={!lesson}>Download PDF</button>
        <button type="button" className="btn" onClick={startPresent} disabled={!lesson} title="F5">Present</button>
        <span className="file-title">{lesson ? lesson.title_vi : "Thiết kế mới"}</span>
      </div>
      <section className="hero">
        <div>
          <span className="badge">AI • HISTORY • CLIL • GAME-BASED LEARNING</span>
          <h1>
            Học lịch sử Việt Nam
            <br />
            <em>trong thời đại A.I</em>
          </h1>
          <p>
            Biến tư liệu lịch sử đã kiểm chứng thành bài học song ngữ, bản đồ tri thức, trải nghiệm “du hành thời
            gian” và thử thách kiểm chứng AI bằng bằng chứng.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mascot" src="/assets/wewin-mascot.png" alt="" />
      </section>
      <div className="tabs">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" className={view === tab.id ? "on" : ""} onClick={() => setView(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="app">
        <form className="panel" onSubmit={onGenerate}>
          <h3>✨ Tạo trải nghiệm lịch sử</h3>
          <label>Chủ đề</label>
          <input className="f" name="topic" placeholder="Nhập chủ đề bài học" required />
          <label>Dán tư liệu đã kiểm chứng</label>
          <textarea className="f" name="text" placeholder="Dán nội dung SGK / tài liệu chính thống..." />
          <label>Hoặc tải PDF / Word / TXT / hình ảnh</label>
          <input className="f" type="file" name="files" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" multiple />
          <label>Hoặc link website</label>
          <input className="f" name="url" placeholder="https://..." />
          <div className="row">
            <div>
              <label>Khối lớp</label>
              <select className="f" name="grade" defaultValue="Grade 5">
                {["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"].map((grade) => (
                  <option key={grade}>{grade}</option>
                ))}
              </select>
            </div>
            <div>
              <label>English CEFR</label>
              <select className="f" name="cefr" defaultValue="A2">
                {["A1", "A2", "B1", "B2"].map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row">
            <div>
              <label>Teaching Mode</label>
              <select className="f" name="mode" defaultValue="Time Travel">
                {["Storytelling", "Time Travel", "History Detective", "Role Play"].map((mode) => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Số slide</label>
              <input className="f" name="count" type="number" min={3} max={30} defaultValue={10} required />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Thời lượng (phút)</label>
              <input className="f" name="duration" type="number" min={5} max={180} defaultValue={40} />
            </div>
            <div>
              <label>Template</label>
              <select className="f" name="template" defaultValue="auto">
                <option value="auto">AI chọn layout</option>
                {(["timeline", "map", "character", "comparison", "cause-effect", "quote", "summary"] as const).map((id) => (
                  <option key={id} value={id}>
                    {LAYOUT_CATALOG.find((item) => item.id === id)?.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label>Ghi chú</label>
          <input className="f" name="notes" placeholder="Ví dụ: nhấn mạnh nguyên nhân – hệ quả" />
          <button className="btn go" id="go" disabled={busy}>
            ✨ GENERATE WITH AI
          </button>
          {error ? <div className="err">{error}</div> : null}
          {notice ? <div className="note">{notice}</div> : null}
        </form>
        <main className="panel" id="view">
          {!lesson || !slide ? (
            <div className="empty">
              <div>
                <h3>WEWIN AI History Lab</h3>
                <p>Tải nguồn lịch sử đã kiểm chứng để AI tạo trải nghiệm.</p>
              </div>
            </div>
          ) : view === "graph" ? (
            <GraphView lesson={lesson} />
          ) : view === "mission" ? (
            <MissionView key={lesson.id ?? "mission"} lesson={lesson} lang={lang} />
          ) : view === "verify" ? (
            <VerifyView key={lesson.id ?? "verify"} lesson={lesson} lang={lang} />
          ) : view === "report" ? (
            <ReportView />
          ) : !lessonHasMaterial ? (
            <SourceGap message="Nguồn chưa đủ để tạo Bài học AI." />
          ) : (
            <>
              <div className="bar">
                <div className="seg">
                  {(["vi", "both", "en"] as const).map((item) => (
                    <button key={item} type="button" className={lang === item ? "on" : ""} onClick={() => setLang(item)}>
                      {item === "vi" ? "VI" : item === "both" ? "VI + EN" : "EN"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn" onClick={() => setEditing((value) => !value)}>
                    {editing ? "Xong" : "Sửa"}
                  </button>
                  <button type="button" className="btn" onClick={() => void exportPptx(lesson)}>
                    ⬇ PowerPoint
                  </button>
                </div>
              </div>
              <SlideCard
                slide={slide}
                index={index}
                total={lesson.slides.length}
                lang={lang}
                answered={answered[index]}
                onAnswer={(choice) => setAnswered((current) => ({ ...current, [index]: choice }))}
                editableImage={editing}
                onImageMove={(x, y) => patchSlide({ image_x: x, image_y: y })}
              />
              <div className="nav">
                <button type="button" className="btn" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
                  ← Trước
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={index === lesson.slides.length - 1}
                  onClick={() => setIndex((value) => Math.min(lesson.slides.length - 1, value + 1))}
                >
                  Sau →
                </button>
              </div>
              {editing ? (
                <div className="editor">
                  <div className="chips">
                    {lesson.slides.map((item, slideIndex) => (
                      <button
                        key={item.id ?? slideIndex}
                        type="button"
                        draggable
                        className={slideIndex === index ? "on" : ""}
                        onClick={() => setIndex(slideIndex)}
                        onDragStart={(event) => event.dataTransfer.setData("text/plain", String(slideIndex))}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          moveSlide(Number(event.dataTransfer.getData("text/plain")), slideIndex);
                        }}
                      >
                        {slideIndex + 1}. {item.title_vi}
                      </button>
                    ))}
                  </div>
                  <div className="row">
                    <label>
                      Tiêu đề Việt
                      <input className="f" value={slide.title_vi} onChange={(event) => patchSlide({ title_vi: event.target.value })} onBlur={() => void persist(lesson)} />
                    </label>
                    <label>
                      Tiêu đề Anh
                      <input className="f" value={slide.title_en} onChange={(event) => patchSlide({ title_en: event.target.value })} onBlur={() => void persist(lesson)} />
                    </label>
                  </div>
                  <label>
                    Nội dung Việt
                    <textarea className="f" value={slide.body_vi} onChange={(event) => patchSlide({ body_vi: event.target.value })} onBlur={() => void persist(lesson)} />
                  </label>
                  <label>
                    Nội dung Anh
                    <textarea className="f" value={slide.body_en} onChange={(event) => patchSlide({ body_en: event.target.value })} onBlur={() => void persist(lesson)} />
                  </label>
                  <div className="row">
                    <label>
                      Layout
                      <select
                        className="f"
                        value={slide.layout}
                        onChange={(event) => {
                          const layout = event.target.value as SlideLayout;
                          patchSlide({ layout, type: layout }, true);
                        }}
                      >
                        {LAYOUT_CATALOG.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Hình ảnh thủ công
                    <input
                      className="f"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file || !lesson) return;
                        const body = new FormData();
                        body.set("file", file);
                        void fetch("/api/media", { method: "POST", body })
                          .then(async (response) => {
                            const data = (await response.json()) as { url?: string; error?: string };
                            if (!response.ok || !data.url) throw new Error(data.error || "Không tải được ảnh.");
                            const slides = lesson.slides.map((item, slideIndex) =>
                              slideIndex === index ? { ...item, image_url: data.url } : item,
                            );
                            const next = { ...lesson, slides };
                            setLesson(next);
                            await persist(next);
                          })
                          .catch((reason: unknown) => {
                            setError(reason instanceof Error ? reason.message : "Không tải được ảnh.");
                          });
                      }}
                    />
                  </label>
                  <div className="nav">
                    <button type="button" className="btn" onClick={() => moveSlide(index, index - 1)} disabled={index === 0}>
                      Đưa lên
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => moveSlide(index, index + 1)}
                      disabled={index === lesson.slides.length - 1}
                    >
                      Đưa xuống
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        const slides = [
                          ...lesson.slides.slice(0, index + 1),
                          {
                            ...slide,
                            id: undefined,
                            title_vi: "Slide mới",
                            title_en: "New slide",
                            body_vi: "",
                            body_en: "",
                            image_url: null,
                            choices: [],
                            vocab: [],
                          },
                          ...lesson.slides.slice(index + 1),
                        ];
                        const next = replaceSlides(slides);
                        setIndex(index + 1);
                        if (next) void persist(next);
                      }}
                    >
                      Thêm slide
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={lesson.slides.length <= 1}
                      onClick={() => {
                        const slides = lesson.slides.filter((_, slideIndex) => slideIndex !== index);
                        const next = replaceSlides(slides);
                        setIndex(Math.max(0, index - 1));
                        if (next) void persist(next);
                      }}
                    >
                      Xóa slide
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
      {presenting && lesson && slide ? (
        <div
          className="present"
          onClick={onPresentClick}
          onContextMenu={onPresentContextMenu}
        >
          <SlideCard slide={slide} index={index} total={lesson.slides.length} lang={lang} answered={answered[index]} />
          <div className="nav">
            <button type="button" className="btn" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
              ← Trước
            </button>
            <button type="button" className="btn" onClick={stopPresent}>
              Thoát
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setIndex((value) => Math.min(lesson.slides.length - 1, value + 1))}
              disabled={index === lesson.slides.length - 1}
            >
              Sau →
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
