"use client";
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
import { createClient } from "graphql-ws";
import { ENV } from "@/lib/env";
import { readToken } from "@/lib/auth/storage";

let client: ApolloClient<unknown> | null = null;

export function getApolloClient(): ApolloClient<unknown> {
  if (client) return client;

  const httpLink = new HttpLink({ uri: ENV.apiUrl });

  const authLink = setContext((_, { headers }) => {
    const token = readToken();
    return {
      headers: {
        ...(headers as Record<string, string>),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const wsLink =
    typeof window !== "undefined"
      ? new GraphQLWsLink(
          createClient({
            url: ENV.wsUrl,
            connectionParams: () => {
              const token = readToken();
              return token ? { Authorization: `Bearer ${token}` } : {};
            },
          }),
        )
      : null;

  const splitLink = wsLink
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return def.kind === "OperationDefinition" && def.operation === "subscription";
        },
        wsLink,
        ApolloLink.from([authLink, httpLink]),
      )
    : ApolloLink.from([authLink, httpLink]);

  client = new ApolloClient({ link: splitLink, cache: new InMemoryCache() });
  return client;
}
