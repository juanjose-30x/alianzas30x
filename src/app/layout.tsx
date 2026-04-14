import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diagnóstico IA · Tugó x 30X",
  description: "Diagnóstico de adopción de inteligencia artificial para Tugó",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
