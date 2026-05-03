import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";
import type { StampRateLimitRepository } from "@/domain/repositories/stamp-rate-limit.repository.js";
import type { StampType } from "@/domain/value-objects/stamp-type.js";

export type Stamp = { battleId: string; userId: string; type: StampType; sentAt: string };

export function makeSendStampUseCase(deps: {
  battleRepo: BattleRepository;
  rateLimitRepo: StampRateLimitRepository;
}) {
  return async (args: { battleId: string; userId: string; type: StampType }): Promise<Result<Stamp>> => {
    const battle = await deps.battleRepo.findById(args.battleId);
    if (!battle) return err(ERROR_CODES.BATTLE_NOT_FOUND, "対戦が見つかりません");
    if (battle.creatorId !== args.userId && battle.opponentId !== args.userId) {
      return err(ERROR_CODES.FORBIDDEN, "この対戦の参加者ではありません");
    }
    const allowed = await deps.rateLimitRepo.hitAndCheck(args.userId, args.battleId);
    if (!allowed) return err(ERROR_CODES.STAMP_RATE_LIMIT, "連投しすぎです（5秒に3回まで）");
    return ok({
      battleId: args.battleId,
      userId: args.userId,
      type: args.type,
      sentAt: new Date().toISOString(),
    });
  };
}
