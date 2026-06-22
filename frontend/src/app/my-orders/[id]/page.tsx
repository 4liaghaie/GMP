"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, FilePenLine, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RegisteredOrderForm, type RegisteredOrderFormInput } from "@/components/registered-orders/RegisteredOrderForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function fetchOrder(uuid: string, signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const res = await authFetch(`${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/`, {
    method: "GET",
    cache: "no-store",
    signal,
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.detail || (typeof data === "object" ? JSON.stringify(data) : "خطا در دریافت ثبت سفارش"));
  }
  return data;
}

function resolveOrderPdfUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!API_BASE) return raw;
  try {
    return new URL(raw, API_BASE).toString();
  } catch {
    return raw;
  }
}

function parseMultiValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toFormDefaults(apiData: any): RegisteredOrderFormInput {
  return {
    uuid: String(apiData?.uuid ?? ""),
    order_number: String(apiData?.order_number ?? ""),
    order_pdf: undefined,
    order_pdf_url: resolveOrderPdfUrl(apiData?.order_pdf),
    id: String(apiData?.order_number ?? apiData?.id ?? ""),
    freight_price: Number(apiData?.freight_price ?? 0),
    currency_type: String(apiData?.currency_type ?? "USD"),
    fee_type: String(apiData?.fee_type ?? "فی دریافتی"),
    fee_amount: Number(apiData?.fee_amount ?? 0),
    applicant_name: String(apiData?.applicant_name ?? ""),
    currency_supply: String(apiData?.currency_supply ?? ""),
    bank_name: String(apiData?.bank_name ?? ""),
    bank_branch: String(apiData?.bank_branch ?? ""),
    payment_instrument: String(apiData?.payment_instrument ?? ""),
    expire_date: String(apiData?.expire_date ?? "1406/10/11"),
    goods:
      Array.isArray(apiData?.goods) && apiData.goods.length
        ? apiData.goods.map((g: any) => ({
            uuid: String(g?.uuid ?? ""),
            description: String(g?.description ?? ""),
            hs_code: String(g?.hs_code ?? ""),
            hs_code_id: Number(g?.hs_code_id ?? g?.hs_code?.id ?? 0),
            goods_status: String(g?.goods_status ?? "نو"),
            price: Number(g?.price ?? g?.line_total ?? 0),
          }))
        : [],
  };
}

export default function EditMyOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const uuid = String(params?.id || "");

  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [defaults, setDefaults] = React.useState<RegisteredOrderFormInput | null>(null);
  const [refetchTick, setRefetchTick] = React.useState(0);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const refetch = React.useCallback(() => {
    if (!ready || !uuid) return;
    const ac = new AbortController();
    setLoading(true);
    setErr("");

    fetchOrder(uuid, ac.signal)
      .then((data) => setDefaults(toFormDefaults(data)))
      .catch((e: any) => setErr(e?.message || "خطا"))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [ready, uuid]);

  React.useEffect(() => {
    const cleanup = refetch();
    return cleanup;
  }, [refetch, refetchTick]);

  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setRefetchTick((x) => x + 1);
    };
    const onFocus = () => setRefetchTick((x) => x + 1);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="ویرایش"
          title="ویرایش ثبت سفارش"
          description={`UUID: ${uuid}${defaults?.order_number ? ` - شماره سفارش: ${defaults.order_number}` : ""}`}
          icon={<FilePenLine className="h-6 w-6" />}
          accentClassName="bg-sky-600"
          actions={
            <>
              <Button variant="outline" onClick={() => router.push("/my-orders")}>
                <ArrowRight className="h-4 w-4" />
                بازگشت به لیست
              </Button>
              <Button variant="outline" onClick={() => setRefetchTick((x) => x + 1)} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
                دریافت مجدد
              </Button>
            </>
          }
        />

        {err ? (
          <Alert variant="destructive">
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        {loading || !defaults ? (
          <div className="text-sm text-muted-foreground">در حال دریافت اطلاعات...</div>
        ) : (
          <RegisteredOrderForm mode="edit" initialValues={defaults} onDone={() => setRefetchTick((x) => x + 1)} />
        )}
      </main>
    </div>
  );
}
