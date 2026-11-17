import Link from "next/link";
import { deletePromotion, setPromotionEnabled } from "@/app/actions/catalog";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { getShop } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function PromotionsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const { promotions } = await getShop();
  return (
    <>
      <header className="staff-head">
        <h1 className="serif">優惠</h1>
        <Link href="/admin/promotions/new" className="btn btn-solid">新增優惠</Link>
      </header>
      {saved && <p className="fine">優惠已儲存。結帳會在伺服器套用。</p>}
      {promotions.length === 0 ? <p className="fine">還沒有優惠碼或自動折扣。</p> : (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead><tr><th>名稱</th><th>代碼</th><th>類型</th><th>已用</th><th>狀態</th><th></th></tr></thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td><Link href={`/admin/promotions/${promo.id}`}>{promo.name}</Link></td>
                  <td>{promo.code || "自動"}</td>
                  <td>{promo.kind}</td>
                  <td>{promo.used}{promo.usageLimit ? ` / ${promo.usageLimit}` : ""}</td>
                  <td>{promo.enabled ? "啟用" : "停用"}</td>
                  <td>
                    <div className="staff-actions">
                      <form action={setPromotionEnabled}>
                        <input type="hidden" name="id" value={promo.id} />
                        <input type="hidden" name="enabled" value={promo.enabled ? "0" : "1"} />
                        <button className="btn btn-outline">{promo.enabled ? "停用" : "啟用"}</button>
                      </form>
                      <Link href={`/admin/promotions/${promo.id}`} className="btn btn-outline">編輯</Link>
                      <form action={deletePromotion}>
                        <input type="hidden" name="id" value={promo.id} />
                        <ConfirmSubmit className="btn btn-outline" label="刪除" message="刪除這個優惠？" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
