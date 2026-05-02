import { describe, it, expect } from "vitest";
import {
  attachSubmission,
  createBattle,
  joinBattle,
  judgeBattle,
} from "@/domain/entities/battle/battle.entity.js";

const NOW = "2026-05-02T00:00:00.000Z";

function fixture() {
  return createBattle({
    id: "B1",
    code: "ABC123",
    title: "test",
    memo: null,
    creatorId: "U1",
    now: NOW,
  });
}

describe("Battle entity", () => {
  it("creates a WAITING battle", () => {
    const b = fixture();
    expect(b.status).toBe("WAITING");
    expect(b.creatorId).toBe("U1");
    expect(b.opponentId).toBeNull();
  });

  it("blocks self-join", () => {
    const r = joinBattle(fixture(), "U1", NOW);
    expect(r.ok).toBe(false);
  });

  it("transitions to MATCHED on join", () => {
    const r = joinBattle(fixture(), "U2", NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe("MATCHED");
      expect(r.value.opponentId).toBe("U2");
    }
  });

  it("rejects double join", () => {
    const a = joinBattle(fixture(), "U2", NOW);
    if (!a.ok) throw new Error("should match");
    const b = joinBattle(a.value, "U3", NOW);
    expect(b.ok).toBe(false);
  });

  it("attaches submission and reaches JUDGING when both submit", () => {
    const matched = joinBattle(fixture(), "U2", NOW);
    if (!matched.ok) throw new Error();
    const r1 = attachSubmission(
      matched.value,
      { userId: "U1", s3Key: "k1", score: 90.0, songName: null, submittedAt: NOW, imageHash: "h1" },
      NOW,
    );
    if (!r1.ok) throw new Error();
    expect(r1.value.status).toBe("P1_SUBMITTED");
    const r2 = attachSubmission(
      r1.value,
      { userId: "U2", s3Key: "k2", score: 85.0, songName: null, submittedAt: NOW, imageHash: "h2" },
      NOW,
    );
    if (!r2.ok) throw new Error();
    expect(r2.value.status).toBe("JUDGING");
  });

  it("judges by score with delta 20", () => {
    const matched = joinBattle(fixture(), "U2", NOW);
    if (!matched.ok) throw new Error();
    const r1 = attachSubmission(
      matched.value,
      { userId: "U1", s3Key: "k1", score: 90.0, songName: null, submittedAt: NOW, imageHash: "h1" },
      NOW,
    );
    if (!r1.ok) throw new Error();
    const r2 = attachSubmission(
      r1.value,
      { userId: "U2", s3Key: "k2", score: 85.0, songName: null, submittedAt: NOW, imageHash: "h2" },
      NOW,
    );
    if (!r2.ok) throw new Error();
    const j = judgeBattle(r2.value, NOW);
    if (!j.ok) throw new Error();
    expect(j.value.draw).toBe(false);
    expect(j.value.delta).toBe(20);
    expect(j.value.winnerId).toBe("U1");
    expect(j.value.battle.status).toBe("COMPLETED");
  });

  it("judges as draw when scores tie", () => {
    const matched = joinBattle(fixture(), "U2", NOW);
    if (!matched.ok) throw new Error();
    const r1 = attachSubmission(
      matched.value,
      { userId: "U1", s3Key: "k1", score: 90.0, songName: null, submittedAt: NOW, imageHash: "h1" },
      NOW,
    );
    if (!r1.ok) throw new Error();
    const r2 = attachSubmission(
      r1.value,
      { userId: "U2", s3Key: "k2", score: 90.0, songName: null, submittedAt: NOW, imageHash: "h2" },
      NOW,
    );
    if (!r2.ok) throw new Error();
    const j = judgeBattle(r2.value, NOW);
    if (!j.ok) throw new Error();
    expect(j.value.draw).toBe(true);
    expect(j.value.delta).toBe(0);
  });
});
