import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import type { Battle } from "@/domain/entities/battle/battle.entity.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";

export function makeGetBattleUseCase(deps: { battleRepo: BattleRepository }) {
  return async (battleId: string): Promise<Result<Battle>> => {
    const b = await deps.battleRepo.findById(battleId);
    if (!b) return err(ERROR_CODES.BATTLE_NOT_FOUND, "対戦が見つかりません");
    return ok(b);
  };
}
