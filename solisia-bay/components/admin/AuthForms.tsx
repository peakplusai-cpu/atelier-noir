"use client";

import { useActionState } from "react";
import { loginStaff, setupStaff } from "@/app/actions/staff";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginStaff, "");
  return (
    <form action={action} className="staff-form">
      <label className="field">
        <span>密碼</span>
        <input type="password" name="password" required autoFocus autoComplete="current-password" />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-solid btn-block" disabled={pending}>
        {pending ? "驗證中…" : "登入"}
      </button>
    </form>
  );
}

export function SetupForm({ needsSetupToken }: { needsSetupToken: boolean }) {
  const [error, action, pending] = useActionState(setupStaff, "");
  return (
    <form action={action} className="staff-form">
      {needsSetupToken && (
        <label className="field">
          <span>設定代碼</span>
          <input name="setupToken" type="password" required autoComplete="off" />
        </label>
      )}
      <label className="field">
        <span>設定密碼</span>
        <input type="password" name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="field">
        <span>再次輸入</span>
        <input type="password" name="confirm" required minLength={8} autoComplete="new-password" />
      </label>
      <p className="fine">至少 8 個字元。這組密碼只給員工使用。</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn btn-solid btn-block" disabled={pending}>
        {pending ? "建立中…" : "建立並進入後台"}
      </button>
    </form>
  );
}
