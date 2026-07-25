"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Headphones } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { SupportChatPanel } from "@/components/support-chat-panel";

export default function SupportChatPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    if ((localStorage.getItem("role") || "") === "admin") {
      router.replace("/admin-chat");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <main dir="rtl" className="mx-auto w-full max-w-4xl px-4 py-8 text-right">
      <PageHeader
        eyebrow="پشتیبانی"
        title="گفتگو با تیم GMP"
        description="پرسش یا مشکل خود را مستقیما برای مدیران سامانه ارسال کنید."
        icon={<Headphones className="h-6 w-6" />}
        accentClassName="bg-[#078e9d]"
      />
      <SupportChatPanel className="mt-6" />
    </main>
  );
}
