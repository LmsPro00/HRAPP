import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Screening - Leone Master School",
  description: "Gestionale HR per lo screening e il contatto dei candidati",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
