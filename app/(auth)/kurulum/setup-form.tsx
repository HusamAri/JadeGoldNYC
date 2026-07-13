"use client";

import { useActionState } from "react";

import {
  createOrganizationAction,
  type SetupState,
} from "@/app/(auth)/kurulum/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SetupState = {};

const CURRENCIES = ["USD", "EUR", "GBP", "TRY", "CAD", "AUD"];

export function SetupForm() {
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Şirket / mağaza adı</Label>
        <Input
          id="name"
          name="name"
          placeholder="Örn. Yaso"
          maxLength={120}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Para birimi</Label>
        <select
          id="currency"
          name="currency"
          defaultValue="USD"
          className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="text-muted-foreground text-xs">
          Panelde tutarların gösterileceği varsayılan birim.
        </p>
      </div>
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Kuruluyor…" : "Şirketi kur"}
      </Button>
    </form>
  );
}
