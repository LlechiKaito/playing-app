import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/lib/providers";

export const metadata = {
  title: "カラオケ対戦",
  description: "DAM の採点結果で対戦するアプリ",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
