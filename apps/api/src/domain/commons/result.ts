import type { ErrorCode } from "@/constants/error-codes.js";

export type AppError = {
  code: ErrorCode;
  message: string;
};

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: AppError };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

export const err = (code: ErrorCode, message: string): Err => ({
  ok: false,
  error: { code, message },
});

export function unwrap<T>(r: Result<T>): T {
  if (!r.ok) {
    const e = new Error(r.error.message) as Error & { code: ErrorCode };
    e.code = r.error.code;
    throw e;
  }
  return r.value;
}
