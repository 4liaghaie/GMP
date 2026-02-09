"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

function toFormDefaults(apiData: any): RegisteredOrderFormInput {
  return {
    uuid: String(apiData?.uuid ?? ""),
    order_number: String(apiData?.order_number ?? ""),

    // human-readable id (if you still keep it)
    id: String(apiData?.id ?? apiData?.order_number ?? ""),

    freight_price: Number(apiData?.freight_price ?? 0),
    currency_type: String(apiData?.currency_type ?? "USD"),
    seller_country: String(apiData?.seller_country ?? "CN"),
    date: String(apiData?.date ?? "2026/02/01"),
    expire_date: String(apiData?.expire_date ?? "2028/01/01"),
    terms_of_delivery: String(apiData?.terms_of_delivery ?? "FOB"),
    terms_of_payment: String(apiData?.terms_of_payment ?? "TT"),
    partial_shipment: Boolean(apiData?.partial_shipment ?? false),
    means_of_transport: String(apiData?.means_of_transport ?? "SEA"),
    country_of_origin: String(apiData?.country_of_origin ?? "CN"),
    standard: String(apiData?.standard ?? "STD"),

    goods:
      Array.isArray(apiData?.goods) && apiData.goods.length
        ? apiData.goods.map((g: any) => ({
            description: String(g?.description ?? ""),
            hs_code_id: Number(g?.hs_code_id ?? g?.hs_code?.id ?? 0),
            quantity: Number(g?.quantity ?? 1),
            origin: String(g?.origin ?? "CN"),
            unit_price: Number(g?.unit_price ?? 0),
            unit: String(g?.unit ?? "KG"),
            nw_kg: Number(g?.nw_kg ?? 0),
            gw_kg: Number(g?.gw_kg ?? 0),
          }))
        : [
            {
              description: "",
              hs_code_id: 0,
              quantity: 1,
              origin: "CN",
              unit_price: 0,
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">ویرایش ثبت سفارش</h1>
            <p className="mt-1 text-sm text-muted-foreground leading-6">
              UUID: {uuid}
              {defaults?.order_number
                ? ` — شماره سفارش: ${defaults.order_number}`
                : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/my-orders")}>
              بازگشت به لیست
            </Button>
            <Button
              variant="outline"
              onClick={() => setRefetchTick((x) => x + 1)}
              disabled={loading}
            >
              دریافت مجدد
            </Button>
          </div>
        </div>

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
