"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui";

export function LoginForm({ defaultPhone }: { defaultPhone: string }) {
  const [state, action, pending] = useActionState(signInAction, undefined);

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-inksoft">Mobile number</span>
        <input
          name="phone"
          defaultValue={defaultPhone}
          inputMode="numeric"
          autoComplete="username"
          className="tabular mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand"
          placeholder="98xxxxxxxx"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-inksoft">Password</span>
        <input
          name="password"
          type="password"
          defaultValue="demo1234"
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      <Button disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
