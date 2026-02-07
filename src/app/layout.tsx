import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NES DAW",
  description: "Browser-based NES music workstation with authentic Mega Man era sounds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
