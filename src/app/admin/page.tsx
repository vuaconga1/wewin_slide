import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/history-lab/app-header";
import { getCurrentUser } from "@/services/auth/auth.service";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <>
      <AppHeader user={user} />
      <main className="start">
        <h1>Quản trị</h1>
        <p>Các công cụ quản trị khác sẽ có sau. Bạn đã mở và lưu được mọi thiết kế từ màn hình bắt đầu.</p>
        <Link className="header-link admin-back" href="/">
          Về màn hình bắt đầu
        </Link>
      </main>
    </>
  );
}
