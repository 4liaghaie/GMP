"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { authFetch } from "@/lib/auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type RegisteredOrderListItem = {
  uuid: string;
  verified?: boolean;
  user?: string | null;
  order_number?: string | null;

  // optional legacy fields
  id?: string | null;

  date?: string | null;
  expire_date?: string | null;
  currency_type?: string | null;
  seller_country?: string | null;
  country_of_origin?: string | null;

  freight_price?: string | number | null;

  goods?: Array<{
    quantity?: string | number | null;
    unit_price?: string | number | null;
  }> | null;
};

function safeNum(v: unknown) {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number) {
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

async function fetchMyOrders(signal?: AbortSignal) {
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const res = await authFetch(`${API_BASE}/registered-orders/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    const msg =
      data?.detail ||
      (typeof data === "object"
        ? JSON.stringify(data)
        : "خطا در دریافت ثبت سفارش‌ها");
    throw new Error(msg);
  }

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  return items as RegisteredOrderListItem[];
}

async function deleteOrder(uuid: string) {
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/`,
    { method: "DELETE" },
  );

  if (res.status === 204) return;

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg =
      data?.detail ||
      (typeof data === "object" ? JSON.stringify(data) : "خطا در حذف");
    throw new Error(msg);
  }
}

async function setOrderVerified(uuid: string, verified: boolean) {
  if (!API_BASE) throw new Error("متغیر NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/verify/`,
    {
      method: "PATCH",
      body: JSON.stringify({ verified }),
    },
  );

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg =
      data?.detail ||
      (typeof data === "object"
        ? JSON.stringify(data)
        : "خطا در تغییر وضعیت تایید");
    throw new Error(msg);
  }

  return data as RegisteredOrderListItem;
}

export default function MyOrdersPage() {
  const router = useRouter();

  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [items, setItems] = React.useState<RegisteredOrderListItem[]>([]);
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState<string>("user");

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
      .catch((e: any) => setErr(e?.message || "خطا"))
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

    return items.filter((o) => {
      const hay =
        `${o.order_number ?? ""} ${o.id ?? ""} ${o.uuid ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [items, q]);

  async function onDelete(uuid: string) {
    const ok = window.confirm("آیا از حذف این ثبت سفارش مطمئن هستید؟");
    if (!ok) return;

    setDeletingUuid(uuid);
    setErr("");
    try {
      await deleteOrder(uuid);
      setItems((prev) => prev.filter((x) => x.uuid !== uuid));
    } catch (e: any) {
      setErr(e?.message || "خطا در حذف");
    } finally {
      setDeletingUuid(null);
    }
  }

  async function onToggleVerify(item: RegisteredOrderListItem) {
    const next = !Boolean(item.verified);
    const question = next
      ? "این سفارش تایید شود؟"
      : "تایید این سفارش لغو شود؟";

    if (!window.confirm(question)) return;

    setVerifyingUuid(item.uuid);
    setErr("");
    try {
      const updated = await setOrderVerified(item.uuid, next);
      setItems((prev) =>
        prev.map((x) =>
          x.uuid === item.uuid ? { ...x, verified: Boolean(updated.verified) } : x,
        ),
      );
    } catch (e: any) {
      setErr(e?.message || "خطا در تغییر وضعیت تایید");
    } finally {
      setVerifyingUuid(null);
    }
  }

  if (!ready) return null;

  return (
    <div dir="rtl" className="">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">ثبت سفارش‌های من</h1>
            <p className="mt-1 text-sm text-muted-foreground leading-6">
              لیست ثبت سفارش‌هایی که با اکانت شما ساخته شده‌اند.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/add-order")}>
              + ایجاد ثبت سفارش
            </Button>
            <Button variant="outline" onClick={() => load()}>
              بروزرسانی
            </Button>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">لیست</CardTitle>
            <CardDescription>
              برای ویرایش روی دکمه ویرایش بزنید.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {err && (
              <Alert variant="destructive">
                <AlertTitle>خطا</AlertTitle>
                <AlertDescription>{err}</AlertDescription>
              </Alert>
            )}

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
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="[&>th]:px-3 [&>th]:py-2 text-right">
                    <th>Order#</th>
                    <th>ID</th>
                    <th>تاریخ</th>
                    <th>انقضا</th>
                    <th>ارز</th>
                    <th>کشور فروشنده</th>
                    {isAdmin && <th>کاربر</th>}
                    {isAdmin && <th>وضعیت تایید</th>}
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
                        colSpan={isAdmin ? 11 : 9}
                      >
                        موردی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => {
                      const goodsCount = Array.isArray(o.goods)
                        ? o.goods.length
                        : 0;
                      const goodsTotal = Array.isArray(o.goods)
                        ? o.goods.reduce(
                            (s, g) =>
                              s + safeNum(g?.quantity) * safeNum(g?.unit_price),
                            0,
                          )
                        : 0;

                      const total = goodsTotal + safeNum(o.freight_price);

                      return (
                        <tr
                          key={o.uuid}
                          className="border-t [&>td]:px-3 [&>td]:py-2"
                        >
                          <td className="font-medium">
                            {o.order_number || "-"}
                          </td>
                          <td>{o.id || "-"}</td>
                          <td>{o.date || "-"}</td>
                          <td>{o.expire_date || "-"}</td>
                          <td>{o.currency_type || "-"}</td>
                          <td>{o.seller_country || "-"}</td>
                          {isAdmin && <td>{o.user || "-"}</td>}
                          {isAdmin && (
                            <td>
                              {o.verified ? (
                                <span className="text-emerald-700">تایید شده</span>
                              ) : (
                                <span className="text-amber-700">در انتظار تایید</span>
                              )}
                            </td>
                          )}
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

                              {isAdmin && (
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
                              )}
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
