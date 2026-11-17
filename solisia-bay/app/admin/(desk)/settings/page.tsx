import { SettingsForm } from "@/components/admin/SettingsForm";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { settings } = await getShop();
  return (
    <>
      <header className="staff-head"><h1 className="serif">設定</h1></header>
      <SettingsForm settings={settings} />
    </>
  );
}
