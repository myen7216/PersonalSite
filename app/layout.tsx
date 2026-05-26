import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Michael's Fridge",
  description: "An animated personal website staged as an ominous game fridge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
