export type ParsedScore = {
  score: number;
  songName: string | null;
  matchedBattleCode: boolean;
};

const SCORE_RE = /\b(\d{2,3}\.\d{3})\b/;
const FALLBACK_SCORE_RE = /\b(\d{2,3})\s*\.\s*(\d{3})\b/;

export function parseDamScore(text: string, expectedBattleCode: string): ParsedScore {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let score = -1;
  for (const line of lines) {
    const m = line.match(SCORE_RE) ?? line.match(FALLBACK_SCORE_RE);
    if (m) {
      const v = m[1] && m[2] ? Number(`${m[1]}.${m[2]}`) : Number(m[1]);
      if (!Number.isNaN(v) && v >= 0 && v <= 100) {
        score = v;
        break;
      }
    }
  }
  const upper = text.toUpperCase();
  const matched = upper.includes(expectedBattleCode.toUpperCase());
  const songName = pickSongName(lines);
  return { score, songName, matchedBattleCode: matched };
}

function pickSongName(lines: string[]): string | null {
  for (const line of lines) {
    if (/[ぁ-んァ-ヴ一-龯]/.test(line) && line.length >= 2 && line.length <= 40) {
      return line;
    }
  }
  return null;
}
