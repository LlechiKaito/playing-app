import { ok, type Result } from "@/domain/commons/result.js";
import type { User } from "@/domain/entities/user/user.entity.js";
import type { UserRepository } from "@/domain/repositories/user.repository.js";

export type RankingType = "RATE" | "WINS" | "BEST_SCORE";
export type RankingEntry = { rank: number; user: User };

export function makeListRankingUseCase(deps: { userRepo: UserRepository }) {
  return async (args: { by: RankingType; limit: number }): Promise<Result<RankingEntry[]>> => {
    const users = await deps.userRepo.listTop(args.by, args.limit);
    return ok(users.map((u, idx) => ({ rank: idx + 1, user: u })));
  };
}
