"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginScreen({ dbError = "" }: { dbError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(dbError);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: String(form.get("username") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Không đăng nhập được.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Không đăng nhập được.");
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/wewin-logo.png" alt="WeWIN" />
        <h1>WEWIN AI History Lab</h1>
        <p>Đăng nhập để tạo và mở thiết kế bài giảng.</p>
        <label htmlFor="username">Tên đăng nhập</label>
        <input
          className="f"
          id="username"
          name="username"
          autoComplete="username"
          required
        />
        <label htmlFor="password">Mật khẩu</label>
        <input className="f" id="password" name="password" type="password" autoComplete="current-password" required />
        <button className="btn go" type="submit" disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        {error ? <div className="err">{error}</div> : null}
      </form>
    </div>
  );
}
