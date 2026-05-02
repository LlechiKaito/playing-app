"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { GET_BATTLE, JOIN_BATTLE, ON_BATTLE_UPDATED, ON_STAMP_SENT, SEND_STAMP } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth/context";

const STAMP_LABELS: Record<string, string> = {
  LET_S_GO: "いくぞ🔥",
  NICE: "うまっw",
  WIN_GUARANTEED: "これは勝った😏",
};

type Sub = { userId: string };

export default function BattleRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading } = useQuery(GET_BATTLE, { variables: { battleId: id } });
  const sub = useSubscription(ON_BATTLE_UPDATED, { variables: { battleId: id } });
  const stampSub = useSubscription(ON_STAMP_SENT, { variables: { battleId: id } });
  const [joinBattle] = useMutation(JOIN_BATTLE);
  const [sendStamp] = useMutation(SEND_STAMP);
  const [recentStamp, setRecentStamp] = useState<{ type: string; from: string } | null>(null);

  const battle = sub.data?.onBattleUpdated ?? data?.getBattle;

  useEffect(() => {
    const s = stampSub.data?.onStampSent;
    if (!s) return;
    setRecentStamp({ type: s.type, from: s.userId });
    const t = setTimeout(() => setRecentStamp(null), 2000);
    return () => clearTimeout(t);
  }, [stampSub.data]);

  useEffect(() => {
    if (battle?.status === "COMPLETED" || battle?.status === "DISPUTED") {
      router.push(`/battles/${id}/result`);
    }
  }, [battle?.status, id, router]);

  if (loading) return <main className="p-8 text-center opacity-60">読み込み中...</main>;
  if (!battle) return <main className="p-8 text-center opacity-60">対戦が見つかりません</main>;

  const isCreator = battle.creatorId === user?.id;
  const isOpponent = battle.opponentId === user?.id;
  const isParticipant = isCreator || isOpponent;
  const submittedUserIds = new Set(battle.submissions.map((s: Sub) => s.userId));

  async function handleJoin() {
    await joinBattle({ variables: { battleId: id } });
  }

  async function handleStamp(t: keyof typeof STAMP_LABELS) {
    await sendStamp({ variables: { battleId: id, type: t } });
  }

  return (
    <main className="p-8 max-w-3xl mx-auto relative">
      <Link href="/battles" className="text-sm opacity-60 hover:opacity-100">← 一覧へ</Link>
      <h1 className="text-2xl font-bold mt-2">対戦ルーム</h1>
      <p className="text-sm opacity-60 mb-2">対戦コード: <span className="font-mono text-pink-400">{battle.code}</span></p>
      <p className="text-xs opacity-60 mb-6">この6桁を歌う前に画面に書いて撮影してください</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-xs opacity-60">あなた / 相手</div>
          <div className="font-bold text-lg mt-1">{battle.creator?.nickname ?? "?"}</div>
          <div className="text-xs mt-2">
            {submittedUserIds.has(battle.creatorId) ? "✅ 提出済み" : "⏳ 未提出"}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="text-xs opacity-60">vs</div>
          <div className="font-bold text-lg mt-1">{battle.opponent?.nickname ?? "..."}</div>
          <div className="text-xs mt-2">
            {battle.opponentId
              ? submittedUserIds.has(battle.opponentId)
                ? "✅ 提出済み"
                : "⏳ 未提出"
              : "募集中"}
          </div>
        </div>
      </div>

      {!isParticipant && battle.status === "WAITING" ? (
        <button
          onClick={handleJoin}
          className="w-full py-3 bg-pink-500 hover:bg-pink-400 rounded font-semibold mb-4"
        >
          入室する
        </button>
      ) : null}

      {isParticipant && (battle.status === "MATCHED" || battle.status === "P1_SUBMITTED" || battle.status === "P2_SUBMITTED") &&
        !submittedUserIds.has(user?.id ?? "") ? (
        <Link
          href={`/battles/${id}/submit`}
          className="block w-full py-3 bg-pink-500 hover:bg-pink-400 rounded font-semibold text-center mb-4"
        >
          採点画像を提出する
        </Link>
      ) : null}

      {isParticipant ? (
        <div className="flex gap-2 justify-center">
          {(Object.keys(STAMP_LABELS) as Array<keyof typeof STAMP_LABELS>).map((t) => (
            <button
              key={t}
              onClick={() => handleStamp(t)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            >
              {STAMP_LABELS[t]}
            </button>
          ))}
        </div>
      ) : null}

      {recentStamp ? (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold animate-pulse pointer-events-none">
          {STAMP_LABELS[recentStamp.type]}
        </div>
      ) : null}
    </main>
  );
}
