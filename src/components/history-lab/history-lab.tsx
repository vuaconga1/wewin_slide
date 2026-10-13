"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { downloadLessonPdf } from "@/components/history-lab/download-pdf";
import { GraphView, MissionView, ReportView, SourceGap, VerifyView } from "@/components/history-lab/history-views";
import { SlideCard } from "@/components/history-lab/slide-card";
import { LAYOUT_CATALOG, type Lesson, type LessonSlide, type SlideLayout } from "@/services/lessons/lesson-types";

type Lang = "vi" | "both" | "en";
type View = "lesson" | "graph" | "mission" | "verify" | "report";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function savedLabel(savedAt: number | null, now: number) {
  if (savedAt == null) return "Đã lưu";
  const minutes = Math.floor((now - savedAt) / 60000);
  if (minutes < 1) return "Đã lưu vừa xong";
  if (minutes < 60) return `Đã lưu ${minutes} phút trước`;
  return `Đã lưu ${Math.floor(minutes / 60)} giờ trước`;
}

const TABS: { id: View; label: string }[] = [
  { id: "lesson", label: "Bài học AI" },
  { id: "graph", label: "Knowledge Graph" },
  { id: "mission", label: "Time Travel" },
  { id: "verify", label: "AI vs History" },
  { id: "report", label: "Learning Analytics" },
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
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [linkText, setLinkText] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pageMenu, setPageMenu] = useState<{ x: number; y: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

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
    const onLesson = view === "lesson";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") stopPresent();
      if (onLesson && event.key === "ArrowRight") setIndex((value) => Math.min(slideCount - 1, value + 1));
      if (onLesson && event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
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
  }, [presenting, lesson, view]);

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
    setSavedAt(Date.now());
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
    setSourceFiles([]);
    setLinkText("");
    if (fileInput.current) fileInput.current.value = "";
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
      setSavedAt(Date.now());
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
      await downloadLessonPdf(lesson, view);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được PDF.");
    }
  }

  function onPresentClick(event: React.MouseEvent) {
    if (!lesson || view !== "lesson") return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest(".slide")) return;
    if (target.closest("button, a, input, textarea, select")) return;
    setIndex((value) => Math.min(lesson.slides.length - 1, value + 1));
  }

  function onPresentContextMenu(event: React.MouseEvent) {
    event.preventDefault();
    if (view !== "lesson") return;
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
    setError("");
    setNotice("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    form.delete("files");
    form.delete("urls");
    for (const file of sourceFiles.slice(0, 8)) form.append("files", file);
    for (const link of linkText.split(/\s+/).map((item) => item.trim()).filter(Boolean)) form.append("urls", link);
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
      if (data.lesson.id) setSavedAt(Date.now());
      setIndex(0);
      setAnswered({});
      setEditing(false);
      setView("graph");
      setNotice(data.lesson.warnings.join(" "));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tạo được bài giảng.");
    } finally {
      setBusy(false);
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

  useEffect(() => {
    const root = filmRef.current;
    const current = root?.querySelector<HTMLElement>(".film-page.on");
    if (!root || !current) return;
    const left = current.offsetLeft - (root.clientWidth - current.clientWidth) / 2;
    root.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [index, lesson?.slides.length]);

  useEffect(() => {
    if (!pageMenu) return;
    const place = () => {
      const more = filmRef.current?.querySelector(".film-more");
      if (!more) return;
      const box = more.getBoundingClientRect();
      setPageMenu({ x: box.right, y: box.top });
    };
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [pageMenu != null]);

  function blankSlide(source: LessonSlide): LessonSlide {
    return {
      ...source,
      id: undefined,
      title_vi: "Slide mới",
      title_en: "New slide",
      body_vi: "",
      body_en: "",
      image_url: null,
      choices: [],
      vocab: [],
      question_vi: "",
      question_en: "",
    };
  }

  function insertSlide(at: number, item: LessonSlide) {
    if (!lesson) return;
    const slides = [...lesson.slides.slice(0, at), item, ...lesson.slides.slice(at)];
    const next = replaceSlides(slides);
    setIndex(at);
    if (next) void persist(next);
  }

  function addPage() {
    if (!slide) return;
    insertSlide(index + 1, blankSlide(slide));
  }

  function duplicatePage() {
    if (!slide) return;
    insertSlide(index + 1, { ...slide, id: undefined });
  }

  function deletePage() {
    if (!lesson || lesson.slides.length <= 1) return;
    const slides = lesson.slides.filter((_, slideIndex) => slideIndex !== index);
    const next = replaceSlides(slides);
    setIndex(Math.max(0, index - 1));
    if (next) void persist(next);
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
        <div className="file-actions">
          <button type="button" className="btn" onClick={onNew}>
            <Glyph><path d="M12 5v14M5 12h14" /></Glyph>
            Mới
          </button>
          <button type="button" className="btn" onClick={onOpen}>
            <Glyph><path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Glyph>
            Mở
          </button>
          <button type="button" className="btn primary" onClick={() => void onSave()} disabled={!lesson || busy}>
            <Glyph><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" /></Glyph>
            Lưu
          </button>
        </div>
        <div className="file-center">
          <strong>{lesson ? lesson.title_vi : "Thiết kế mới"}</strong>
          {lesson?.id ? <span className="saved-flag">{savedLabel(savedAt, now)}</span> : null}
        </div>
        <div className="file-actions">
          <details className="download-menu">
            <summary className={lesson ? "" : "off"}>
              <Glyph><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Glyph>
              Tải xuống
              <Glyph><path d="M6 9l6 6 6-6" /></Glyph>
            </summary>
            <div className="download-list">
              <button type="button" disabled={!lesson} onClick={() => void onPdf()}>PDF</button>
              <button type="button" disabled={!lesson || !lessonHasMaterial} onClick={() => lesson && void exportPptx(lesson)}>PowerPoint</button>
            </div>
          </details>
          <button type="button" className="btn primary" onClick={startPresent} disabled={!lesson} title="F5">
            <Glyph><path d="M8 5v14l11-7z" fill="currentColor" stroke="none" /></Glyph>
            Trình chiếu
          </button>
        </div>
      </div>
      <section className="banner">
        <div className="hero">
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
        </div>
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
          <h3>Tạo trải nghiệm lịch sử</h3>
          <label>Chủ đề</label>
          <input className="f" name="topic" placeholder="Nhập chủ đề bài học" required />
          <label>Dán tư liệu đã kiểm chứng</label>
          <textarea className="f" name="text" placeholder="Dán nội dung SGK / tài liệu chính thống..." style={{ maxHeight: 240, overflowY: "auto" }} />
          <label>Hoặc tải PDF / Word / TXT / hình ảnh</label>
          <input
            ref={fileInput}
            className="f"
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
            multiple
            onChange={(event) => {
              const picked = [...(event.target.files ?? [])];
              setSourceFiles((current) => [...current, ...picked].slice(0, 8));
              event.target.value = "";
            }}
          />
          <p className="hint">Tối đa 8 file.</p>
          {sourceFiles.length > 0 ? (
            <ul className="source-list">
              {sourceFiles.map((file, fileIndex) => (
                <li key={`${file.name}-${file.size}-${fileIndex}`}>
                  <span>{file.name}</span>
                  <button type="button" onClick={() => setSourceFiles((current) => current.filter((_, index) => index !== fileIndex))}>
                    Bỏ
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <label>Hoặc link website</label>
          <textarea
            className="f"
            style={{ maxHeight: 240, overflowY: "auto" }}
            value={linkText}
            placeholder={"https://...\nhttps://..."}
            onChange={(event) => setLinkText(event.target.value)}
          />
         
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
           TẠO SLIDE 
          </button>
          {error ? <div className="err">{error}</div> : null}
          {notice ? <div className="note">{notice}</div> : null}
        </form>
        <main className="panel slide-panel" id="view">
          {busy ? (
            <div className="slide-loading" role="status" aria-label="Đang tạo slide">
              <span className="spinner" aria-hidden="true" />
            </div>
          ) : !lesson || !slide ? (
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
                <div className="bar-tools">
                  <button type="button" className={editing ? "btn on" : "btn"} onClick={() => setEditing((value) => !value)}>
                    <Glyph><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Glyph>
                    {editing ? "Xong" : "Sửa trang"}
                  </button>
                  <div className="page-step">
                    <button type="button" aria-label="Trang trước" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>‹</button>
                    <span>{index + 1} / {lesson.slides.length}</span>
                    <button type="button" aria-label="Trang sau" disabled={index === lesson.slides.length - 1} onClick={() => setIndex((value) => Math.min(lesson.slides.length - 1, value + 1))}>›</button>
                  </div>
                </div>
              </div>
              <SlideCard
                slide={slide}
                index={index}
                lang={lang}
                answered={answered[index]}
                onAnswer={(choice) => setAnswered((current) => ({ ...current, [index]: choice }))}
                editableImage={editing}
                onImageMove={(x, y) => patchSlide({ image_x: x, image_y: y })}
              />
              <div className="film">
                <div className="film-pages" ref={filmRef}>
                  {lesson.slides.map((item, slideIndex) => (
                    <div key={item.id ?? slideIndex} className={slideIndex === index ? "film-page on" : "film-page"}>
                      <div className="film-shot" aria-hidden inert>
                        <div className="film-shot-scale">
                          <SlideCard slide={item} index={slideIndex} lang={lang} />
                        </div>
                      </div>
                      <button type="button" className="film-hit" title={`Trang ${slideIndex + 1}`} aria-label={`Trang ${slideIndex + 1}`} onClick={() => setIndex(slideIndex)} />
                      <span className="film-num">{slideIndex + 1}</span>
                      {slideIndex === index ? (
                        <button
                          type="button"
                          className="film-more"
                          aria-label="Tùy chọn trang"
                          aria-expanded={pageMenu != null}
                          onClick={(event) => {
                            const box = event.currentTarget.getBoundingClientRect();
                            setPageMenu((current) => (current ? null : { x: box.right, y: box.top }));
                          }}
                        >
                          ···
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="film-add">
                  <button type="button" aria-label="Thêm trang" onClick={addPage}>+</button>
                  <details>
                    <summary aria-label="Thêm trang">⌄</summary>
                    <div className="film-list">
                      <button type="button" onClick={addPage}>Thêm trang trống</button>
                    </div>
                  </details>
                </div>
              </div>
              {pageMenu ? (
                <>
                  <button type="button" className="film-backdrop" aria-label="Đóng menu" onClick={() => setPageMenu(null)} />
                  <div
                    className="film-list film-pop"
                    style={{ top: pageMenu.y - 6, left: pageMenu.x }}
                  >
                    <button type="button" onClick={() => { setPageMenu(null); duplicatePage(); }}>Nhân bản</button>
                    <button type="button" disabled={lesson.slides.length <= 1} onClick={() => { setPageMenu(null); deletePage(); }}>Xóa trang</button>
                  </div>
                </>
              ) : null}
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
      {presenting && lesson ? (
        <div
          className="present"
          onClick={onPresentClick}
          onContextMenu={onPresentContextMenu}
        >
          <div className="present-stage">
            {view === "graph" ? (
              <GraphView lesson={lesson} />
            ) : view === "mission" ? (
              <MissionView key={`present-${lesson.id ?? "mission"}`} lesson={lesson} lang={lang} />
            ) : view === "verify" ? (
              <VerifyView key={`present-${lesson.id ?? "verify"}`} lesson={lesson} lang={lang} />
            ) : view === "report" ? (
              <ReportView />
            ) : slide ? (
              <SlideCard slide={slide} index={index} lang={lang} answered={answered[index]} />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
