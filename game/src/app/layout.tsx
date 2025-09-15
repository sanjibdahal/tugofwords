import type { Metadata } from "next";
import { Jersey_10 } from "next/font/google";
import "./globals.css";
import { WsProvider } from "./wsproviders";
import { Providers } from "./providers";

const jersey10 = Jersey_10({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Tug Of Keys",
  description: "a fun game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={jersey10.className}>
        <WsProvider><Providers>{children}</Providers></WsProvider>
      </body>
    </html>
  );
}