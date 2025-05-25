import "@/styles/globals.css";

import { Caveat } from "next/font/google";

const heading = Caveat({
  weight: "400",
  variable: "--font-heading",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <title>Memories - Danilo Woznica</title>
      <body className={`antialiased ${heading.variable}`}>{children}</body>
    </html>
  );
}
