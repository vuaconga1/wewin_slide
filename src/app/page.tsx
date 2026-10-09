import { AppHeader } from "@/components/history-lab/app-header";
import { LoginScreen } from "@/components/history-lab/login-screen";
import { StartScreen } from "@/components/history-lab/start-screen";
import { getCurrentUser } from "@/services/auth/auth.service";
import type { SessionUser } from "@/services/auth/types";
import { lessonService, type DesignSummary } from "@/services/lessons/lesson.service";

type HomeState =
  | { kind: "guest" }
  | { kind: "database" }
  | { kind: "ready"; user: SessionUser; designs: DesignSummary[]; error: string };

async function loadHome(): Promise<HomeState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { kind: "guest" };
    try {
      const designs = await lessonService.list(user);
      return { kind: "ready", user, designs, error: "" };
    } catch {
      return {
        kind: "ready",
        user,
        designs: [],
        error: "Không tải được danh sách thiết kế. Kiểm tra cơ sở dữ liệu.",
      };
    }
  } catch {
    return { kind: "database" };
  }
}

export default async function HomePage() {
  const state = await loadHome();
  if (state.kind === "database") {
    return <LoginScreen dbError="Không kết nối được cơ sở dữ liệu." />;
  }
  if (state.kind === "guest") return <LoginScreen />;

  return (
    <>
      <AppHeader user={state.user} />
      <StartScreen designs={state.designs} isAdmin={state.user.role === "ADMIN"} error={state.error} />
    </>
  );
}
