"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import NeedsMarketplaceList from "@/components/marketplace/needs-list";

export default function NeedsMarketplacePage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    if (!access || !refresh) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;
  return <NeedsMarketplaceList />;
}
