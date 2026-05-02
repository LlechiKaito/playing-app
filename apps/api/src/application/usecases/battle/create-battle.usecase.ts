import { ERROR_CODES } from "@/constants/error-codes.js";
import { err, ok, type Result } from "@/domain/commons/result.js";
import { createBattle, type Battle } from "@/domain/entities/battle/battle.entity.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";
import { generateBattleCode } from "@/domain/value-objects/battle-code.js";
import { nanoid } from "nanoid";

export type CreateBattleInput = { creatorId: string; title: string; memo: string | null };

export function makeCreateBattleUseCase(deps: { battleRepo: BattleRepository }) {
  return async (input: CreateBattleInput): Promise<Result<Battle>> => {
    if (input.title.trim().length === 0) {
      return err(ERROR_CODES.VALIDATION_FAILED, "タイトルは必須です");
    }
    const code = generateBattleCode();
    const battle = createBattle({
      id: nanoid(),
      code,
      title: input.title,
      memo: input.memo,
      creatorId: input.creatorId,
      now: new Date().toISOString(),
    });
    await deps.battleRepo.save(battle);
    return ok(battle);
  };
}
