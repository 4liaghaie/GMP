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
  user?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  order_number?: string | null;
  id?: string | null;
  expire_date?: string | null;
  currency_type?: string | null;
  applicant_name?: string | null;
  sub_total?: string | number | null;
  fee_type?: string | null;
  fee_amount?: string | number | null;
  goods?: Array<{
    price?: string | number | null;
  }> | null;
};

function safeNum(v: unknown) {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number) {
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
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

async function fetchMyOrders(signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  const res = await authFetch(`${API_BASE}/registered-orders/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "Failed to fetch orders.");
  return (
    Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : []
  ) as RegisteredOrderListItem[];
}

async function deleteOrder(uuid: string) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/`,
    { method: "DELETE" },
  );
  if (res.status === 204) return;
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "Failed to delete order.");
}

async function setOrderVerified(uuid: string, verified: boolean) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/verify/`,
    {
      method: "PATCH",
      body: JSON.stringify({ verified }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok)
    throw new Error(data?.detail || "Failed to update verification state.");
  return data as RegisteredOrderListItem;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [items, setItems] = React.useState<RegisteredOrderListItem[]>([]);
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState("user");
  const [deletingUuid, setDeletingUuid] = React.useState<string | null>(null);
  const [verifyingUuid, setVerifyingUuid] = React.useState<string | null>(null);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      router.replace("/login");
      return;
    }
    setRole(localStorage.getItem("role") || "user");
    setReady(true);
  }, [router]);

  const isAdmin = role === "admin";

  const load = React.useCallback(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr("");
    fetchMyOrders(ac.signal)
      .then(setItems)
      .catch((e: any) => setErr(e?.message || "Error"))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const cleanup = load();
    return cleanup;
  }, [ready, load]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((o) =>
      `${o.order_number ?? ""} ${o.id ?? ""} ${o.uuid ?? ""}`
        .toLowerCase()
        .includes(s),
    );
  }, [items, q]);

  async function onDelete(uuid: string) {
    if (!window.confirm("Delete this order?")) return;
    setDeletingUuid(uuid);
    setErr("");
    try {
      await deleteOrder(uuid);
      setItems((prev) => prev.filter((x) => x.uuid !== uuid));
    } catch (e: any) {
      setErr(e?.message || "Delete failed.");
    } finally {
      setDeletingUuid(null);
    }
  }

  async function onToggleVerify(item: RegisteredOrderListItem) {
    const next = !Boolean(item.verified);
    if (!window.confirm(next ? "Verify this order?" : "Remove verification?"))
      return;
    setVerifyingUuid(item.uuid);
    setErr("");
    try {
      const updated = await setOrderVerified(item.uuid, next);
      setItems((prev) =>
        prev.map((x) =>
          x.uuid === item.uuid
            ? { ...x, verified: Boolean(updated.verified) }
            : x,
        ),
      );
    } catch (e: any) {
      setErr(e?.message || "Verification update failed.");
    } finally {
      setVerifyingUuid(null);
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
            {err ? (
              <Alert variant="destructive">
                <AlertTitle>خطا</AlertTitle>
                <AlertDescription>{err}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="جستجو با Order Number / ID / UUID ..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="sm:max-w-[360px]"
              />
              <div className="text-sm text-muted-foreground">
                {loading ? "در حال دریافت..." : `${filtered.length} مورد`}
              </div>
            </div>

            <Separator />

            <div className="overflow-auto rounded-lg border">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-right [&>th]:px-3 [&>th]:py-2">
                    <th>Order#</th>
                    <th>ID</th>
                    <th>انقضا</th>
                    <th>ارز</th>
                    {isAdmin ? <th>متقاضی</th> : null}
                    <th>نوع فی</th>
                    <th>مبلف فی (تومان)</th>
                    {isAdmin ? <th>کاربر</th> : null}
                    {isAdmin ? <th>Email</th> : null}
                    {isAdmin ? <th>Phone</th> : null}
                    {isAdmin ? <th>وضعیت تایید</th> : null}
                    <th>تعداد کالا</th>
                    <th>جمع تقریبی</th>
                    <th className="w-[180px]">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-6 text-center text-muted-foreground"
                        colSpan={isAdmin ? 14 : 8}
                      >
                        موردی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => {
                      const goodsCount = Array.isArray(o.goods)
                        ? o.goods.length
                        : 0;
                      const total = safeNum(o.sub_total);
                      return (
                        <tr
                          key={o.uuid}
                          className="border-t [&>td]:px-3 [&>td]:py-2"
                        >
                          <td className="font-medium">
                            {o.order_number || "-"}
                          </td>
                          <td>{o.id || "-"}</td>
                          <td>{formatExpireDate(o.expire_date)}</td>
                          <td>{o.currency_type || "-"}</td>
                          {isAdmin ? <td>{o.applicant_name || "-"}</td> : null}
                          <td>{o.fee_type || "-"}</td>
                          <td>
                            {safeNum(o.fee_amount)
                              ? fmt(safeNum(o.fee_amount))
                              : "-"}
                          </td>
                          {isAdmin ? <td>{o.user || "-"}</td> : null}
                          {isAdmin ? <td>{o.user_email || "-"}</td> : null}
                          {isAdmin ? <td>{o.user_phone || "-"}</td> : null}
                          {isAdmin ? (
                            <td>
                              {o.verified ? (
                                <span className="text-emerald-700">
                                  تایید شده
                                </span>
                              ) : (
                                <span className="text-amber-700">
                                  در انتظار تایید
                                </span>
                              )}
                            </td>
                          ) : null}
                          <td>{goodsCount || "-"}</td>
                          <td>{total ? fmt(total) : "-"}</td>
                          <td>
                            <div className="flex gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  href={`/my-orders/${encodeURIComponent(o.uuid)}`}
                                >
                                  ویرایش
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onDelete(o.uuid)}
                                disabled={deletingUuid === o.uuid}
                              >
                                {deletingUuid === o.uuid ? "..." : "حذف"}
                              </Button>
                              {isAdmin ? (
                                <Button
                                  size="sm"
                                  variant={o.verified ? "outline" : "secondary"}
                                  onClick={() => onToggleVerify(o)}
                                  disabled={verifyingUuid === o.uuid}
                                >
                                  {verifyingUuid === o.uuid
                                    ? "..."
                                    : o.verified
                                      ? "لغو تایید"
                                      : "تایید"}
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
