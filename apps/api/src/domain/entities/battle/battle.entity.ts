import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";

export type BattleStatus =
  | "WAITING"
  | "MATCHED"
  | "P1_SUBMITTED"
  | "P2_SUBMITTED"
  | "JUDGING"
  | "COMPLETED"
  | "DISPUTED";

export type Submission = {
  userId: string;
  s3Key: string;
  score: number;
  songName: string | null;
  submittedAt: string;
  imageHash: string;
};

export type Battle = {
  id: string;
  code: string;
  title: string;
  memo: string | null;
  status: BattleStatus;
  creatorId: string;
  opponentId: string | null;
  submissions: Submission[];
  winnerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function createBattle(args: {
  id: string;
  code: string;
  title: string;
  memo: string | null;
  creatorId: string;
  now: string;
}): Battle {
  return {
    id: args.id,
    code: args.code,
    title: args.title,
    memo: args.memo,
    status: "WAITING",
    creatorId: args.creatorId,
    opponentId: null,
    submissions: [],
    winnerId: null,
    createdAt: args.now,
    updatedAt: args.now,
  };
}

export function joinBattle(battle: Battle, joinerId: string, now: string): Result<Battle> {
  if (battle.creatorId === joinerId) {
    return err(ERROR_CODES.CANNOT_JOIN_OWN_BATTLE, "自分の対戦には参加できません");
  }
  if (battle.status !== "WAITING") {
    return err(ERROR_CODES.BATTLE_ALREADY_MATCHED, "既にマッチ済みの対戦です");
  }
  return ok({
    ...battle,
    opponentId: joinerId,
    status: "MATCHED",
    updatedAt: now,
  });
}

export function attachSubmission(battle: Battle, submission: Submission, now: string): Result<Battle> {
  if (battle.status !== "MATCHED" && battle.status !== "P1_SUBMITTED" && battle.status !== "P2_SUBMITTED") {
    return err(ERROR_CODES.BATTLE_INVALID_STATE, "提出可能な状態ではありません");
  }
  const isP1 = submission.userId === battle.creatorId;
  const isP2 = submission.userId === battle.opponentId;
  if (!isP1 && !isP2) {
    return err(ERROR_CODES.FORBIDDEN, "この対戦の参加者ではありません");
  }
  if (battle.submissions.some((s) => s.userId === submission.userId)) {
    return err(ERROR_CODES.ALREADY_SUBMITTED, "既に提出済みです");
  }
  const submissions = [...battle.submissions, submission];

  let next: BattleStatus;
  if (submissions.length === 2) {
    next = "JUDGING";
  } else if (isP1) {
    next = "P1_SUBMITTED";
  } else {
    next = "P2_SUBMITTED";
  }

  return ok({ ...battle, submissions, status: next, updatedAt: now });
}

export type JudgeResult = {
  battle: Battle;
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  delta: number;
};

export const RATE_DELTA = 20;

export function judgeBattle(battle: Battle, now: string): Result<JudgeResult> {
  if (battle.status !== "JUDGING") {
    return err(ERROR_CODES.BATTLE_INVALID_STATE, "判定可能な状態ではありません");
  }
  const [a, b] = battle.submissions;
  if (!a || !b) {
    return err(ERROR_CODES.BATTLE_INVALID_STATE, "提出が揃っていません");
  }

  if (a.score === b.score) {
    return ok({
      battle: { ...battle, status: "COMPLETED", winnerId: null, updatedAt: now },
      winnerId: null,
      loserId: null,
      draw: true,
      delta: 0,
    });
  }
  const winner = a.score > b.score ? a : b;
  const loser = a.score > b.score ? b : a;
  return ok({
    battle: { ...battle, status: "COMPLETED", winnerId: winner.userId, updatedAt: now },
    winnerId: winner.userId,
    loserId: loser.userId,
    draw: false,
    delta: RATE_DELTA,
  });
}

export function markDisputed(battle: Battle, now: string): Battle {
  return { ...battle, status: "DISPUTED", updatedAt: now };
}
