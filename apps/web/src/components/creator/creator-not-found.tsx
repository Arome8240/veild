import Link from "next/link";
import { Eye, ArrowLeft } from "lucide-react";

interface CreatorNotFoundProps {
  username: string;
}

/**
 * Shown when a /[username] route resolves to an unregistered address.
 */
export function CreatorNotFound({ username }: CreatorNotFoundProps) {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 text-center">
      <Eye className="w-12 h-12 text-muted-foreground/30 mb-4" aria-hidden="true" />
      <h1 className="font-bold text-lg mb-2">@{username} not found</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        This creator hasn&apos;t joined Veild yet or the username doesn&apos;t
        exist on-chain.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to home
      </Link>
    </main>
  );
}
