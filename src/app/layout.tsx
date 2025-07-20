import "@/styles/globals.css";

import { Instrument_Serif } from "next/font/google";

const heading = Instrument_Serif({
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
      <link rel="icon" href="/public/favicon.png" />
    </html>
  );
}
