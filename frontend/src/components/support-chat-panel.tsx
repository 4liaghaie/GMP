"use client";

import * as React from "react";
import Link from "next/link";
import { Headphones, Loader2, MessageSquare, Send } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getAdminSupportMessages,
  getSupportMessages,
  sendAdminSupportMessage,
  sendSupportMessage,
  type SupportMessage,
} from "@/lib/support-chat";

type SupportChatPanelProps = {
  adminUserId?: number;
  relatedModel?: SupportMessage["related_model"];
  relatedUuid?: string;
  className?: string;
  compact?: boolean;
};

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function referenceLabel(message: SupportMessage) {
  if (!message.related_uuid) return "";
  if (message.related_model === "registered_order") {
    return `ثبت سفارش ${message.related_uuid}`;
  }
  if (message.related_model === "proforma") {
    return `بار ${message.related_uuid}`;
  }
  return "";
}

export function SupportChatPanel({
  adminUserId,
  relatedModel = "general",
  relatedUuid = "",
  className,
  compact = false,
}: SupportChatPanelProps) {
  const [messages, setMessages] = React.useState<SupportMessage[]>([]);
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [roleReady, setRoleReady] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsAdmin((localStorage.getItem("role") || "") === "admin");
    setRoleReady(true);
  }, []);

  React.useEffect(() => {
    if (!roleReady) return;
    if (isAdmin && !adminUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load(silent = false) {
      if (!silent) setLoading(true);
      try {
        const next =
          adminUserId !== undefined
            ? await getAdminSupportMessages(adminUserId)
            : await getSupportMessages();
        if (!cancelled) {
          setMessages(next);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "خطا در دریافت پیام‌ها");
        }
      } finally {
        if (!cancelled && !silent) setLoading(false);
      }
    }

    load();
    const interval = window.setInterval(() => load(true), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [adminUserId, isAdmin, roleReady]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  async function submitMessage() {
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const payload = {
        body: text,
        related_model: relatedModel,
        related_uuid: relatedUuid,
      };
      const message =
        adminUserId !== undefined
          ? await sendAdminSupportMessage(adminUserId, payload)
          : await sendSupportMessage(payload);
      setMessages((current) => [...current, message]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  }

  if (isAdmin && !adminUserId) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed bg-muted/30 p-5 text-center",
          className,
        )}
      >
        <Headphones className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-3 text-sm font-semibold">صندوق گفتگوی پشتیبانی</p>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          برای مشاهده و پاسخ به پیام کاربران وارد پنل گفتگو شوید.
        </p>
        <Button asChild className="mt-4 rounded-xl">
          <Link href="/admin-chat">مشاهده گفتگوها</Link>
        </Button>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-background",
        className,
      )}
      dir="rtl"
    >
      <header className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Headphones className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold">
            {adminUserId ? "پاسخ به کاربر" : "گفتگو با پشتیبانی"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {adminUserId
              ? "این گفتگو فقط میان مدیران و این کاربر است."
              : "پیام‌های شما فقط برای مدیران GMP نمایش داده می‌شود."}
          </p>
        </div>
      </header>

      <div
        className={cn(
          "space-y-3 overflow-y-auto bg-slate-50/60 p-4 dark:bg-slate-950/30",
          compact ? "h-64" : "h-[420px]",
        )}
      >
        {loading ? (
          <div className="grid h-full place-items-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length ? (
          messages.map((message) => {
            const reference = referenceLabel(message);
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.is_mine ? "justify-start" : "justify-end",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                    message.is_mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border bg-background",
                  )}
                >
                  {reference ? (
                    <div
                      className={cn(
                        "mb-1.5 text-[10px]",
                        message.is_mine
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {reference}
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words leading-6">
                    {message.body}
                  </p>
                  <div
                    className={cn(
                      "mt-1 text-[10px]",
                      message.is_mine
                        ? "text-primary-foreground/65"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div>
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">هنوز پیامی ارسال نشده است</p>
              <p className="mt-1 text-xs text-muted-foreground">
                پیام خود را برای تیم پشتیبانی بنویسید.
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="space-y-2 border-t p-3">
        {error ? (
          <Alert variant="destructive" className="py-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                submitMessage();
              }
            }}
            placeholder="پیام خود را بنویسید..."
            maxLength={4000}
            rows={2}
            className="min-h-11 resize-none rounded-xl"
          />
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
            disabled={!body.trim() || sending}
            onClick={submitMessage}
            aria-label="ارسال پیام"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 rotate-180" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          برای ارسال سریع از Ctrl + Enter استفاده کنید.
        </p>
      </div>
    </section>
  );
}
