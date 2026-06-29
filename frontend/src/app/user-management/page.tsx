"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ShieldCheck, UserCheck, UserMinus, UserX } from "lucide-react";

import {
  getAdminUsers,
  getMe,
  updateAdminUserStatus,
  type AdminUser,
} from "@/lib/auth-api";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const statusOptions = [
  { value: "", label: "همه" },
  { value: "pending", label: "در انتظار تایید" },
  { value: "verified", label: "تایید شده" },
  { value: "rejected", label: "رد شده" },
  { value: "banned", label: "مسدود" },
] as const;

const statusLabel: Record<AdminUser["account_status"], string> = {
  pending: "در انتظار تایید",
  verified: "تایید شده",
  rejected: "رد شده",
  banned: "مسدود",
};

function fmtDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function safeText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function StatusBadge({ status }: { status: AdminUser["account_status"] }) {
  const variant =
    status === "verified"
      ? "default"
      : status === "pending"
        ? "secondary"
        : "destructive";
  return <Badge variant={variant}>{statusLabel[status]}</Badge>;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    getMe()
      .then((me) => {
        if (me.role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        setSearch(new URLSearchParams(window.location.search).get("search") || "");
        setReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const load = React.useCallback(() => {
    if (!ready) return;
    setLoading(true);
    setError("");
    getAdminUsers({ status, search: search.trim() })
      .then(setUsers)
      .catch((err: any) => setError(err?.message || "خطا در دریافت کاربران"))
      .finally(() => setLoading(false));
  }, [ready, search, status]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(
    user: AdminUser,
    nextStatus: AdminUser["account_status"],
  ) {
    const labels = {
      pending: "در انتظار تایید",
      verified: "تایید",
      rejected: "رد",
      banned: "مسدود",
    };
    if (!window.confirm(`وضعیت کاربر ${user.username} به "${labels[nextStatus]}" تغییر کند؟`)) {
      return;
    }

    const note =
      nextStatus === "rejected" || nextStatus === "banned"
        ? window.prompt("توضیح اختیاری برای این تصمیم:", user.account_status_note || "") || ""
        : "";

    setSavingId(user.id);
    setError("");
    try {
      const updated = await updateAdminUserStatus(user.id, {
        account_status: nextStatus,
        note,
      });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
    } catch (err: any) {
      setError(err?.message || "خطا در تغییر وضعیت کاربر");
    } finally {
      setSavingId(null);
    }
  }

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-7xl px-4 py-10">
        <PageHeader
          eyebrow="مدیریت کاربران"
          title="تایید و کنترل کاربران"
          description="درخواست‌های ثبت‌نام را تایید یا رد کنید و کاربران مشکل‌دار را مسدود کنید."
          icon={<ShieldCheck className="h-6 w-6" />}
          accentClassName="bg-slate-900"
          actions={
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              بروزرسانی
            </Button>
          }
        />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">فیلتر کاربران</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>خطا</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
              <div className="space-y-2">
                <label className="text-sm">جستجو</label>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="نام کاربری، ایمیل یا موبایل"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm">وضعیت</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={load} disabled={loading}>
                اعمال
              </Button>
            </div>

            <Separator />

            <div className="overflow-auto rounded-xl border">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-right [&>th]:px-3 [&>th]:py-2">
                    <th>کاربر</th>
                    <th>نام</th>
                    <th>ایمیل</th>
                    <th>موبایل</th>
                    <th>نقش</th>
                    <th>وضعیت</th>
                    <th>ثبت‌نام</th>
                    <th>آخرین ورود</th>
                    <th>توضیح</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-t">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                        در حال دریافت...
                      </td>
                    </tr>
                  ) : users.length ? (
                    users.map((user) => (
                      <tr key={user.id} className="[&>td]:px-3 [&>td]:py-2">
                        <td className="font-medium">{user.username}</td>
                        <td>{safeText(user.full_name)}</td>
                        <td>{safeText(user.email)}</td>
                        <td>{safeText(user.phone)}</td>
                        <td>{safeText(user.role)}</td>
                        <td>
                          <StatusBadge status={user.account_status} />
                        </td>
                        <td>{fmtDate(user.date_joined)}</td>
                        <td>{fmtDate(user.last_login)}</td>
                        <td className="max-w-[180px] truncate">
                          {safeText(user.account_status_note)}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === user.id || user.account_status === "verified"}
                              onClick={() => changeStatus(user, "verified")}
                            >
                              <UserCheck className="h-4 w-4" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingId === user.id || user.account_status === "rejected"}
                              onClick={() => changeStatus(user, "rejected")}
                            >
                              <UserMinus className="h-4 w-4" />
                              رد
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={savingId === user.id || user.account_status === "banned"}
                              onClick={() => changeStatus(user, "banned")}
                            >
                              <UserX className="h-4 w-4" />
                              بن
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                        کاربری پیدا نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
