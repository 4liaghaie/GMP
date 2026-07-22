import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://gomrokmp.com",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://gomrokmp.com/about",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://gomrokmp.com/how-it-works",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
