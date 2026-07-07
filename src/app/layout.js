import "./globals.css";

export const metadata = {
  title: "High-Stakes // Vegas on Steroids",
  description: "Browser-based single-player AI extraction wager game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
