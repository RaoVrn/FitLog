import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "FitLog — Track Your Fitness",
  description: "A minimal, modern fitness tracker to log diet, exercises, and monitor your health goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen`}
      >
        <AuthProvider>
          <Navbar />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1e293b",
                color: "#e2e8f0",
                border: "1px solid #334155",
                borderRadius: "12px",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#0f172a" } },
              error:   { iconTheme: { primary: "#f87171", secondary: "#0f172a" } },
            }}
          />
          <main className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
