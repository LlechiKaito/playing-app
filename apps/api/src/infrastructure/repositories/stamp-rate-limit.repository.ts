import type { StampRateLimitRepository } from "@/domain/repositories/stamp-rate-limit.repository.js";

const WINDOW_MS = 5_000;
const MAX_HITS = 3;

export class InMemoryStampRateLimitRepository implements StampRateLimitRepository {
  private readonly hits = new Map<string, number[]>();

  async hitAndCheck(userId: string, battleId: string): Promise<boolean> {
    const key = `${userId}#${battleId}`;
    const now = Date.now();
    const arr = (this.hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    if (arr.length >= MAX_HITS) {
      this.hits.set(key, arr);
      return false;
    }
    arr.push(now);
    this.hits.set(key, arr);
    return true;
  }
}
