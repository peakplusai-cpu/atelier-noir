import Link from "next/link";
import { LineLaunch } from "@/components/LineLaunch";
import type { Staff } from "@/lib/types";

export function Footer({ staff }: { staff: Staff[] }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="wordmark">
            <span className="wordmark-zh">Car House</span>
            <span className="wordmark-en">TXG</span>
          </div>
          <p className="footer-note">
            {staff.length
              ? "私人珍藏，僅接受預約鑑賞。請由下列顧問中擇一開啟 LINE，告知屬意車款與希望時段。"
              : "私人珍藏，僅接受預約鑑賞。真實業務 LINE 設定完成後，聯絡方式才會在此公開。"}
          </p>
        </div>
        <div>
          <p className="engraved">選擇顧問 · LINE</p>
          {staff.length ? (
            <ul className="staff-list">
              {staff.map((person) => (
                <li key={person.id}>
                  <LineLaunch lineUrl={person.lineUrl} lineId={person.lineId}>
                    <span className="name">{person.displayName}</span>
                    <span className="role">{person.role}</span>
                    <span className="go">開啟聊天室</span>
                  </LineLaunch>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-line">尚未設定公開聯絡人。</p>
          )}
        </div>
      </div>
      <div className="colophon">
        <span>台中 · 預約制</span>
        <Link href="/admin">員工入口</Link>
      </div>
      <div className="footer-logos">
        <img src="/brand/anson-top-car.jpg" alt="Anson Top Car" width={1254} height={705} loading="lazy" />
        <span className="x" aria-hidden>
          ×
        </span>
        <img src="/brand/brian-garage.jpg" alt="布萊恩車庫 Imported car sales" width={1774} height={887} loading="lazy" />
      </div>
    </footer>
  );
}
