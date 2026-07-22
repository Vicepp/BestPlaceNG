import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ConditionalFooter from "@/components/ConditionalChrome";
import FloatingAssistant from "@/components/FloatingAssistant";
import { AuthProvider } from "@/context/AuthContext";
import { getSiteUrl } from "@/lib/siteUrl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "BestPlaceNG — Find the Best Place to Live in Nigeria",
  description:
    "Compare cities across Nigeria by cost of living, safety, climate, schools, and more — and find apartments to rent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
          <FloatingAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
