"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
  type UserNotification,
} from "@/lib/auth-api";
import { notificationTargetHref } from "@/lib/notification-links";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function fmtDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationsPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<UserNotification[]>([]);
  const [error, setError] = React.useState("");
  const [role, setRole] = React.useState("");

  React.useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    setRole(localStorage.getItem("role") || "");
    setReady(true);
  }, [router]);

  const load = React.useCallback(() => {
    if (!ready) return;
    setLoading(true);
    setError("");
    getNotifications()
      .then(setItems)
      .catch((err: any) => setError(err?.message || "خطا در دریافت اعلان‌ها"))
      .finally(() => setLoading(false));
  }, [ready]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function markRead(item: UserNotification) {
    try {
      const updated = await markNotificationRead(item.id);
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
    } catch (err: any) {
      setError(err?.message || "خطا در بروزرسانی اعلان");
    }
  }

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <PageHeader
          eyebrow="اعلان‌ها"
          title="اعلان‌های حساب"
          description="نتیجه بررسی موارد و پیام‌های جدید پشتیبانی اینجا نمایش داده می‌شود."
          icon={<Bell className="h-6 w-6" />}
          accentClassName="bg-slate-900"
          actions={
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              بروزرسانی
            </Button>
          }
        />

        {error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                در حال دریافت...
              </CardContent>
            </Card>
          ) : items.length ? (
            items.map((item) => (
              <Card
                key={item.id}
                className={!item.read ? "border-primary/50" : ""}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{item.title}</h2>
                        <Badge
                          variant={
                            item.notification_type === "approved"
                              ? "default"
                              : item.notification_type === "message"
                                ? "secondary"
                              : item.notification_type === "submitted"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {item.notification_type === "approved"
                            ? "تایید"
                            : item.notification_type === "message"
                              ? "پیام"
                            : item.notification_type === "submitted"
                              ? "در انتظار بررسی"
                              : "رد"}
                        </Badge>
                        {!item.read ? (
                          <Badge variant="secondary">جدید</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {item.message}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(item.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={notificationTargetHref(item, role)}>
                        {item.notification_type === "message"
                          ? "مشاهده گفتگو"
                          : "مشاهده مورد"}
                      </Link>
                    </Button>
                    {!item.read ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markRead(item)}
                      >
                        <CheckCheck className="h-4 w-4" />
                        خواندم
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                اعلانی وجود ندارد.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
