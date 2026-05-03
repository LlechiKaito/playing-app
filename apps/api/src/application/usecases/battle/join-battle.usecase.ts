import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import { joinBattle, type Battle } from "@/domain/entities/battle/battle.entity.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";

export function makeJoinBattleUseCase(deps: { battleRepo: BattleRepository }) {
  return async (args: { battleId: string; joinerId: string }): Promise<Result<Battle>> => {
    const battle = await deps.battleRepo.findById(args.battleId);
    if (!battle) return err(ERROR_CODES.BATTLE_NOT_FOUND, "対戦が見つかりません");
    const r = joinBattle(battle, args.joinerId, new Date().toISOString());
    if (!r.ok) return r;
    await deps.battleRepo.save(r.value);
    return ok(r.value);
  };
}
