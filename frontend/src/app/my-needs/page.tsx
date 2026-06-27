"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, ListChecks, RefreshCw } from "lucide-react";

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

type ProformaGood = {
  uuid: string;
  description: string;
  hs_code: string;
  goods_status: string;
  quantity: string | number;
  unit: string;
  manufacturer_country: string;
  price: string | number;
};

type GoodsNeed = {
  uuid: string;
  id: number;
  verified?: boolean;
  rejected?: boolean;
  rejection_reason?: string | null;
  created_at: string;
  user: string;
  status: string;
  country_of_origin: string;
  currency_type: string;
  fee_type: string;
  fee_amount: string | number;
  entry_border: string;
  customs: string;
  goods: ProformaGood[];
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
  return (
    customsOptions.find((item) => item.value === value)?.label || value || "-"
  );
}

async function fetchNeeds(signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت بارها");
  return (Array.isArray(data) ? data : data?.results || []) as GoodsNeed[];
}

async function deleteNeed(uuid: string) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
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

async function setNeedModeration(
  uuid: string,
  status: "approved" | "rejected",
  reason = "",
) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(
    `${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/verify/`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در تغییر وضعیت بار");
  return data as GoodsNeed;
}

export default function MyNeedsPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [items, setItems] = React.useState<GoodsNeed[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deletingUuid, setDeletingUuid] = React.useState<string | null>(null);
  const [moderatingUuid, setModeratingUuid] = React.useState<string | null>(
    null,
  );
  const [role, setRole] = React.useState("user");

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
    if (!window.confirm("این بار حذف شود؟")) return;
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

  async function onModerate(item: GoodsNeed, status: "approved" | "rejected") {
    const reason =
      status === "rejected"
        ? window.prompt(
            "دلیل رد شدن را وارد کنید:",
            item.rejection_reason || "",
          ) || ""
        : "";
    if (!window.confirm("وضعیت این پروفرما تغییر کند؟")) return;
    setModeratingUuid(item.uuid);
    setError("");
    try {
      const updated = await setNeedModeration(item.uuid, status, reason);
      setItems((prev) => prev.map((x) => (x.uuid === item.uuid ? updated : x)));
    } catch (err: any) {
      setError(err?.message || "خطا در تغییر وضعیت");
    } finally {
      setModeratingUuid(null);
    }
  }

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="مدیریت"
          title="بارهای من"
          description="بارهایی که با حساب شما ثبت شده‌اند."
          icon={<ListChecks className="h-6 w-6" />}
          accentClassName="bg-rose-600"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/add-need")}
              >
                <FilePlus2 className="h-4 w-4" />
                ایجاد بار
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
            <CardTitle className="text-base">لیست بارها</CardTitle>
            <CardDescription>
              هر بار می‌تواند چند کالا داشته باشد.
            </CardDescription>
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
                    <th>کالای اول</th>
                    <th>تعداد کالا</th>
                    <th>وضعیت</th>
                    <th>کشور مبدا</th>
                    <th>ارز</th>
                    <th>فی</th>
                    <th>مرز ورودی</th>
                    <th>گمرک</th>
                    {isAdmin ? <th>وضعیت تایید</th> : null}
                    <th className="w-[160px]">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 11 : 10}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        موردی یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const first = item.goods?.[0];
                      return (
                        <tr
                          key={item.uuid}
                          className="border-t [&>td]:px-3 [&>td]:py-2"
                        >
                          <td>{item.uuid}</td>
                          <td className="font-medium">
                            {first?.description || "-"}
                            <div className="text-xs text-muted-foreground">
                              HS {first?.hs_code || "-"}، {fmt(first?.quantity)}{" "}
                              {first?.unit || ""}
                            </div>
                          </td>
                          <td>{fmt(item.goods?.length || 0)}</td>
                          <td>{item.status || "-"}</td>
                          <td>{item.country_of_origin || "-"}</td>
                          <td>{item.currency_type || "-"}</td>
                          <td>
                            {item.fee_type || "-"} / {fmt(item.fee_amount)}
                          </td>
                          <td>{item.entry_border || "-"}</td>
                          <td>{customsLabel(item.customs)}</td>
                          {isAdmin ? (
                            <td>
                              {item.rejected ? (
                                <span className="text-red-700">
                                  رد شده
                                  {item.rejection_reason
                                    ? `: ${item.rejection_reason}`
                                    : ""}
                                </span>
                              ) : item.verified ? (
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
                          <td>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/my-needs/${encodeURIComponent(item.uuid)}`,
                                  )
                                }
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
                              {isAdmin ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onModerate(item, "approved")}
                                    disabled={moderatingUuid === item.uuid}
                                  >
                                    تایید
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onModerate(item, "rejected")}
                                    disabled={moderatingUuid === item.uuid}
                                  >
                                    رد
                                  </Button>
                                </>
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
