"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { GET_BATTLE, REQUEST_UPLOAD_URL, SUBMIT_SCORE } from "@/lib/api/queries";

export default function SubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data } = useQuery(GET_BATTLE, { variables: { battleId: id } });
  const [requestUrl] = useMutation(REQUEST_UPLOAD_URL);
  const [submitScore] = useMutation(SUBMIT_SCORE);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ score: number; song: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  const battle = data?.getBattle;

  async function handleSubmit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const r = await requestUrl({ variables: { battleId: id } });
      const url = r.data?.requestUploadUrl?.url;
      const s3Key = r.data?.requestUploadUrl?.s3Key;
      if (!url || !s3Key) throw new Error("upload URL 取得失敗");
      const put = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });
      if (!put.ok) throw new Error(`upload 失敗 (${put.status})`);
      const sr = await submitScore({ variables: { battleId: id, s3Key } });
      const result = sr.data?.submitScore;
      if (result) setSubmitted({ score: result.submittedScore, song: result.songName });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <Link href={`/battles/${id}`} className="text-sm opacity-60 hover:opacity-100">← 戻る</Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">採点画像を提出</h1>
      <p className="text-xs opacity-60 mb-6">
        対戦コード: <span className="font-mono text-pink-400">{battle?.code}</span>
        <br />この6桁が画像内に写っているか確認してください
      </p>

      <div className="bg-zinc-900 rounded-lg p-6 space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        {file ? (
          <p className="text-xs opacity-60">選択中: {file.name}（{Math.round(file.size / 1024)} KB）</p>
        ) : null}
        {error ? <p className="text-red-400 text-sm">⚠ {error}</p> : null}
        <button
          onClick={handleSubmit}
          disabled={!file || busy}
          className="w-full py-2 bg-pink-500 hover:bg-pink-400 rounded font-semibold disabled:opacity-50"
        >
          {busy ? "アップロード中..." : "この画像で提出する"}
        </button>
      </div>

      {submitted ? (
        <div className="mt-6 bg-green-900/40 border border-green-500/40 p-6 rounded-lg">
          <p className="font-bold mb-2">✅ 提出しました</p>
          <p>抽出された点数: <span className="text-2xl font-bold">{submitted.score.toFixed(3)}</span></p>
          {submitted.song ? <p className="text-sm opacity-80">曲名候補: {submitted.song}</p> : null}
          <p className="text-xs opacity-60 mt-2">相手の提出を待っています...</p>
          <button
            onClick={() => router.push(`/battles/${id}`)}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
          >
            対戦ルームに戻る
          </button>
        </div>
      ) : null}
    </main>
  );
}
