export type ImageHashRepository = {
  hasSimilar(userId: string, hash: string, threshold: number): Promise<boolean>;
  save(userId: string, hash: string, battleId: string): Promise<void>;
};
