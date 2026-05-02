import { GetCommand, PutCommand, QueryCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "@/config/env.js";
import type { Battle } from "@/domain/entities/battle/battle.entity.js";
import type { BattleRepository } from "@/domain/repositories/battle.repository.js";

const META_SK = "META";

function battleToItem(b: Battle): Record<string, unknown> {
  return {
    PK: `BATTLE#${b.id}`,
    SK: META_SK,
    GSI1PK: `BATTLE_STATUS#${b.status}`,
    GSI1SK: b.createdAt,
    ...b,
  };
}

function itemToBattle(i: Record<string, unknown>): Battle {
  return {
    id: i.id as string,
    code: i.code as string,
    title: i.title as string,
    memo: (i.memo as string | null) ?? null,
    status: i.status as Battle["status"],
    creatorId: i.creatorId as string,
    opponentId: (i.opponentId as string | null) ?? null,
    submissions: (i.submissions as Battle["submissions"]) ?? [],
    winnerId: (i.winnerId as string | null) ?? null,
    createdAt: i.createdAt as string,
    updatedAt: i.updatedAt as string,
  };
}

export class BattleDynamoRepository implements BattleRepository {
  constructor(private readonly doc: DynamoDBDocumentClient) {}

  async findById(id: string): Promise<Battle | null> {
    const r = await this.doc.send(
      new GetCommand({ TableName: env.tableName, Key: { PK: `BATTLE#${id}`, SK: META_SK } }),
    );
    return r.Item ? itemToBattle(r.Item) : null;
  }

  async save(battle: Battle): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: env.tableName, Item: battleToItem(battle) }));
  }

  async listOpen(limit: number): Promise<Battle[]> {
    const r = await this.doc.send(
      new QueryCommand({
        TableName: env.tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": "BATTLE_STATUS#WAITING" },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (r.Items ?? []).map(itemToBattle);
  }
}
