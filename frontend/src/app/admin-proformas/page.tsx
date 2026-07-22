"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, RefreshCw, Search } from "lucide-react";

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
import { countries } from "@/lib/countryList";
import { iranCustoms } from "@/lib/customsList";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type ProformaGood = {
  uuid?: string;
  description?: string;
  hs_code?: string;
  goods_status?: string;
  quantity?: string | number;
  unit?: string;
  manufacturer_country?: string;
  price?: string | number;
  nw_kg?: string | number;
  gw_kg?: string | number;
  line_total?: string | number;
};

type AdminProforma = {
  uuid: string;
  id: number;
  user?: string | null;
  created_at?: string | null;
  verified?: boolean;
  rejected?: boolean;
  rejection_reason?: string | null;
  proforma_file?: string | null;
  status?: string | null;
  country_of_origin?: string | null;
  freight_price?: string | number | null;
  currency_type?: string | null;
  fee_type?: string | null;
  fee_amount?: string | number | null;
  entry_border?: string | null;
  customs?: string | null;
  means_of_transport?: string | null;
  goods?: ProformaGood[];
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

function splitMultiValue(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function countryLabel(value: unknown) {
  const values = splitMultiValue(value);
  if (!values.length) return "-";
  return values
    .map((code) => {
      const country = countries.find(
        (item) => item.code.toLowerCase() === code.toLowerCase(),
      );
      return country ? `${country.persianName} (${country.code})` : code;
    })
    .join("، ");
}

function customsLabel(value: unknown) {
  const values = splitMultiValue(value);
  if (!values.length) return "-";
  return values
    .map((code) => {
      if (code === "ALL_CUSTOMS") return "تمام گمرکات";
      const customs = iranCustoms.find(
        (item) => String(item.ctmVCodeInt) === code,
      );
      return customs ? `${customs.ctmNameStr} (${customs.ctmVCodeInt})` : code;
    })
    .join("، ");
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

function proformaStatus(item: AdminProforma): Exclude<StatusFilter, "all"> {
  if (item.rejected) return "rejected";
  if (item.verified) return "approved";
  return "pending";
}

function statusLabel(item: AdminProforma) {
  const status = proformaStatus(item);
  if (status === "approved") return "تایید شده";
  if (status === "rejected") return "رد شده";
  return "در انتظار تایید";
}

function statusVariant(
  item: AdminProforma,
): "default" | "secondary" | "destructive" {
  const status = proformaStatus(item);
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

function totalGoodsValue(item: AdminProforma) {
  return (item.goods || []).reduce((sum, good) => {
    const line = Number(good.line_total ?? 0);
    if (Number.isFinite(line) && line > 0) return sum + line;
    const quantity = Number(good.quantity ?? 0);
    const price = Number(good.price ?? 0);
    return sum + (Number.isFinite(quantity * price) ? quantity * price : 0);
  }, 0);
}

async function fetchAdminProformas(signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است.");
  const res = await authFetch(`${API_BASE}/admin/goods-needs/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت بارها");
  return (Array.isArray(data) ? data : data?.results || []) as AdminProforma[];
}

async function deleteProforma(uuid: string) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است.");
  const res = await authFetch(
    `${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/`,
    {
      method: "DELETE",
    },
  );
  if (res.status === 204) return;
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در حذف بار");
}

async function setProformaModeration(
  uuid: string,
  status: "approved" | "rejected" | "pending",
  reason = "",
) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است.");
  const res = await authFetch(
    `${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/verify/`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در تغییر وضعیت تایید");
  return data as AdminProforma;
}

export default function AdminProformasPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [items, setItems] = React.useState<AdminProforma[]>([]);
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
    fetchAdminProformas(ac.signal)
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
      pending: items.filter((item) => proformaStatus(item) === "pending")
        .length,
      approved: items.filter((item) => proformaStatus(item) === "approved")
        .length,
      rejected: items.filter((item) => proformaStatus(item) === "rejected")
        .length,
    }),
    [items],
  );

  const filtered = React.useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && proformaStatus(item) !== status) return false;
      if (!text) return true;
      return `${item.uuid ?? ""} ${item.user ?? ""} ${item.status ?? ""} ${item.country_of_origin ?? ""} ${countryLabel(item.country_of_origin)} ${item.entry_border ?? ""} ${item.goods?.map((good) => `${good.description} ${good.manufacturer_country} ${countryLabel(good.manufacturer_country)}`).join(" ") ?? ""}`
        .toLowerCase()
        .includes(text);
    });
  }, [items, query, status]);

  async function moderate(
    item: AdminProforma,
    nextStatus: "approved" | "rejected" | "pending",
  ) {
    const reason =
      nextStatus === "rejected"
        ? window.prompt(
            "دلیل رد شدن را وارد کنید:",
            item.rejection_reason || "",
          ) || ""
        : "";
    if (!window.confirm("وضعیت این بار تغییر کند؟")) return;
    setBusyUuid(item.uuid);
    setError("");
    try {
      const updated = await setProformaModeration(
        item.uuid,
        nextStatus,
        reason,
      );
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

  async function remove(item: AdminProforma) {
    if (!window.confirm("این بار حذف شود؟")) return;
    setBusyUuid(item.uuid);
    setError("");
    try {
      await deleteProforma(item.uuid);
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
          title="مدیریت بارها"
          description="ردیف‌های فشرده برای بررسی سریع؛ جزئیات کامل داخل پنجره باز می‌شود."
          icon={<FileText className="h-6 w-6" />}
          accentClassName="bg-slate-900"
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/add-need">ایجاد بار</Link>
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
                  placeholder="جستجو با کاربر، UUID، وضعیت، کشور، مرز یا کالا..."
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
                      <th>UUID</th>
                      <th>کاربر</th>
                      <th>کالای اول</th>
                      <th>کشور مبدا</th>
                      <th>مرز</th>
                      <th>ارز</th>
                      <th>جمع کالا</th>
                      <th>کالاها</th>
                      <th className="w-[360px]">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          موردی با این فیلترها پیدا نشد.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((item) => {
                        const firstGood = item.goods?.[0];
                        return (
                          <tr
                            key={item.uuid}
                            className="border-t [&>td]:px-3 [&>td]:py-2"
                          >
                            <td>
                              <Badge variant={statusVariant(item)}>
                                {statusLabel(item)}
                              </Badge>
                            </td>
                            <td className="font-medium">{item.uuid}</td>
                            <td>{safeText(item.user)}</td>
                            <td>
                              <div>{safeText(firstGood?.description)}</div>
                              <div className="text-xs text-muted-foreground">
                                HS {safeText(firstGood?.hs_code)}
                              </div>
                            </td>
                            <td>{countryLabel(item.country_of_origin)}</td>
                            <td>{safeText(item.entry_border)}</td>
                            <td>{safeText(item.currency_type)}</td>
                            <td className="tabular-nums">
                              {fmt(totalGoodsValue(item))}
                            </td>
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
                        );
                      })
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
  item: AdminProforma;
  busy: boolean;
  onModerate: (
    item: AdminProforma,
    status: "approved" | "rejected" | "pending",
  ) => void;
  onRemove: (item: AdminProforma) => void;
}) {
  const fileUrl = resolveFileUrl(props.item.proforma_file);
  return (
    <div className="flex flex-wrap gap-1.5">
      <ProformaDetailsDialog item={props.item} fileUrl={fileUrl} />
      <Button asChild size="sm" variant="outline">
        <Link href={`/my-needs/${encodeURIComponent(props.item.uuid)}`}>
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

function ProformaDetailsDialog({
  item,
  fileUrl,
}: {
  item: AdminProforma;
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
            <DialogTitle className="text-right">جزئیات بار</DialogTitle>
            <DialogDescription className="text-right">
              {item.uuid}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[calc(90dvh-92px)] overflow-y-auto p-5">
          <div className="space-y-4">
            <Card className="overflow-hidden rounded-2xl shadow-sm before:block before:h-1 before:bg-amber-600 before:content-['']">
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
                        {safeText(item.goods?.[0]?.description || item.uuid)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {safeText(item.status)} | کشور مبدا:{" "}
                        {countryLabel(item.country_of_origin)}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                    <Info
                      label="ارزش کالاها"
                      value={fmt(totalGoodsValue(item))}
                    />
                    <Info label="کرایه حمل" value={fmt(item.freight_price)} />
                    <Info
                      label="مبلغ فی (تومان)"
                      value={fmt(item.fee_amount)}
                    />
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
                          <span>
                            مقدار: {fmt(good.quantity)} {safeText(good.unit)}
                          </span>
                          <span>قیمت: {fmt(good.price)}</span>
                          <span>
                            کشور سازنده:{" "}
                            {countryLabel(good.manufacturer_country)}
                          </span>
                          <span>
                            وزن: NW {fmt(good.nw_kg)} / GW {fmt(good.gw_kg)}
                          </span>
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
                    <Info label="ارز" value={safeText(item.currency_type)} />
                    <Info label="نوع فی" value={safeText(item.fee_type)} />
                    <Info
                      label="مبلغ فی (تومان)"
                      value={fmt(item.fee_amount)}
                    />
                    <Info label="کرایه حمل" value={fmt(item.freight_price)} />
                    <Info
                      label="ارزش کالاها"
                      value={fmt(totalGoodsValue(item))}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="meta" className="mt-4">
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-2">
                    <Info label="کاربر" value={safeText(item.user)} />
                    <Info label="وضعیت بار" value={safeText(item.status)} />
                    <Info
                      label="کشور مبدا"
                      value={countryLabel(item.country_of_origin)}
                    />
                    <Info
                      label="مرز ورودی"
                      value={safeText(item.entry_border)}
                    />
                    <Info label="گمرک" value={customsLabel(item.customs)} />
                    <Info
                      label="روش حمل"
                      value={safeText(item.means_of_transport)}
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
