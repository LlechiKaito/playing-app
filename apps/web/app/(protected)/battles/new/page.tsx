"use client";
import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CREATE_BATTLE } from "@/lib/api/queries";

export default function NewBattlePage() {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createBattle, { loading }] = useMutation(CREATE_BATTLE);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await createBattle({ variables: { input: { title, memo: memo || null } } });
      const id = r.data?.createBattle?.id;
      if (id) router.push(`/battles/${id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <Link href="/battles" className="text-sm opacity-60 hover:opacity-100">← 戻る</Link>
      <h1 className="text-2xl font-bold mb-6 mt-2">対戦募集を作成</h1>
      <form onSubmit={onSubmit} className="bg-zinc-900 p-6 rounded-lg space-y-4">
        <div>
          <label className="text-sm opacity-60">タイトル</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 mt-1 bg-zinc-800 rounded text-white"
          />
        </div>
        <div>
          <label className="text-sm opacity-60">メモ（任意）</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 mt-1 bg-zinc-800 rounded text-white"
          />
        </div>
        {error ? <p className="text-red-400 text-sm">⚠ {error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-pink-500 hover:bg-pink-400 rounded font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "作成する"}
        </button>
      </form>
    </main>
  );
}
