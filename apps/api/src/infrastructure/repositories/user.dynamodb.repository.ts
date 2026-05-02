import { GetCommand, PutCommand, QueryCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "@/config/env.js";
import type { User } from "@/domain/entities/user/user.entity.js";
import type { UserRepository } from "@/domain/repositories/user.repository.js";

type UserItem = User & {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  emailLookupPK: string;
};

const PROFILE_SK = "PROFILE";

function userToItem(u: User): UserItem {
  const padded = (n: number) => (99999 - n).toString().padStart(5, "0");
  return {
    ...u,
    PK: `USER#${u.id}`,
    SK: PROFILE_SK,
    GSI1PK: "LEADERBOARD#RATE",
    GSI1SK: `${padded(u.rate)}#${u.id}`,
    emailLookupPK: `EMAIL#${u.email.toLowerCase()}`,
  };
}

function itemToUser(i: Record<string, unknown>): User {
  return {
    id: i.id as string,
    email: i.email as string,
    passwordHash: i.passwordHash as string,
    nickname: i.nickname as string,
    rate: i.rate as number,
    wins: i.wins as number,
    losses: i.losses as number,
    draws: i.draws as number,
    bestScore: (i.bestScore as number | null) ?? null,
    createdAt: i.createdAt as string,
  };
}

export class UserDynamoRepository implements UserRepository {
  constructor(private readonly doc: DynamoDBDocumentClient) {}

  async findById(id: string): Promise<User | null> {
    const r = await this.doc.send(
      new GetCommand({ TableName: env.tableName, Key: { PK: `USER#${id}`, SK: PROFILE_SK } }),
    );
    return r.Item ? itemToUser(r.Item) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const r = await this.doc.send(
      new QueryCommand({
        TableName: env.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": `EMAIL#${email.toLowerCase()}` },
        Limit: 1,
      }),
    );
    const lookup = (r.Items ?? [])[0];
    if (!lookup) return null;
    const userId = lookup.id as string | undefined;
    if (!userId) return null;
    return this.findById(userId);
  }

  async save(user: User): Promise<void> {
    const item = userToItem(user);
    await this.doc.send(new PutCommand({ TableName: env.tableName, Item: item }));
    await this.doc.send(
      new PutCommand({
        TableName: env.tableName,
        Item: {
          id: user.id,
          email: user.email,
          PK: `EMAIL#${user.email.toLowerCase()}`,
          SK: "LOOKUP",
          GSI1PK: `EMAIL#${user.email.toLowerCase()}`,
          GSI1SK: user.id,
        },
      }),
    );
  }

  async listTop(by: "RATE" | "WINS" | "BEST_SCORE", limit: number): Promise<User[]> {
    if (by === "RATE") {
      const r = await this.doc.send(
        new QueryCommand({
          TableName: env.tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "GSI1PK = :pk",
          ExpressionAttributeValues: { ":pk": "LEADERBOARD#RATE" },
          Limit: limit,
        }),
      );
      return (r.Items ?? []).map(itemToUser);
    }
    const r = await this.doc.send(
      new QueryCommand({
        TableName: env.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": "LEADERBOARD#RATE" },
        Limit: 200,
      }),
    );
    const all = (r.Items ?? []).map(itemToUser);
    if (by === "WINS") {
      return all.sort((a, b) => b.wins - a.wins).slice(0, limit);
    }
    return all
      .sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0))
      .slice(0, limit);
  }
}
