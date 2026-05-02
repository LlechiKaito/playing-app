import { PutCommand, QueryCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "@/config/env.js";
import type { ImageHashRepository } from "@/domain/repositories/image-hash.repository.js";

function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Math.max(a.length, b.length);
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

export class ImageHashDynamoRepository implements ImageHashRepository {
  constructor(private readonly doc: DynamoDBDocumentClient) {}

  async hasSimilar(userId: string, hash: string, threshold: number): Promise<boolean> {
    const r = await this.doc.send(
      new QueryCommand({
        TableName: env.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "IMAGE_HASH#" },
      }),
    );
    for (const item of r.Items ?? []) {
      const stored = (item.hash as string) ?? "";
      if (hammingDistance(stored, hash) <= threshold) return true;
    }
    return false;
  }

  async save(userId: string, hash: string, battleId: string): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: env.tableName,
        Item: {
          PK: `USER#${userId}`,
          SK: `IMAGE_HASH#${hash}`,
          hash,
          battleId,
          createdAt: new Date().toISOString(),
        },
      }),
    );
  }
}
