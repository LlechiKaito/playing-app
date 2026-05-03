import { describe, it, expect } from "vitest";
import { parseDamScore } from "@/infrastructure/ocr/score-parser.js";

describe("parseDamScore", () => {
  it("extracts decimal score", () => {
    const r = parseDamScore("精密採点 DX-G\n92.523\nABC123\n残酷な天使のテーゼ", "ABC123");
    expect(r.score).toBe(92.523);
    expect(r.matchedBattleCode).toBe(true);
    expect(r.songName).not.toBeNull();
  });

  it("returns -1 when no score", () => {
    const r = parseDamScore("ABC123\nfoo\nbar", "ABC123");
    expect(r.score).toBe(-1);
  });

  it("flags missing battle code", () => {
    const r = parseDamScore("90.000", "XYZ999");
    expect(r.matchedBattleCode).toBe(false);
  });
});
