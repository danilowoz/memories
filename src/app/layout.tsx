import "@/styles/globals.css";

import { Proza_Libre } from "next/font/google";

const prozaLibre = Proza_Libre({
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
      <body
        className={`antialiased ${prozaLibre.variable}`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
