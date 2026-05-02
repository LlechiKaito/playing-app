import { unwrap } from "@/domain/commons/result.js";
import { isStampType } from "@/domain/value-objects/stamp-type.js";
import { requireUser, type GqlContext } from "./context.js";

const BATTLE_TOPIC = (id: string) => `battle:${id}`;
const STAMP_TOPIC = (id: string) => `stamp:${id}`;

export const resolvers = {
  Query: {
    healthCheck: () => "ok",
    me: async (_: unknown, __: unknown, ctx: GqlContext) => {
      if (!ctx.userId) return null;
      return ctx.container.userRepo.findById(ctx.userId);
    },
    listOpenBattles: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireUser(ctx);
      return unwrap(await ctx.container.listOpenBattles());
    },
    getBattle: async (_: unknown, args: { battleId: string }, ctx: GqlContext) => {
      requireUser(ctx);
      const r = await ctx.container.getBattle(args.battleId);
      return r.ok ? r.value : null;
    },
    listRanking: async (_: unknown, args: { by: "RATE" | "WINS" | "BEST_SCORE"; limit: number }, ctx: GqlContext) => {
      requireUser(ctx);
      return unwrap(await ctx.container.listRanking({ by: args.by, limit: args.limit }));
    },
  },

  Mutation: {
    signup: async (_: unknown, args: { email: string; password: string; nickname: string }, ctx: GqlContext) => {
      return unwrap(await ctx.container.signup(args));
    },
    login: async (_: unknown, args: { email: string; password: string }, ctx: GqlContext) => {
      return unwrap(await ctx.container.login(args));
    },
    createBattle: async (
      _: unknown,
      args: { input: { title: string; memo: string | null } },
      ctx: GqlContext,
    ) => {
      const userId = requireUser(ctx);
      const r = unwrap(
        await ctx.container.createBattle({ creatorId: userId, title: args.input.title, memo: args.input.memo ?? null }),
      );
      ctx.pubsub.publish(BATTLE_TOPIC(r.id), { onBattleUpdated: r });
      return r;
    },
    joinBattle: async (_: unknown, args: { battleId: string }, ctx: GqlContext) => {
      const userId = requireUser(ctx);
      const r = unwrap(await ctx.container.joinBattle({ battleId: args.battleId, joinerId: userId }));
      ctx.pubsub.publish(BATTLE_TOPIC(r.id), { onBattleUpdated: r });
      return r;
    },
    requestUploadUrl: async (_: unknown, args: { battleId: string }, ctx: GqlContext) => {
      const userId = requireUser(ctx);
      return unwrap(await ctx.container.requestUploadUrl({ battleId: args.battleId, userId }));
    },
    submitScore: async (_: unknown, args: { battleId: string; s3Key: string }, ctx: GqlContext) => {
      const userId = requireUser(ctx);
      const r = unwrap(
        await ctx.container.submitScore({ battleId: args.battleId, userId, s3Key: args.s3Key }),
      );
      ctx.pubsub.publish(BATTLE_TOPIC(r.battle.id), { onBattleUpdated: r.battle });
      return r;
    },
    sendStamp: async (_: unknown, args: { battleId: string; type: string }, ctx: GqlContext) => {
      const userId = requireUser(ctx);
      if (!isStampType(args.type)) {
        const e = new Error("VALIDATION_FAILED") as Error & { code: string };
        e.code = "VALIDATION_FAILED";
        throw e;
      }
      const stamp = unwrap(await ctx.container.sendStamp({ battleId: args.battleId, userId, type: args.type }));
      ctx.pubsub.publish(STAMP_TOPIC(args.battleId), { onStampSent: stamp });
      return stamp;
    },
  },

  Subscription: {
    onBattleUpdated: {
      subscribe: (_: unknown, args: { battleId: string }, ctx: GqlContext) =>
        (ctx.pubsub.asyncIterator
          ? ctx.pubsub.asyncIterator(BATTLE_TOPIC(args.battleId))
          : (ctx.pubsub as unknown as { asyncIterableIterator: (t: string) => AsyncIterable<unknown> }).asyncIterableIterator(BATTLE_TOPIC(args.battleId))),
    },
    onStampSent: {
      subscribe: (_: unknown, args: { battleId: string }, ctx: GqlContext) =>
        (ctx.pubsub.asyncIterator
          ? ctx.pubsub.asyncIterator(STAMP_TOPIC(args.battleId))
          : (ctx.pubsub as unknown as { asyncIterableIterator: (t: string) => AsyncIterable<unknown> }).asyncIterableIterator(STAMP_TOPIC(args.battleId))),
    },
  },

  Battle: {
    creator: async (b: { creatorId: string }, _: unknown, ctx: GqlContext) =>
      ctx.container.userRepo.findById(b.creatorId),
    opponent: async (b: { opponentId: string | null }, _: unknown, ctx: GqlContext) =>
      b.opponentId ? ctx.container.userRepo.findById(b.opponentId) : null,
  },
};
