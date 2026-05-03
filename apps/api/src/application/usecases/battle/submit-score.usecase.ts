import type { S3Client } from "@aws-sdk/client-s3";
import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import {
  attachSubmission,
  judgeBattle,
  markDisputed,
  type Battle,
} from "@/domain/entities/battle/battle.entity.js";
import { applyBattleResult } from "@/domain/entities/user/user.entity.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";
import type { UserRepository } from "@/domain/repositories/user.repository.js";
import type { ImageHashRepository } from "@/domain/repositories/image-hash.repository.js";
import { getObjectBytes } from "@/infrastructure/storage/s3-client.js";
import { computeImageHash } from "@/infrastructure/ocr/image-hash.js";
import type { OcrService } from "@/infrastructure/ocr/textract.service.js";
import { env } from "@/config/env.js";

export type SubmitScoreOutput = { battle: Battle; submittedScore: number; songName: string | null };

const HAMMING_THRESHOLD = 5;

export function makeSubmitScoreUseCase(deps: {
  battleRepo: BattleRepository;
  userRepo: UserRepository;
  imageHashRepo: ImageHashRepository;
  ocr: OcrService;
  s3: S3Client;
}) {
  return async (args: {
    battleId: string;
    userId: string;
    s3Key: string;
  }): Promise<Result<SubmitScoreOutput>> => {
    const battle = await deps.battleRepo.findById(args.battleId);
    if (!battle) return err(ERROR_CODES.BATTLE_NOT_FOUND, "対戦が見つかりません");

    const bytes = await getObjectBytes(deps.s3, env.s3Bucket, args.s3Key);
    if (bytes.byteLength === 0) {
      return err(ERROR_CODES.VALIDATION_FAILED, "アップロードされた画像が空です");
    }

    const hash = computeImageHash(bytes);
    const dup = await deps.imageHashRepo.hasSimilar(args.userId, hash, HAMMING_THRESHOLD);

    const parsed = await deps.ocr.extractScore({ imageBytes: bytes, expectedBattleCode: battle.code });
    if (!parsed.matchedBattleCode) {
      return err(ERROR_CODES.OCR_NO_BATTLE_CODE, "画像に対戦コードが見つかりません");
    }
    if (parsed.score < 0) {
      return err(ERROR_CODES.OCR_NO_SCORE, "点数を読み取れませんでした");
    }

    const now = new Date().toISOString();
    const r = attachSubmission(
      battle,
      {
        userId: args.userId,
        s3Key: args.s3Key,
        score: parsed.score,
        songName: parsed.songName,
        submittedAt: now,
        imageHash: hash,
      },
      now,
    );
    if (!r.ok) return r;

    let next = r.value;

    if (dup) {
      next = markDisputed(next, now);
      await deps.battleRepo.save(next);
      await deps.imageHashRepo.save(args.userId, hash, args.battleId);
      return ok({ battle: next, submittedScore: parsed.score, songName: parsed.songName });
    }

    if (next.status === "JUDGING") {
      const judged = judgeBattle(next, now);
      if (judged.ok) {
        next = judged.value.battle;
        if (judged.value.draw) {
          await applyDelta(deps.userRepo, judged.value.battle.creatorId, 0, "DRAW", scoreOf(judged.value.battle, judged.value.battle.creatorId));
          if (judged.value.battle.opponentId) {
            await applyDelta(deps.userRepo, judged.value.battle.opponentId, 0, "DRAW", scoreOf(judged.value.battle, judged.value.battle.opponentId));
          }
        } else if (judged.value.winnerId && judged.value.loserId) {
          await applyDelta(deps.userRepo, judged.value.winnerId, judged.value.delta, "WIN", scoreOf(next, judged.value.winnerId));
          await applyDelta(deps.userRepo, judged.value.loserId, -judged.value.delta, "LOSE", scoreOf(next, judged.value.loserId));
        }
      }
    }

    await deps.battleRepo.save(next);
    await deps.imageHashRepo.save(args.userId, hash, args.battleId);
    return ok({ battle: next, submittedScore: parsed.score, songName: parsed.songName });
  };
}

function scoreOf(b: Battle, userId: string): number {
  return b.submissions.find((s) => s.userId === userId)?.score ?? 0;
}

async function applyDelta(
  userRepo: UserRepository,
  userId: string,
  delta: number,
  outcome: "WIN" | "LOSE" | "DRAW",
  score: number,
): Promise<void> {
  const u = await userRepo.findById(userId);
  if (!u) return;
  await userRepo.save(applyBattleResult(u, { delta, outcome, score }));
}
