import type { Container } from "@/container/container.js";
import { verifyJwt } from "@/infrastructure/auth/jwt.js";

export type GqlContext = {
  container: Container;
  userId: string | null;
  pubsub: import("graphql-subscriptions").PubSub;
};

export async function buildHttpContext(args: {
  authHeader: string | undefined;
  container: Container;
  pubsub: import("graphql-subscriptions").PubSub;
}): Promise<GqlContext> {
  const userId = await resolveUserId(args.authHeader);
  return { container: args.container, userId, pubsub: args.pubsub };
}

export async function resolveUserId(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer (.+)$/i);
  if (!m || !m[1]) return null;
  const claims = await verifyJwt(m[1]);
  return claims?.sub ?? null;
}

export function requireUser(ctx: GqlContext): string {
  if (!ctx.userId) {
    const e = new Error("UNAUTHORIZED") as Error & { code: string };
    e.code = "UNAUTHORIZED";
    throw e;
  }
  return ctx.userId;
}
