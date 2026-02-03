import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalonBooker Admin - HairsalonX",
  description: "Admin dashboard voor HairsalonX boekingssysteem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
