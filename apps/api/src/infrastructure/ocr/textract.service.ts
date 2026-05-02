import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { env } from "@/config/env.js";
import { parseDamScore, type ParsedScore } from "./score-parser.js";

export type OcrService = {
  extractScore(args: { imageBytes: Uint8Array; expectedBattleCode: string }): Promise<ParsedScore>;
};

export class RealTextractService implements OcrService {
  private readonly client = new TextractClient({ region: env.awsRegion });

  async extractScore(args: { imageBytes: Uint8Array; expectedBattleCode: string }): Promise<ParsedScore> {
    const r = await this.client.send(new DetectDocumentTextCommand({ Document: { Bytes: args.imageBytes } }));
    const text = (r.Blocks ?? [])
      .filter((b) => b.BlockType === "LINE")
      .map((b) => b.Text ?? "")
      .join("\n");
    return parseDamScore(text, args.expectedBattleCode);
  }
}

export class MockTextractService implements OcrService {
  async extractScore(args: { imageBytes: Uint8Array; expectedBattleCode: string }): Promise<ParsedScore> {
    const sum = args.imageBytes.slice(0, 1024).reduce((a, b) => a + b, 0);
    const score = 70 + (sum % 3000) / 100;
    return {
      score: Math.round(score * 1000) / 1000,
      songName: "残酷な天使のテーゼ",
      matchedBattleCode: true,
    };
  }
}

export function createOcrService(): OcrService {
  return env.useRealTextract ? new RealTextractService() : new MockTextractService();
}
