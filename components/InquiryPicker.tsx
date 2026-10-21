"use client";

import { useMemo, useState } from "react";
import type { Staff } from "@/lib/types";
import { resolveLineUrl } from "@/lib/line";

export function InquiryPicker({ staff, carLabel }: { staff: Staff[]; carLabel: string }) {
  const [selected, setSelected] = useState(staff[0]?.id ?? "");
  const current = useMemo(() => staff.find((s) => s.id === selected), [staff, selected]);
  const href = current ? resolveLineUrl(current.lineUrl, current.lineId) : "";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (href) window.location.href = href;
      }}
    >
      <ul className="pick">
        {staff.map((person) => (
          <li key={person.id}>
            <label>
              <input
                type="radio"
                name="staff"
                value={person.id}
                checked={selected === person.id}
                onChange={() => setSelected(person.id)}
              />
              <span className="who">{person.displayName}</span>
              <span className="mute">{person.role}</span>
              <span className="mute">{person.note}</span>
              <span className="engraved">{person.lineId || "LINE"}</span>
            </label>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 36, display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn" type="submit" disabled={!href}>
          前往 LINE 對話
        </button>
        {carLabel ? <span className="mute">請告知：{carLabel}</span> : null}
      </div>
    </form>
  );
}
