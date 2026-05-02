"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading) {
    return <main className="p-8 text-center opacity-60">読み込み中...</main>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-zinc-900 px-6 py-3 flex items-center justify-between border-b border-zinc-800">
        <Link href="/battles" className="font-bold text-pink-400">🎤 カラオケ対戦</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/battles" className="hover:text-pink-300">対戦</Link>
          <Link href="/ranking" className="hover:text-pink-300">ランキング</Link>
          <Link href="/mypage" className="hover:text-pink-300">マイページ</Link>
          <button onClick={logout} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs">
            ログアウト
          </button>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
