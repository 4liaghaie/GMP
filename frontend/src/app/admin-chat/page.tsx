"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Headphones,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { SupportChatPanel } from "@/components/support-chat-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMe } from "@/lib/auth-api";
import {
  getAdminSupportConversations,
  type SupportConversation,
} from "@/lib/support-chat";
import { cn } from "@/lib/utils";

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminChatPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [conversations, setConversations] = React.useState<
    SupportConversation[]
  >([]);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
    null,
  );
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "admin") {
          router.replace("/forbidden");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  React.useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
        const items = await getAdminSupportConversations();
        if (cancelled) return;
        setConversations(items);
        const requestedUserId = Number(
          new URLSearchParams(window.location.search).get("search"),
        );
        const requestedExists = items.some(
          (item) => item.user_id === requestedUserId,
        );
        setSelectedUserId(
          (current) =>
            current ??
            (requestedExists ? requestedUserId : items[0]?.user_id ?? null),
        );
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت گفتگوهای پشتیبانی",
          );
        }
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    }

    load();
    const interval = window.setInterval(() => load(true), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [ready]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = conversations.filter((conversation) => {
    if (!normalizedQuery) return true;
    return [
      conversation.username,
      conversation.full_name,
      conversation.phone,
      conversation.email,
    ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
  });
  const selected = conversations.find(
    (conversation) => conversation.user_id === selectedUserId,
  );

  if (!ready) return null;

  return (
    <main dir="rtl" className="mx-auto w-full max-w-7xl px-4 py-8 text-right">
      <PageHeader
        eyebrow="مدیریت"
        title="گفتگوهای پشتیبانی"
        description="پیام کاربران را مشاهده کنید و مستقیما از داخل سامانه پاسخ دهید."
        icon={<Headphones className="h-6 w-6" />}
        accentClassName="bg-[#078e9d]"
        actions={
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="rounded-xl"
          >
            <RefreshCw className="h-4 w-4" />
            بروزرسانی
          </Button>
        }
      />

      {error ? (
        <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid min-h-[600px] overflow-hidden rounded-2xl border bg-background shadow-sm lg:grid-cols-[330px_1fr]">
        <aside className="border-b lg:border-b-0 lg:border-l">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجوی کاربر..."
                className="h-10 rounded-xl pr-9"
              />
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto p-2">
            {loading ? (
              <div className="grid h-48 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length ? (
              filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedUserId(conversation.user_id)}
                  className={cn(
                    "mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-right transition",
                    selectedUserId === conversation.user_id
                      ? "bg-primary/10"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <strong className="truncate text-sm">
                        {conversation.full_name || conversation.username}
                      </strong>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {conversation.last_message?.body || "بدون پیام"}
                      </span>
                      {conversation.unread_count ? (
                        <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                          {conversation.unread_count.toLocaleString("fa-IR")}
                        </Badge>
                      ) : null}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-12 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  گفتگویی پیدا نشد.
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 p-3 sm:p-5">
          {selectedUserId ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold">
                    {selected?.full_name || selected?.username}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {[selected?.username, selected?.phone, selected?.email]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
              </div>
              <SupportChatPanel adminUserId={selectedUserId} />
            </>
          ) : (
            <div className="grid h-full min-h-96 place-items-center text-center">
              <div>
                <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium">یک گفتگو را انتخاب کنید</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
