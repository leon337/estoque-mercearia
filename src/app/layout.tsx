import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estoque Mercearia",
  description: "Controle simples e rastreável de estoque para pequena mercearia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
