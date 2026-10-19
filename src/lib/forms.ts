import { z } from "zod";
export type ActionState = { error?: string; success?: string };
export const initialState: ActionState = {};
export function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}
export function rawField(form: FormData, name: string) {
  return String(form.get(name) ?? "");
}
export const uuid = z.string().uuid();
export const emailSchema = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128);
export const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens.",
  );
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)
    .replace(/-$/, "");
}
export function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
export function safeNext(value: string | null | undefined, fallback = "/") {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value)
    ? value
    : fallback;
}
