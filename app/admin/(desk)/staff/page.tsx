import { deleteStaff, upsertStaff } from "@/app/actions/staff";
import { lineLoginEnabled } from "@/lib/line";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ bound?: string; error?: string }>;
}) {
  const { bound, error } = await searchParams;
  const staff = [...(await getStore()).staff].sort((a, b) => a.sortOrder - b.sortOrder);
  const canBind = lineLoginEnabled();

  return (
    <>
      <p className="engraved">LINE</p>
      <h1>顧問帳號</h1>
      <p className="mute" style={{ maxWidth: 480, lineHeight: 1.7, marginBottom: 28 }}>
        這些聯絡人會出現在官網頁尾與預約頁。填 LINE 網址或 ID 即可。未設定 LINE
        Login 環境變數時，官網仍以聊天連結運作。
      </p>
      {bound ? <p className="flash">已綁定 LINE 使用者。</p> : null}
      {error ? <p className="flash">LINE 綁定未完成，請改用網址或 ID。</p> : null}

      {staff.map((person) => (
        <form action={upsertStaff} key={person.id} style={{ marginBottom: 36 }}>
          <input type="hidden" name="id" value={person.id} />
          <div className="form-grid">
            <div className="field">
              <label>顯示名稱</label>
              <input name="displayName" required defaultValue={person.displayName} />
            </div>
            <div className="field">
              <label>職稱</label>
              <input name="role" required defaultValue={person.role} />
            </div>
            <div className="field">
              <label>LINE ID</label>
              <input name="lineId" defaultValue={person.lineId} />
            </div>
            <div className="field">
              <label>LINE 網址</label>
              <input name="lineUrl" defaultValue={person.lineUrl} />
            </div>
            <div className="field">
              <label>備註</label>
              <input name="note" defaultValue={person.note} />
            </div>
            <div className="field">
              <label>排序</label>
              <input name="sortOrder" type="number" defaultValue={person.sortOrder} />
            </div>
          </div>
          <div className="row-actions">
            <button className="btn" type="submit">
              更新
            </button>
            {canBind ? (
              <a className="btn btn-ghost" href={`/api/line/login?staff=${person.id}`}>
                LINE Login 綁定
              </a>
            ) : (
              <span className="mute">
                {person.lineUserId ? "已綁定 LINE Login" : "未設定 LINE Login 環境變數"}
              </span>
            )}
            <button className="btn btn-ghost" type="submit" formAction={deleteStaff}>
              移除
            </button>
          </div>
        </form>
      ))}

      <h2 className="display" style={{ fontSize: 32, margin: "56px 0 20px" }}>
        新增顧問
      </h2>
      <form action={upsertStaff}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="displayName">顯示名稱</label>
            <input id="displayName" name="displayName" required />
          </div>
          <div className="field">
            <label htmlFor="role">職稱</label>
            <input id="role" name="role" required />
          </div>
          <div className="field">
            <label htmlFor="lineId">LINE ID</label>
            <input id="lineId" name="lineId" placeholder="atelier.chen 或 @official" />
          </div>
          <div className="field">
            <label htmlFor="lineUrl">LINE 網址</label>
            <input id="lineUrl" name="lineUrl" placeholder="https://line.me/..." />
          </div>
          <div className="field wide">
            <label htmlFor="note">備註</label>
            <input id="note" name="note" />
          </div>
        </div>
        <button className="btn" type="submit">
          新增
        </button>
      </form>
    </>
  );
}
