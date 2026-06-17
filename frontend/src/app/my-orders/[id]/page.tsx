"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, FilePenLine, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";

import { authFetch } from "@/lib/auth-api";
import {
  RegisteredOrderForm,
  type RegisteredOrderFormInput,
} from "@/components/registered-orders/RegisteredOrderForm";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function fetchOrder(uuid: string, signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");

  const res = await authFetch(
    `${API_BASE}/registered-orders/${encodeURIComponent(uuid)}/`,
    {
      method: "GET",
      cache: "no-store",
      signal,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );

  const data = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    const msg =
      data?.detail ||
      (typeof data === "object"
        ? JSON.stringify(data)
        : "خطا در دریافت ثبت سفارش");
    throw new Error(msg);
  }

  return data as any;
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

    // human-readable id (if you still keep it)
    id: String(apiData?.order_number ?? apiData?.id ?? ""),

    freight_price: Number(apiData?.freight_price ?? 0),
    currency_type: String(apiData?.currency_type ?? "USD"),
    fee_type: String(apiData?.fee_type ?? "فی دریافتی"),
    fee_amount: Number(apiData?.fee_amount ?? 0),
    applicant_name: String(apiData?.applicant_name ?? ""),
    national_code: String(apiData?.national_code ?? ""),
    entry_border: parseMultiValue(apiData?.entry_border),
    customs: parseMultiValue(apiData?.customs),
    currency_supply: String(apiData?.currency_supply ?? ""),
    bank_name: String(apiData?.bank_name ?? ""),
    bank_branch: String(apiData?.bank_branch ?? ""),
    payment_instrument: String(apiData?.payment_instrument ?? ""),
    expire_date: String(apiData?.expire_date ?? "1406/10/11"),
    terms_of_delivery: String(apiData?.terms_of_delivery ?? "FOB"),
    partial_shipment: Boolean(apiData?.partial_shipment ?? false),
    means_of_transport: parseMultiValue(apiData?.means_of_transport || "SEA"),
    country_of_origin: parseMultiValue(apiData?.country_of_origin || "CN"),

    goods:
      Array.isArray(apiData?.goods) && apiData.goods.length
        ? apiData.goods.map((g: any) => ({
            description: String(g?.description ?? ""),
            hs_code: String(g?.hs_code ?? ""),
            hs_code_id: Number(g?.hs_code_id ?? g?.hs_code?.id ?? 0),
            goods_status: String(g?.goods_status ?? "نو"),
            quantity: Number(g?.quantity ?? 1),
            origin: parseMultiValue(g?.origin || "CN"),
            unit_price: Number(g?.unit_price ?? 0),
            line_subtotal:
              Number(g?.line_total ?? 0) ||
              Number(g?.quantity ?? 0) * Number(g?.unit_price ?? 0),
            unit: String(g?.unit ?? "KG"),
            nw_kg: Number(g?.nw_kg ?? 0),
            gw_kg: Number(g?.gw_kg ?? 0),
          }))
        : [
            {
              description: "",
              hs_code: "",
              hs_code_id: 0,
              goods_status: "نو",
              quantity: 1,
              origin: ["CN"],
              unit_price: 0,
              line_subtotal: 0,
              unit: "KG",
              nw_kg: 0,
              gw_kg: 0,
            },
          ],
  };
}

export default function EditMyOrderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const uuid = String(params?.id || "");

  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [defaults, setDefaults] =
    React.useState<RegisteredOrderFormInput | null>(null);

  // ✅ triggers refetch when incremented
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

  // ✅ 1) fetch on mount + uuid change + manual tick
  React.useEffect(() => {
    const cleanup = refetch();
    return cleanup;
  }, [refetch, refetchTick]);

  // ✅ 2) refetch when user comes back (bfcache / back button)
  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setRefetchTick((x) => x + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    const onFocus = () => setRefetchTick((x) => x + 1);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!ready) return null;

  return (
    <div dir="rtl" className="">
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <PageHeader
          eyebrow="ویرایش"
          title="ویرایش ثبت سفارش"
          description={`UUID: ${uuid}${defaults?.order_number ? ` — شماره سفارش: ${defaults.order_number}` : ""}`}
          icon={<FilePenLine className="h-6 w-6" />}
          accentClassName="bg-sky-600"
          actions={
            <>
            <Button variant="outline" onClick={() => router.push("/my-orders")}>
              <ArrowRight className="h-4 w-4" />
              بازگشت به لیست
            </Button>
            <Button
              variant="outline"
              onClick={() => setRefetchTick((x) => x + 1)}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              دریافت مجدد
            </Button>
            </>
          }
        />

        {err && (
          <Alert variant="destructive">
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        {loading || !defaults ? (
          <div className="text-sm text-muted-foreground">
            در حال دریافت اطلاعات...
          </div>
        ) : (
          <RegisteredOrderForm
            mode="edit"
            initialValues={defaults}
            onDone={() => {
              // ✅ after save, refetch again from server
              setRefetchTick((x) => x + 1);
            }}
          />
        )}
      </main>
    </div>
  );
}
