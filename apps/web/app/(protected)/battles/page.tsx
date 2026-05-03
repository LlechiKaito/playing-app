"use client";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { LIST_OPEN_BATTLES } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth/context";

type BattleSummary = {
  id: string;
  title: string;
  memo: string | null;
  creatorId: string;
  creator: { nickname: string };
  createdAt: string;
};

export default function BattlesPage() {
  const { user } = useAuth();
  const { data, loading, refetch } = useQuery(LIST_OPEN_BATTLES, { fetchPolicy: "cache-and-network" });

  const battles = (data?.listOpenBattles ?? []) as BattleSummary[];

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">募集中の対戦</h1>
        <Link href="/battles/new" className="px-4 py-2 bg-pink-500 hover:bg-pink-400 rounded font-semibold">
          + 新規作成
        </Link>
      </div>

      {loading ? <p className="opacity-60">読み込み中...</p> : null}

      {!loading && battles.length === 0 ? (
        <p className="opacity-60 text-center py-12">まだ募集がありません</p>
      ) : null}

      <ul className="space-y-3">
        {battles.map((b) => (
          <li key={b.id} className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{b.title}</span>
                {b.creatorId === user?.id ? (
                  <span className="text-xs px-2 py-0.5 bg-pink-500/30 rounded">作成者</span>
                ) : null}
              </div>
              <div className="text-xs opacity-60 mt-1">
                by {b.creator?.nickname ?? "?"}・{new Date(b.createdAt).toLocaleString("ja-JP")}
              </div>
              {b.memo ? <div className="text-sm mt-2 opacity-80">{b.memo}</div> : null}
            </div>
            <Link
              href={`/battles/${b.id}`}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
            >
              入室する →
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={() => refetch()}
        className="mt-6 text-sm opacity-60 hover:opacity-100"
      >
        ↻ 更新
      </button>
    </main>
  );
}
