import type { Metadata, Viewport } from "next";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Veild",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👁️</text></svg>"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta
          name="talentapp:project_verification"
          content="23966ed1b3b32e7785e33f7ec76f15390a10ad3ccfe4cb22af4368514a0bdc7b8ffcced5974c569221ec666f4e189e7597f8aafe96defa9cb6fc6a5b9a175686"
        />
      </head>
      <body
        className={`${inter.className} bg-[#0a0a0a] text-white antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
