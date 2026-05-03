export type User = {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  rate: number;
  wins: number;
  losses: number;
  draws: number;
  bestScore: number | null;
  createdAt: string;
};

export const INITIAL_RATE = 1500;

export function createNewUser(args: {
  id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  now: string;
}): User {
  return {
    id: args.id,
    email: args.email,
    passwordHash: args.passwordHash,
    nickname: args.nickname,
    rate: INITIAL_RATE,
    wins: 0,
    losses: 0,
    draws: 0,
    bestScore: null,
    createdAt: args.now,
  };
}

export function applyBattleResult(
  user: User,
  args: { delta: number; outcome: "WIN" | "LOSE" | "DRAW"; score: number },
): User {
  const wins = user.wins + (args.outcome === "WIN" ? 1 : 0);
  const losses = user.losses + (args.outcome === "LOSE" ? 1 : 0);
  const draws = user.draws + (args.outcome === "DRAW" ? 1 : 0);
  const bestScore = user.bestScore === null || args.score > user.bestScore ? args.score : user.bestScore;
  return {
    ...user,
    rate: user.rate + args.delta,
    wins,
    losses,
    draws,
    bestScore,
  };
}
