import Link from "next/link";
import { redirect } from "next/navigation";
import { isStaff, staffReady } from "@/lib/auth";
import { logoutStaff } from "@/app/actions/staff";
import { StorageError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  try {
    if (!(await staffReady())) redirect("/admin/setup");
    if (!(await isStaff())) redirect("/admin/login");
  } catch (err) {
    if (err instanceof StorageError) {
      return (
        <section className="staff-gate">
          <h1 className="serif">無法開啟員工入口</h1>
          <p>{err.message}</p>
        </section>
      );
    }
    throw err;
  }
  return (
    <section className="staff-desk">
      <div className="staff-bar">
        <Link href="/admin" className="serif">
          SOLISIA BAY
        </Link>
        <span>員工後台</span>
        <form action={logoutStaff}>
          <button type="submit" className="link-btn">
            登出
          </button>
        </form>
      </div>
      {children}
    </section>
  );
}
