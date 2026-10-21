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
            私人珍藏，僅接受預約鑑賞。請由下列顧問中擇一開啟 LINE，告知屬意車款與希望時段。
          </p>
        </div>
        <div>
          <p className="engraved">選擇顧問 · LINE</p>
          <ul className="staff-list">
            {staff.map((person) => {
              const href = resolveLineUrl(person.lineUrl, person.lineId);
              return (
                <li key={person.id}>
                  <a href={href || "/inquiry"} target={href ? "_blank" : undefined} rel="noreferrer">
                    <span className="name">{person.displayName}</span>
                    <span className="role">{person.role}</span>
                    <span className="go">開啟對話</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="colophon">
        <span>台北 · 預約制</span>
        <Link href="/admin">員工入口</Link>
      </div>
    </footer>
  );
}
