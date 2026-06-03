import type { Metadata } from "next";
import { createReadonlyClient } from "veild-sdk";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  try {
    const client = createReadonlyClient();
    const { addr, creator } = await client.getCreatorByUsername(params.username);

    if (!addr || addr === "0x0000000000000000000000000000000000000000" || !creator.isActive) {
      return {
        title: "Creator not found — Veild",
        description: "This creator hasn't joined Veild yet.",
      };
    }

    return {
      title: `Ask ${creator.name} anything — Veild`,
      description: creator.bio || `Send ${creator.name} an anonymous message on Veild.`,
      openGraph: {
        title: `Ask ${creator.name} anything`,
        description: creator.bio,
        type: "profile",
      },
    };
  } catch {
    return {
      title: "Veild — Anonymous Messages for Creators",
      description: "Your fans have things to say. Anonymously.",
    };
  }
}

export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
