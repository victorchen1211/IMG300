import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "IMG300",
  description: "IMG300 - Brand asset generator created by Victor Chen.",
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
