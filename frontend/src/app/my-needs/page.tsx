"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ListChecks, PlusCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authFetch } from "@/lib/auth-api";
import { iranCustoms } from "@/lib/customsList";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type GoodsNeed = {
  uuid: string;
  id: number;
  created_at: string;
  user: string;
  description: string;
  hs_code: string;
  status: string;
  goods_status: string;
  quantity: string | number;
  unit: string;
  manufacturer_country: string;
  country_of_origin: string;
  price: string | number;
  currency_type: string;
  fee_type: string;
  fee_amount: string | number;
  entry_border: string;
  customs: string;
};

const customsOptions = [
  { value: "ALL_CUSTOMS", label: "تمام گمرکات" },
  ...iranCustoms.map((customs) => ({
    value: String(customs.ctmVCodeInt),
    label: `${customs.ctmNameStr} (${customs.ctmVCodeInt})`,
  })),
];

function fmt(value: string | number | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value ? String(value) : "-";
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function customsLabel(value: string) {
  return customsOptions.find((item) => item.value === value)?.label || value || "-";
}

async function fetchNeeds(signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت نیازها");
  return (Array.isArray(data) ? data : data?.results || []) as GoodsNeed[];
}

async function deleteNeed(uuid: string) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/`, {
    method: "DELETE",
  });
  if (res.status === 204) return;
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در حذف نیاز کالا");
}

export default function MyNeedsPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [items, setItems] = React.useState<GoodsNeed[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deletingUuid, setDeletingUuid] = React.useState<string | null>(null);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const load = React.useCallback(() => {
    const ac = new AbortController();
    setLoading(true);
    setError("");
    fetchNeeds(ac.signal)
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

  async function onDelete(uuid: string) {
    if (!window.confirm("این نیاز کالا حذف شود؟")) return;
    setDeletingUuid(uuid);
    setError("");
    try {
      await deleteNeed(uuid);
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
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="مدیریت"
          title="نیازهای کالای من"
          description="نیازهایی که با حساب شما ثبت شده‌اند."
          icon={<ListChecks className="h-6 w-6" />}
          accentClassName="bg-rose-600"
          actions={
            <>
            <Button variant="outline" onClick={() => router.push("/add-need")}>
              <PlusCircle className="h-4 w-4" />
              + ایجاد نیاز کالا
            </Button>
            <Button variant="outline" onClick={() => load()}>
              <RefreshCw className="h-4 w-4" />
              بروزرسانی
            </Button>
            </>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">لیست</CardTitle>
            <CardDescription>برای هر نیاز فقط یک کالا ثبت می‌شود.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>خطا</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="[&>th]:px-3 [&>th]:py-2 text-right">
                    <th>ID</th>
                    <th>شرح کالا</th>
                    <th>HS</th>
                    <th>وضعیت نیاز</th>
                    <th>وضعیت</th>
                    <th>مقدار</th>
                    <th>قیمت</th>
                    <th>نوع ارز</th>
                    <th>نوع فی</th>
                    <th>مبلغ فی</th>
                    <th>مرز ورودی</th>
                    <th>گمرک</th>
                    <th className="w-[160px]">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-3 py-6 text-center text-muted-foreground">
                        موردی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.uuid} className="border-t [&>td]:px-3 [&>td]:py-2">
                        <td>{item.id}</td>
                        <td className="font-medium">{item.description || "-"}</td>
                        <td>{item.hs_code || "-"}</td>
                        <td>{item.status || "-"}</td>
                        <td>{item.goods_status || "-"}</td>
                        <td>{fmt(item.quantity)} {item.unit}</td>
                        <td>{fmt(item.price)}</td>
                        <td>{item.currency_type || "-"}</td>
                        <td>{item.fee_type || "-"}</td>
                        <td>{fmt(item.fee_amount)}</td>
                        <td>{item.entry_border || "-"}</td>
                        <td>{customsLabel(item.customs)}</td>
                        <td>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/my-needs/${encodeURIComponent(item.uuid)}`)}
                            >
                              ویرایش
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
