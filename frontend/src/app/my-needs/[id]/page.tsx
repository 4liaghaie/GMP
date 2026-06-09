"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, PackageSearch, RefreshCw } from "lucide-react";

import {
  GoodsNeedForm,
  type GoodsNeedFormInput,
} from "@/components/goods-needs/GoodsNeedForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { authFetch } from "@/lib/auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function fetchNeed(uuid: string, signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(`${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/`, {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(data?.detail || "خطا در دریافت نیاز کالا");
  }
  return data;
}

function toFormDefaults(data: any): GoodsNeedFormInput {
  return {
    uuid: String(data?.uuid ?? ""),
    hs_code: String(data?.hs_code ?? ""),
    description: String(data?.description ?? ""),
    hs_code_id: Number(data?.hs_code_id ?? 0),
    status: String(data?.status ?? "در کشور مبدا"),
    goods_status: String(data?.goods_status ?? "نو"),
    quantity: Number(data?.quantity ?? 1),
    unit: String(data?.unit ?? "KG"),
    manufacturer_country: String(data?.manufacturer_country ?? "CN"),
    country_of_origin: String(data?.country_of_origin ?? "CN"),
    price: Number(data?.price ?? 0),
    currency_type: String(data?.currency_type ?? "USD"),
    fee_type: String(data?.fee_type ?? "فی دریافتی"),
    fee_amount: Number(data?.fee_amount ?? 0),
    entry_border: String(data?.entry_border ?? ""),
    customs: String(data?.customs ?? ""),
    terms_of_delivery: String(data?.terms_of_delivery ?? "FOB"),
    terms_of_payment: String(data?.terms_of_payment ?? "TT"),
    partial_shipment: Boolean(data?.partial_shipment ?? false),
    means_of_transport: String(data?.means_of_transport ?? "SEA"),
    nw_kg: Number(data?.nw_kg ?? 0),
    gw_kg: Number(data?.gw_kg ?? 0),
  };
}

export default function EditNeedPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const uuid = String(params?.id || "");
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [defaults, setDefaults] = React.useState<GoodsNeedFormInput | null>(null);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const load = React.useCallback(() => {
    if (!ready || !uuid) return;
    const ac = new AbortController();
    setLoading(true);
    setError("");
    fetchNeed(uuid, ac.signal)
      .then((data) => setDefaults(toFormDefaults(data)))
      .catch((err: any) => setError(err?.message || "خطا"))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [ready, uuid]);

  React.useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="ویرایش"
          title="ویرایش نیاز کالا"
          description={`UUID: ${uuid}`}
          icon={<PackageSearch className="h-6 w-6" />}
          accentClassName="bg-amber-600"
          actions={
            <>
            <Button variant="outline" onClick={() => router.push("/my-needs")}>
              <ArrowRight className="h-4 w-4" />
              بازگشت به لیست
            </Button>
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              دریافت مجدد
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

        {loading || !defaults ? (
          <div className="text-sm text-muted-foreground">
            در حال دریافت اطلاعات...
          </div>
        ) : (
          <GoodsNeedForm
            mode="edit"
            initialValues={defaults}
            onDone={() => load()}
          />
        )}
      </main>
    </div>
  );
}
