import { redirect } from "next/navigation";
import { isStaff, staffReady } from "@/lib/auth";
import { LoginForm } from "@/components/admin/AuthForms";
import { StorageError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  try {
    if (!(await staffReady())) redirect("/admin/setup");
    if (await isStaff()) redirect("/admin");
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
    <section className="staff-gate">
      <p className="eyebrow">Staff only</p>
      <h1 className="serif">員工登入</h1>
      <LoginForm />
    </section>
  );
}
