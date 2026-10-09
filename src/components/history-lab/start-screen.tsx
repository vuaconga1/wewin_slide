import Link from "next/link";
import type { DesignSummary } from "@/services/lessons/lesson.service";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function StartScreen({
  designs,
  isAdmin,
  error = "",
}: {
  designs: DesignSummary[];
  isAdmin: boolean;
  error?: string;
}) {
  return (
    <main className="start">
      <h1>Thiết kế của bạn</h1>
      <p>Tạo một bài giảng mới hoặc mở thiết kế đã lưu.</p>
      {error ? <div className="err">{error}</div> : null}
      <div className="design-grid">
        <Link className="design-card new" href="/studio">
          <span>New</span>
          <strong>Tạo thiết kế mới</strong>
          <small>Mở studio trống và bắt đầu bài giảng.</small>
        </Link>
        {designs.map((design) => (
          <Link key={design.id} className="design-card" href={`/studio?id=${design.id}`}>
            <span>Open</span>
            <strong>{design.title}</strong>
            <small>{formatWhen(design.updatedAt)}</small>
            {isAdmin ? <small>Chủ sở hữu: {design.ownerUsername ?? "Chưa gán"}</small> : null}
          </Link>
        ))}
      </div>
      {designs.length === 0 ? <p className="muted">Chưa có thiết kế đã lưu.</p> : null}
    </main>
  );
}
