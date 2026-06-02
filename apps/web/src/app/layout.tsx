import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Veild — Anonymous Messages for Creators",
  description:
    "Your fans have things to say. Anonymously. Give them a safe place to say it.",
  openGraph: {
    title: "Veild — Anonymous Messages for Creators",
    description: "Your fans have things to say. Anonymously.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👁️</text></svg>" />
      </head>
      <body
        className={`${inter.className} bg-[#0a0a0a] text-white antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
