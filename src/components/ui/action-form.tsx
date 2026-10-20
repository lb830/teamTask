"use client";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/forms";
export type FormAction = (
  state: ActionState,
  form: FormData,
) => Promise<ActionState>;
export function SubmitButton({
  children,
  className = "button",
  pendingLabel = "Saving…",
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
export function ActionForm({
  action,
  children,
  className = "",
  resetKey,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetKey?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className} key={resetKey}>
      {children}
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice success" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
export function DeleteButton({
  label = "Delete",
  message = "Delete this item permanently?",
}: {
  label?: string;
  message?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="button danger small"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}
