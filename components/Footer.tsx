import Link from "next/link";
import type { Staff } from "@/lib/types";
import { resolveLineUrl } from "@/lib/line";

export function Footer({ staff }: { staff: Staff[] }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="wordmark">
            <span className="wordmark-zh">玄藏</span>
            <span className="wordmark-en">Atelier Noir · Taipei</span>
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
              {staff.map((person) => {
                const href = resolveLineUrl(person.lineUrl, person.lineId);
                return (
                  <li key={person.id}>
                    <a href={href} target="_blank" rel="noreferrer">
                      <span className="name">{person.displayName}</span>
                      <span className="role">{person.role}</span>
                      <span className="go">開啟官方 LINE</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-line">尚未設定公開聯絡人。</p>
          )}
        </div>
      </div>
      <div className="colophon">
        <span>台北 · 預約制</span>
        <Link href="/admin">員工入口</Link>
      </div>
    </footer>
  );
}
