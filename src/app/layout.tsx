import "@/styles/globals.css";

import { Instrument_Serif } from "next/font/google";

const serif = Instrument_Serif({
  weight: "400",
  variable: "--font-serif",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="theme-color" content="#fff" />
      <body className={`antialiased ${serif.variable}`}>{children}</body>
    </html>
  );
}
