import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://veild.vercel.app";

  const staticRoutes = [
    { url: base,                  changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/discover`,    changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/leaderboard`, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${base}/governance`,  changeFrequency: "hourly",  priority: 0.7 },
    { url: `${base}/auctions`,    changeFrequency: "hourly",  priority: 0.7 },
    { url: `${base}/staking`,     changeFrequency: "weekly",  priority: 0.5 },
    { url: `${base}/referral`,    changeFrequency: "monthly", priority: 0.4 },
  ] as const;

  return staticRoutes.map((r) => ({ ...r, lastModified: new Date() }));
}
