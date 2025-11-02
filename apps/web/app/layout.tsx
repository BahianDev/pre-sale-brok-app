import "../styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import WalletProvider from "@/components/wallet/Provider";

export const metadata: Metadata = {
  title: "Solana Presale",
  description: "Presale dashboard built with Next.js and Anchor"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}> 
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <WalletProvider>{children}</WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
