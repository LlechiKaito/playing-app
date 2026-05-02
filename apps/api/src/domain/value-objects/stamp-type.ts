export const STAMP_TYPES = ["LET_S_GO", "NICE", "WIN_GUARANTEED"] as const;
export type StampType = (typeof STAMP_TYPES)[number];

export function isStampType(s: string): s is StampType {
  return (STAMP_TYPES as readonly string[]).includes(s);
}
