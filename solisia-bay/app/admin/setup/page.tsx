import { redirect } from "next/navigation";
import { staffReady } from "@/lib/auth";
import { SetupForm } from "@/components/admin/AuthForms";
import { StorageError } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  try {
    if (await staffReady()) redirect("/admin/login");
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
      <p className="eyebrow">First-time setup</p>
      <h1 className="serif">設定員工密碼</h1>
      <p className="lede">第一次打開員工入口。設定後，頁尾的「員工專用入口」就會要求這組密碼。</p>
      <SetupForm />
    </section>
  );
}
