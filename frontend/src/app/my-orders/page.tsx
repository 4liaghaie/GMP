"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, PlusCircle, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { authFetch } from "@/lib/auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type RegisteredOrderListItem = {
  uuid: string;
  verified?: boolean;
  rejected?: boolean;
  rejection_reason?: string | null;
  order_number?: string | null;
  id?: string | number | null;
  expire_date?: string | null;
  currency_type?: string | null;
  sub_total?: string | number | null;
  fee_type?: string | null;
  fee_amount?: string | number | null;
  goods?: Array<{ price?: string | number | null }> | null;
};

function safeNum(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(value: unknown) {
  const n = safeNum(value);
  return n ? n.toLocaleString("fa-IR", { maximumFractionDigits: 2 }) : "-";
}

function formatExpireDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw);
  if (!match) return raw;
  const year = Number(match[1]);
  if (year < 1700) return raw;
  const date = new Date(year, Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return raw;
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const jy = parts.find((part) => part.type === "year")?.value ?? "";
  const jm = parts.find((part) => part.type === "month")?.value ?? "";
  const jd = parts.find((part) => part.type === "day")?.value ?? "";
  return `${jy}/${jm}/${jd}`;
}

function statusText(item: RegisteredOrderListItem) {
  if (item.rejected)
    return item.rejection_reason
      ? `رد شده: ${item.rejection_reason}`
      : "رد شده";
  if (item.verified) return "تایید شده";
  return "در انتظار تایید";
}

async function fetchMyOrders(signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است.");
  const res = await authFetch(`${API_BASE}/registered-orders/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت ثبت سفارش‌ها");
  return (
    Array.isArray(data) ? data : data?.results || []
  ) as RegisteredOrderListItem[];
}

async function deleteOrder(uuid: string) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است.");
  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/`,
    {
      method: "DELETE",
    },
  );
  if (res.status === 204) return;
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در حذف ثبت سفارش");
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState<RegisteredOrderListItem[]>([]);
  const [query, setQuery] = React.useState("");
  const [deletingUuid, setDeletingUuid] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const load = React.useCallback(() => {
    const ac = new AbortController();
    setLoading(true);
    setError("");
    fetchMyOrders(ac.signal)
      .then(setItems)
      .catch((err: any) => setError(err?.message || "خطا"))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const cleanup = load();
    return cleanup;
  }, [ready, load]);

  const filtered = React.useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return items;
    return items.filter((item) =>
      `${item.order_number ?? ""} ${item.id ?? ""} ${item.uuid ?? ""}`
        .toLowerCase()
        .includes(text),
    );
  }, [items, query]);

  async function onDelete(uuid: string) {
    if (!window.confirm("این ثبت سفارش حذف شود؟")) return;
    setDeletingUuid(uuid);
    setError("");
    try {
      await deleteOrder(uuid);
      setItems((prev) => prev.filter((item) => item.uuid !== uuid));
    } catch (err: any) {
      setError(err?.message || "خطا در حذف");
    } finally {
      setDeletingUuid(null);
    }
  }

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader
          eyebrow="مدیریت"
          title="ثبت سفارش‌های من"
          description="لیست ثبت سفارش‌هایی که با حساب شما ایجاد شده‌اند."
          icon={<ClipboardList className="h-6 w-6" />}
          accentClassName="bg-emerald-600"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/add-order")}
              >
                <PlusCircle className="h-4 w-4" />
                ایجاد سفارش
              </Button>
              <Button variant="outline" onClick={() => load()}>
                <RefreshCw className="h-4 w-4" />
                بروزرسانی
              </Button>
            </>
          }
        />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">لیست</CardTitle>
            <CardDescription>
              برای ویرایش روی دکمه ویرایش بزنید.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>خطا</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="جستجو با شناسه یا UUID..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="sm:max-w-[360px]"
              />
              <div className="text-sm text-muted-foreground">
                {loading ? "در حال دریافت..." : `${filtered.length} مورد`}
              </div>
            </div>

            <Separator />

            <div className="overflow-auto rounded-lg border">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-right [&>th]:px-3 [&>th]:py-2">
                    <th>شناسه</th>
                    <th>انقضا</th>
                    <th>ارز</th>
                    <th>نوع فی</th>
                    <th>مبلغ فی (تومان) </th>
                    <th>وضعیت تایید</th>
                    <th>تعداد کالا</th>
                    <th>جمع تقریبی</th>
                    <th className="w-[160px]">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-muted-foreground"
                        colSpan={9}
                      >
                        موردی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr
                        key={item.uuid}
                        className="border-t [&>td]:px-3 [&>td]:py-2"
                      >
                        <td className="font-medium">{item.id || item.uuid}</td>
                        <td>{formatExpireDate(item.expire_date)}</td>
                        <td>{item.currency_type || "-"}</td>
                        <td>{item.fee_type || "-"}</td>
                        <td>{fmt(item.fee_amount)}</td>
                        <td>{statusText(item)}</td>
                        <td>
                          {Array.isArray(item.goods) ? item.goods.length : "-"}
                        </td>
                        <td>{fmt(item.sub_total)}</td>
                        <td>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={`/my-orders/${encodeURIComponent(item.uuid)}`}
                              >
                                ویرایش
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDelete(item.uuid)}
                              disabled={deletingUuid === item.uuid}
                            >
                              {deletingUuid === item.uuid ? "..." : "حذف"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
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
