import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Veild — Anonymous Messages for Creators",
    template: "%s — Veild",
  },
  description:
    "Your fans have things to say. Anonymously. Give them a safe place to say it.",
  openGraph: {
    title: "Veild — Anonymous Messages for Creators",
    description: "Your fans have things to say. Anonymously.",
    type: "website",
    siteName: "Veild",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Veild",
  },
  metadataBase: new URL("https://veild.app"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta
          name="talentapp:project_verification"
          content="23966ed1b3b32e7785e33f7ec76f15390a10ad3ccfe4cb22af4368514a0bdc7b8ffcced5974c569221ec666f4e189e7597f8aafe96defa9cb6fc6a5b9a175686"
        />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased min-h-screen`}>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <ThemeProvider>
          <WalletProvider>
            <main id="main-content">{children}</main>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
