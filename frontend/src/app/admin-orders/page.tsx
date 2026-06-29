"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, RefreshCw, Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authFetch } from "@/lib/auth-api";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type AdminOrder = {
  uuid: string;
  id?: string | number | null;
  verified?: boolean;
  rejected?: boolean;
  rejection_reason?: string | null;
  order_number?: string | null;
  order_pdf?: string | null;
  user?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  total_value?: string | number | null;
  freight_price?: string | number | null;
  sub_total?: string | number | null;
  currency_type?: string | null;
  fee_type?: string | null;
  fee_amount?: string | number | null;
  applicant_name?: string | null;
  currency_supply?: string | null;
  bank_name?: string | null;
  bank_branch_display?: string | null;
  payment_instrument?: string | null;
  expire_date?: string | null;
  goods?: Array<{
    uuid?: string;
    description?: string;
    hs_code?: string;
    goods_status?: string;
    price?: string | number | null;
  }> | null;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "همه" },
  { value: "pending", label: "در انتظار" },
  { value: "approved", label: "تایید شده" },
  { value: "rejected", label: "رد شده" },
];

function fmt(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value ? String(value) : "-";
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function safeText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function resolveFileUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!API_BASE) return raw;
  try {
    return new URL(raw, API_BASE).toString();
  } catch {
    return raw;
  }
}

function orderStatus(item: AdminOrder): Exclude<StatusFilter, "all"> {
  if (item.rejected) return "rejected";
  if (item.verified) return "approved";
  return "pending";
}

function statusLabel(item: AdminOrder) {
  const status = orderStatus(item);
  if (status === "approved") return "تایید شده";
  if (status === "rejected") return "رد شده";
  return "در انتظار تایید";
}

function statusVariant(
  item: AdminOrder,
): "default" | "secondary" | "destructive" {
  const status = orderStatus(item);
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

async function fetchAdminOrders(signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است.");
  const res = await authFetch(`${API_BASE}/admin/registered-orders/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت ثبت سفارش‌ها");
  return (Array.isArray(data) ? data : data?.results || []) as AdminOrder[];
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

async function setOrderModeration(
  uuid: string,
  status: "approved" | "rejected" | "pending",
  reason = "",
) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است.");
  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/verify/`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در تغییر وضعیت تایید");
  return data as AdminOrder;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [items, setItems] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [busyUuid, setBusyUuid] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.replace("/login");
      return;
    }
    if ((localStorage.getItem("role") || "") !== "admin") {
      router.replace("/forbidden");
      return;
    }
    setQuery(new URLSearchParams(window.location.search).get("search") || "");
    setReady(true);
  }, [router]);

  const load = React.useCallback(() => {
    const ac = new AbortController();
    setLoading(true);
    setError("");
    fetchAdminOrders(ac.signal)
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

  const counts = React.useMemo(
    () => ({
      all: items.length,
      pending: items.filter((item) => orderStatus(item) === "pending").length,
      approved: items.filter((item) => orderStatus(item) === "approved").length,
      rejected: items.filter((item) => orderStatus(item) === "rejected").length,
    }),
    [items],
  );

  const filtered = React.useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && orderStatus(item) !== status) return false;
      if (!text) return true;
      return `${item.uuid ?? ""} ${item.order_number ?? ""} ${item.user ?? ""} ${item.user_email ?? ""} ${item.user_phone ?? ""} ${item.applicant_name ?? ""} ${item.bank_name ?? ""}`
        .toLowerCase()
        .includes(text);
    });
  }, [items, query, status]);

  async function moderate(
    item: AdminOrder,
    nextStatus: "approved" | "rejected" | "pending",
  ) {
    const reason =
      nextStatus === "rejected"
        ? window.prompt(
            "دلیل رد شدن را وارد کنید:",
            item.rejection_reason || "",
          ) || ""
        : "";
    if (!window.confirm("وضعیت این ثبت سفارش تغییر کند؟")) return;
    setBusyUuid(item.uuid);
    setError("");
    try {
      const updated = await setOrderModeration(item.uuid, nextStatus, reason);
      setItems((prev) =>
        prev.map((row) =>
          row.uuid === item.uuid ? { ...row, ...updated } : row,
        ),
      );
    } catch (err: any) {
      setError(err?.message || "خطا در تغییر وضعیت");
    } finally {
      setBusyUuid(null);
    }
  }

  async function remove(item: AdminOrder) {
    if (!window.confirm("این ثبت سفارش حذف شود؟")) return;
    setBusyUuid(item.uuid);
    setError("");
    try {
      await deleteOrder(item.uuid);
      setItems((prev) => prev.filter((row) => row.uuid !== item.uuid));
    } catch (err: any) {
      setError(err?.message || "خطا در حذف");
    } finally {
      setBusyUuid(null);
    }
  }

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="پنل مدیر"
          title="مدیریت ثبت سفارش‌ها"
          description="ردیف‌های فشرده برای بررسی سریع؛ جزئیات کامل داخل پنجره باز می‌شود."
          icon={<ClipboardList className="h-6 w-6" />}
          accentClassName="bg-slate-900"
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/add-order">ایجاد ثبت سفارش</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => load()}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
                بروزرسانی
              </Button>
            </>
          }
        />

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-2 sm:grid-cols-4">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatus(item.value)}
              className={cn(
                "rounded-2xl border bg-card px-4 py-3 text-right transition hover:bg-muted/50",
                status === item.value && "border-primary bg-primary/5",
              )}
            >
              <div className="text-lg font-bold tabular-nums">
                {fmt(counts[item.value])}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </button>
          ))}
        </section>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-[460px]">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="جستجو با کاربر، ایمیل، متقاضی، بانک، UUID یا شماره سفارش..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pr-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {loading ? "در حال دریافت..." : `${fmt(filtered.length)} مورد`}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-right [&>th]:px-3 [&>th]:py-2">
                      <th>وضعیت</th>
                      <th>شماره / UUID</th>
                      <th>کاربر</th>
                      <th>متقاضی</th>
                      <th>ارز</th>
                      <th>جمع</th>
                      <th>بانک</th>
                      <th>کالا</th>
                      <th className="w-[360px]">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          موردی با این فیلترها پیدا نشد.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item) => (
                        <tr
                          key={item.uuid}
                          className="border-t [&>td]:px-3 [&>td]:py-2"
                        >
                          <td>
                            <Badge variant={statusVariant(item)}>
                              {statusLabel(item)}
                            </Badge>
                          </td>
                          <td>
                            <div className="font-medium">
                              {item.order_number || item.id || "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.uuid}
                            </div>
                          </td>
                          <td>
                            <div>{safeText(item.user)}</div>
                            <div className="text-xs text-muted-foreground">
                              {safeText(item.user_phone)}
                            </div>
                          </td>
                          <td>{safeText(item.applicant_name)}</td>
                          <td>{safeText(item.currency_type)}</td>
                          <td className="tabular-nums">
                            {fmt(item.sub_total)}
                          </td>
                          <td>{safeText(item.bank_name)}</td>
                          <td>{fmt(item.goods?.length || 0)}</td>
                          <td>
                            <RowActions
                              item={item}
                              busy={busyUuid === item.uuid}
                              onModerate={moderate}
                              onRemove={remove}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function RowActions(props: {
  item: AdminOrder;
  busy: boolean;
  onModerate: (
    item: AdminOrder,
    status: "approved" | "rejected" | "pending",
  ) => void;
  onRemove: (item: AdminOrder) => void;
}) {
  const fileUrl = resolveFileUrl(props.item.order_pdf);
  return (
    <div className="flex flex-wrap gap-1.5">
      <OrderDetailsDialog item={props.item} fileUrl={fileUrl} />
      <Button asChild size="sm" variant="outline">
        <Link href={`/my-orders/${encodeURIComponent(props.item.uuid)}`}>
          ویرایش
        </Link>
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={props.busy}
        onClick={() => props.onModerate(props.item, "approved")}
      >
        تایید
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={props.busy}
        onClick={() => props.onModerate(props.item, "pending")}
      >
        انتظار
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={props.busy}
        onClick={() => props.onModerate(props.item, "rejected")}
      >
        رد
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={props.busy}
        onClick={() => props.onRemove(props.item)}
      >
        حذف
      </Button>
    </div>
  );
}

function OrderDetailsDialog({
  item,
  fileUrl,
}: {
  item: AdminOrder;
  fileUrl: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          جزئیات
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-hidden p-0 text-right sm:max-w-5xl [&>button]:left-4 [&>button]:right-auto"
        dir="rtl"
      >
        <div className="border-b bg-background">
          <DialogHeader className="p-5 text-right">
            <DialogTitle className="text-right">جزئیات ثبت سفارش</DialogTitle>
            <DialogDescription className="text-right">
              {item.uuid}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(90dvh-92px)] overflow-y-auto p-5">
          <div className="space-y-4">
            <Card className="overflow-hidden rounded-2xl shadow-sm before:block before:h-1 before:bg-slate-900 before:content-['']">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(item)}>
                        {statusLabel(item)}
                      </Badge>
                      <Badge variant="outline">
                        {safeText(item.currency_type)}
                      </Badge>
                      <Badge variant="outline">
                        {fmt(item.goods?.length || 0)} کالا
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xl font-bold">
                        {safeText(item.order_number || item.id)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        متقاضی: {safeText(item.applicant_name)}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                    <Info label="ارزش کالا" value={fmt(item.total_value)} />
                    <Info label="کرایه حمل" value={fmt(item.freight_price)} />
                    <Info label="جمع کل" value={fmt(item.sub_total)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {item.rejection_reason ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                دلیل رد: {item.rejection_reason}
              </div>
            ) : null}

            <Tabs defaultValue="goods" className="w-full" dir="rtl">
              <div className="w-full overflow-x-auto pb-1">
                <TabsList className="flex min-w-max justify-start rounded-2xl">
                  <TabsTrigger className="rounded-2xl px-5" value="goods">
                    کالاها
                  </TabsTrigger>
                  <TabsTrigger className="rounded-2xl px-5" value="summary">
                    مالی
                  </TabsTrigger>
                  <TabsTrigger className="rounded-2xl px-5" value="meta">
                    اطلاعات
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="goods" className="mt-4">
                <div className="grid gap-2 md:grid-cols-2">
                  {item.goods?.length ? (
                    item.goods.map((good) => (
                      <div
                        key={good.uuid || good.description}
                        className="rounded-2xl border bg-card p-3 text-sm"
                      >
                        <div className="font-medium">
                          {safeText(good.description)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          HS {safeText(good.hs_code)}
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                          <span>وضعیت: {safeText(good.goods_status)}</span>
                          <span>قیمت: {fmt(good.price)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      کالایی ثبت نشده است.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-2">
                    <Info
                      label="نوع ارز"
                      value={safeText(item.currency_type)}
                    />
                    <Info label="نوع فی" value={safeText(item.fee_type)} />
                    <Info
                      label="مبلغ فی (تومان)"
                      value={fmt(item.fee_amount)}
                    />
                    <Info
                      label="تامین ارز"
                      value={safeText(item.currency_supply)}
                    />
                    <Info label="ارزش کالا" value={fmt(item.total_value)} />
                    <Info label="کرایه" value={fmt(item.freight_price)} />
                    <Info label="جمع کل" value={fmt(item.sub_total)} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="meta" className="mt-4">
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-2">
                    <Info label="کاربر" value={safeText(item.user)} />
                    <Info label="ایمیل" value={safeText(item.user_email)} />
                    <Info label="تلفن" value={safeText(item.user_phone)} />
                    <Info label="انقضا" value={safeText(item.expire_date)} />
                    <Info label="بانک" value={safeText(item.bank_name)} />
                    <Info
                      label="شعبه"
                      value={safeText(item.bank_branch_display)}
                    />
                    <Info
                      label="ابزار پرداخت"
                      value={safeText(item.payment_instrument)}
                    />
                    {fileUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        className="h-auto justify-center rounded-2xl p-3"
                      >
                        <a href={fileUrl} target="_blank" rel="noreferrer">
                          مشاهده فایل
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info(props: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-3 text-sm">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="mt-1 break-words font-medium">{props.value}</div>
    </div>
  );
}
