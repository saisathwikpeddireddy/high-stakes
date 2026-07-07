import "./globals.css";
import { Cinzel, Inter } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-cinzel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "High-Stakes // Monte Carlo",
  description: "Browser-based single-player AI extraction wager game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
