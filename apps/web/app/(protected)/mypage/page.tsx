"use client";
import { useAuth } from "@/lib/auth/context";

export default function MyPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">マイページ</h1>
      <div className="bg-zinc-900 rounded-lg p-6 space-y-4">
        <div className="flex justify-between"><span className="opacity-60">ニックネーム</span><span className="font-bold">{user.nickname}</span></div>
        <div className="flex justify-between"><span className="opacity-60">メール</span><span>{user.email}</span></div>
        <div className="flex justify-between"><span className="opacity-60">レート</span><span className="text-2xl font-bold text-pink-400">{user.rate}</span></div>
        <div className="flex justify-between"><span className="opacity-60">勝 / 負 / 分</span><span>{user.wins} / {user.losses} / {user.draws}</span></div>
        <div className="flex justify-between"><span className="opacity-60">最高点</span><span>{user.bestScore?.toFixed(3) ?? "-"}</span></div>
      </div>
    </main>
  );
}
