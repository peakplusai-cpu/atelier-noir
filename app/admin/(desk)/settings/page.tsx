import { saveInstagram } from "@/app/actions/settings";
import { instagramWebUrl } from "@/lib/instagram";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const settings = await getSettings();
  const link = instagramWebUrl(settings.instagram);

  return (
    <>
      <p className="engraved">Site</p>
      <h1>官網設定</h1>
      <p className="mute" style={{ maxWidth: 480, lineHeight: 1.7, marginBottom: 28 }}>
        店家 Instagram 只有一個帳號，不分業務、不分車輛。可填 @帳號 或 instagram.com
        網址；留空則官網不顯示 Instagram 按鈕。手機會優先開啟 Instagram App，電腦則在新分頁開啟網頁。
      </p>
      {saved ? (
        <p className="flash">{settings.instagram ? "Instagram 已更新，官網按鈕已顯示。" : "已清空，官網不再顯示 Instagram 按鈕。"}</p>
      ) : null}
      {error === "instagram" ? (
        <p className="flash">格式不正確，請填 @帳號 或 https://instagram.com/帳號（不要貼貼文或 Reel 連結）。</p>
      ) : null}
      {error === "save" ? <p className="flash">儲存失敗，請稍後再試。</p> : null}

      <form action={saveInstagram}>
        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="instagram">店家 Instagram</label>
            <input
              id="instagram"
              name="instagram"
              defaultValue={settings.instagram ? `@${settings.instagram}` : ""}
              placeholder="@帳號 或 https://instagram.com/帳號"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
        {link ? (
          <p className="mute" style={{ margin: "0 0 20px", fontSize: 13 }}>
            目前連結：{" "}
            <a className="link-line" href={link} target="_blank" rel="noopener noreferrer">
              {link}
            </a>
          </p>
        ) : (
          <p className="mute" style={{ margin: "0 0 20px", fontSize: 13 }}>
            目前未設定，官網不顯示 Instagram 按鈕。
          </p>
        )}
        <button className="btn" type="submit">
          儲存
        </button>
      </form>
    </>
  );
}
