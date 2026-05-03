"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { GET_BATTLE } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth/context";

type Sub = { userId: string; score: number };

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data, loading } = useQuery(GET_BATTLE, { variables: { battleId: id }, pollInterval: 2000 });
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  if (loading) return <main className="p-8 text-center opacity-60">読み込み中...</main>;
  const battle = data?.getBattle;
  if (!battle) return <main className="p-8 text-center opacity-60">対戦が見つかりません</main>;

  const myUserId = user?.id ?? "";
  const my = battle.submissions.find((s: Sub) => s.userId === myUserId);
  const opp = battle.submissions.find((s: Sub) => s.userId !== myUserId);
  const isWinner = battle.winnerId === myUserId;
  const isDraw = battle.status === "COMPLETED" && battle.winnerId === null;
  const isDisputed = battle.status === "DISPUTED";

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">対戦結果</h1>

      {count > 0 && !isDisputed ? (
        <div className="text-center py-12">
          <p className="text-7xl font-bold text-pink-400">{count}</p>
          <p className="opacity-60 mt-4">両者の点数を公開します...</p>
        </div>
      ) : isDisputed ? (
        <div className="text-center py-12 bg-yellow-900/30 border border-yellow-500/40 rounded-lg p-6">
          <p className="text-2xl font-bold mb-2">⚠ 確認中です</p>
          <p className="opacity-80">画像が過去のものと似ているため、結果は保留です</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-6 rounded-lg ${isWinner ? "bg-pink-500/30 border-2 border-pink-400" : "bg-zinc-900"}`}>
            <p className="text-xs opacity-60">あなた</p>
            <p className="text-3xl font-bold mt-2">{my?.score?.toFixed(3) ?? "?"}</p>
            <p className="mt-2 font-bold">{isDraw ? "DRAW" : isWinner ? "🏆 WIN" : "LOSE"}</p>
          </div>
          <div className={`p-6 rounded-lg ${battle.winnerId && battle.winnerId !== myUserId ? "bg-pink-500/30 border-2 border-pink-400" : "bg-zinc-900"}`}>
            <p className="text-xs opacity-60">相手</p>
            <p className="text-3xl font-bold mt-2">{opp?.score?.toFixed(3) ?? "?"}</p>
            <p className="mt-2 font-bold">{isDraw ? "DRAW" : !isWinner ? "🏆 WIN" : "LOSE"}</p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/battles" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded inline-block">
          対戦一覧に戻る
        </Link>
      </div>
    </main>
  );
}
