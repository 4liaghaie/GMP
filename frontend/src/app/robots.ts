import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin-orders",
        "/admin-proformas",
        "/dashboard",
        "/my-needs",
        "/my-orders",
        "/notifications",
        "/profile",
        "/user-management",
      ],
    },
    sitemap: "https://gomrokmp.com/sitemap.xml",
    host: "https://gomrokmp.com",
  };
}
