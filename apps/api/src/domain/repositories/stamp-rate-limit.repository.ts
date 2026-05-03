export type StampRateLimitRepository = {
  hitAndCheck(userId: string, battleId: string): Promise<boolean>;
};
