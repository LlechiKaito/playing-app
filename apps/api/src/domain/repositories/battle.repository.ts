import type { Battle } from "@/domain/entities/battle/battle.entity.js";

export type BattleRepository = {
  findById(id: string): Promise<Battle | null>;
  save(battle: Battle): Promise<void>;
  listOpen(limit: number): Promise<Battle[]>;
};
