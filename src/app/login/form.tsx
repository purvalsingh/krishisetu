"use client";

import { useActionState, useState } from "react";
import { signInAction } from "@/app/actions/auth";
import { Arrow } from "@/components/ui";

export function LoginForm({
  accounts,
  defaultPhone,
}: {
  accounts: { phone: string; name: string; role: string }[];
  defaultPhone: string;
}) {
  const [state, action, pending] = useActionState(signInAction, undefined);
  const [phone, setPhone] = useState(defaultPhone);
  const chosen = accounts.find((a) => a.phone === phone);

  return (
    <form action={action} className="login-form">
      <label>
        Mobile number
        <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="username" />
      </label>
      <label>
        Password
        <input name="password" type="password" defaultValue="demo1234" autoComplete="current-password" />
      </label>
      {state?.error && <p className="warning-text">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Signing in…" : `Sign in${chosen ? ` as ${chosen.role}` : ""}`} <Arrow />
      </button>
    </form>
  );
}
