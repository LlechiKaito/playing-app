import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-black text-white p-8">
      <h1 className="text-5xl font-bold mb-4">🎤 カラオケ対戦</h1>
      <p className="text-lg mb-8 opacity-80">DAM の採点結果で対戦するアプリ</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-8 py-4 bg-pink-500 hover:bg-pink-400 rounded-lg transition font-semibold"
        >
          ログイン
        </Link>
        <Link
          href="/signup"
          className="px-8 py-4 bg-white text-purple-900 hover:bg-gray-100 rounded-lg transition font-semibold"
        >
          新規登録
        </Link>
      </div>
      <p className="mt-12 text-xs opacity-50">v0.1.0</p>
    </main>
  );
}
