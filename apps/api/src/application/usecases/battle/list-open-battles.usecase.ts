import { ok, type Result } from "@/domain/commons/result.js";
import type { Battle } from "@/domain/entities/battle/battle.entity.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";

export function makeListOpenBattlesUseCase(deps: { battleRepo: BattleRepository }) {
  return async (): Promise<Result<Battle[]>> => {
    const list = await deps.battleRepo.listOpen(50);
    return ok(list);
  };
}
