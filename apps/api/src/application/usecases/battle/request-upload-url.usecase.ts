import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";
import { presignPut } from "@/infrastructure/storage/s3-client.js";
import { env } from "@/config/env.js";
import { nanoid } from "nanoid";

export type UploadUrl = { url: string; s3Key: string };

export function makeRequestUploadUrlUseCase(deps: { battleRepo: BattleRepository }) {
  return async (args: { battleId: string; userId: string }): Promise<Result<UploadUrl>> => {
    const battle = await deps.battleRepo.findById(args.battleId);
    if (!battle) return err(ERROR_CODES.BATTLE_NOT_FOUND, "対戦が見つかりません");
    if (battle.creatorId !== args.userId && battle.opponentId !== args.userId) {
      return err(ERROR_CODES.FORBIDDEN, "この対戦の参加者ではありません");
    }
    const s3Key = `submissions/${args.battleId}/${args.userId}/${nanoid()}.jpg`;
    const url = await presignPut(env.s3Bucket, s3Key, "image/jpeg");
    return ok({ url, s3Key });
  };
}
