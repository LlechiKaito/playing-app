"use client";
import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIGNUP } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth/context";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signup, { loading }] = useMutation(SIGNUP);
  const { setSession } = useAuth();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await signup({ variables: { email, password, nickname } });
      if (r.data?.signup) {
        setSession({ token: r.data.signup.token, user: r.data.signup.user });
        router.push("/mypage");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-zinc-900 p-8 rounded-lg">
        <h1 className="text-2xl font-bold">新規登録</h1>
        <input
          type="text"
          required
          placeholder="ニックネーム"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-800 rounded text-white"
        />
        <input
          type="email"
          required
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-800 rounded text-white"
        />
        <input
          type="password"
          required
          placeholder="password (8文字以上)"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-800 rounded text-white"
        />
        {error ? <p className="text-red-400 text-sm">⚠ {error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-pink-500 hover:bg-pink-400 rounded font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "登録"}
        </button>
        <p className="text-sm text-center">
          既にアカウントあり？ <Link href="/login" className="text-pink-300 underline">ログイン</Link>
        </p>
      </form>
    </main>
  );
}
