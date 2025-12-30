import "@/styles/globals.css";

import { Nunito_Sans } from "next/font/google";

const inter = Nunito_Sans({
  weight: "400",
  variable: "--font-display",
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
      <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      <body className={`antialiased ${inter.variable}`}>{children}</body>
    </html>
  );
}
