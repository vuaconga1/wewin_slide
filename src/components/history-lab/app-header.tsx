"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AppHeader({ user }: { user: { username: string; role: "ADMIN" | "USER" } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/");
    router.refresh();
  }

  return (
    <header>
      <Link className="brand" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/wewin-logo.png" alt="WeWIN" />
        <div>
          <b>WEWIN AI HISTORY LAB™</b>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Verified Sources → Interactive History</div>
        </div>
      </Link>
      <div className="header-actions">
        <span>
          {user.username} · {user.role === "ADMIN" ? "Quản trị" : "Giáo viên"}
        </span>
        {user.role === "ADMIN" ? (
          <Link className="header-link" href="/admin">
            Quản trị
          </Link>
        ) : null}
        <button className="header-link" type="button" onClick={() => void logout()} disabled={busy}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
