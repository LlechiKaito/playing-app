import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import http from "node:http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import cors from "cors";
import bodyParser from "body-parser";
import { PubSub } from "graphql-subscriptions";

import { env } from "./config/env.js";
import { createDynamoClient, ensureTable } from "./infrastructure/dynamodb/client.js";
import { createS3Client, ensureBucket } from "./infrastructure/storage/s3-client.js";
import { buildContainer } from "./container/container.js";
import { typeDefs } from "./presentation/schema.js";
import { resolvers } from "./presentation/resolvers.js";
import { buildHttpContext, resolveUserId } from "./presentation/context.js";
import { ERROR_CODES } from "./constants/error-codes.js";

async function main(): Promise<void> {
  const doc = createDynamoClient();
  const s3 = createS3Client();

  await waitForReady(async () => {
    await ensureTable(doc, env.tableName);
  }, "dynamodb");
  await waitForReady(async () => {
    await ensureBucket(s3, env.s3Bucket);
  }, "s3");

  const container = buildContainer({ doc, s3 });
  const pubsub = new PubSub();

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers as unknown as Parameters<typeof makeExecutableSchema>[0]["resolvers"],
  });

  const app = express();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
  const wsCleanup = useServer(
    {
      schema,
      context: async (ctxArg) => {
        const params = (ctxArg as { connectionParams?: Record<string, unknown> }).connectionParams ?? {};
        const auth = (params.Authorization ?? params.authorization) as string | undefined;
        const userId = await resolveUserId(auth);
        return { container, userId, pubsub };
      },
    },
    wsServer as unknown as Parameters<typeof useServer>[1],
  );

  const apollo = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: (formatted, error) => {
      const code = (error as { code?: string })?.code ?? formatted.extensions?.code ?? ERROR_CODES.INTERNAL;
      return { ...formatted, extensions: { ...formatted.extensions, code } };
    },
  });

  await apollo.start();

  app.use(cors({ origin: true, credentials: true }));
  app.use(bodyParser.json({ limit: "5mb" }));
  app.get("/health", (_, res) => res.json({ ok: true }));
  app.use(
    "/graphql",
    expressMiddleware(apollo, {
      context: async ({ req }) =>
        buildHttpContext({ authHeader: req.headers.authorization, container, pubsub }),
    }),
  );

  await new Promise<void>((resolve) => httpServer.listen(env.apiPort, resolve));
  console.log(`🚀 API ready at http://localhost:${env.apiPort}/graphql (ws on same path)`);
}

async function waitForReady(fn: () => Promise<void>, label: string): Promise<void> {
  const deadline = Date.now() + 60_000;
  let last: unknown;
  while (Date.now() < deadline) {
    try {
      await fn();
      return;
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`${label} not ready: ${(last as Error)?.message ?? "unknown"}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
