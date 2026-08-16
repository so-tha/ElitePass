import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ElitePass — Ingressos Premium para Shows e Eventos",
  description:
    "Compre ingressos para os melhores shows e eventos com segurança e praticidade. ElitePass: sua experiência começa aqui.",
  keywords: ["ingressos", "shows", "eventos", "ElitePass", "comprar ingresso"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
