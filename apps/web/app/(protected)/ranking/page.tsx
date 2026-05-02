"use client";
import { useState } from "react";
import { useQuery } from "@apollo/client";
import { LIST_RANKING } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth/context";

type Tab = "RATE" | "WINS" | "BEST_SCORE";
const TABS: { key: Tab; label: string }[] = [
  { key: "RATE", label: "総合レート" },
  { key: "WINS", label: "勝利数" },
  { key: "BEST_SCORE", label: "最高点" },
];

type Entry = {
  rank: number;
  user: { id: string; nickname: string; rate: number; wins: number; losses: number; bestScore: number | null };
};

export default function RankingPage() {
  const [tab, setTab] = useState<Tab>("RATE");
  const { user } = useAuth();
  const { data, loading } = useQuery(LIST_RANKING, { variables: { by: tab, limit: 100 } });

  const entries = (data?.listRanking ?? []) as Entry[];

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ランキング</h1>
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded text-sm ${tab === t.key ? "bg-pink-500 font-semibold" : "bg-zinc-800 hover:bg-zinc-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p className="opacity-60">読み込み中...</p> : null}

      <table className="w-full bg-zinc-900 rounded-lg overflow-hidden">
        <thead className="bg-zinc-800 text-xs uppercase opacity-60">
          <tr>
            <th className="px-3 py-2 text-left w-10">#</th>
            <th className="px-3 py-2 text-left">ユーザー</th>
            <th className="px-3 py-2 text-right">レート</th>
            <th className="px-3 py-2 text-right">勝/負</th>
            <th className="px-3 py-2 text-right">最高点</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.user.id}
              className={`border-t border-zinc-800 ${e.user.id === user?.id ? "bg-pink-500/20" : ""}`}
            >
              <td className="px-3 py-2">{e.rank}</td>
              <td className="px-3 py-2 font-semibold">
                {e.user.id === user?.id ? "★ " : ""}
                {e.user.nickname}
              </td>
              <td className="px-3 py-2 text-right">{e.user.rate}</td>
              <td className="px-3 py-2 text-right">{e.user.wins}/{e.user.losses}</td>
              <td className="px-3 py-2 text-right">{e.user.bestScore?.toFixed(3) ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
