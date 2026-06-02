import type { Metadata } from "next";
import { getCreatorByUsername, mockCreators } from "@/lib/mockData";

export function generateMetadata({
  params,
}: {
  params: { username: string };
}): Metadata {
  const creator =
    getCreatorByUsername(params.username) ?? mockCreators[0];

  return {
    title: `Send ${creator.name} an anonymous message — Veild`,
    description: `${creator.bio} Ask them anything, anonymously.`,
    openGraph: {
      title: `Ask ${creator.name} anything`,
      description: creator.bio,
      type: "profile",
    },
  };
}

export default function UsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
