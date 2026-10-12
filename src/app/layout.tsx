import type { Metadata, Viewport } from "next";
import SupabaseSyncProvider from "@/components/SupabaseSyncProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ぼうけんルート - ミッション管理アプリ",
  description: "ASD/ADHDのお子様向け、自己肯定感を高めるためのミッション管理アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ぼうけんルート",
  },
};

export const viewport: Viewport = {
  themeColor: "#F9F9FB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased min-h-screen bg-background-light text-text-main">
        <SupabaseSyncProvider>
          <main className="max-w-md mx-auto min-h-screen shadow-lg bg-white relative flex flex-col">
            {children}
          </main>
        </SupabaseSyncProvider>
      </body>
    </html>
  );
}
