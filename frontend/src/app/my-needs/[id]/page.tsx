"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, FilePenLine, RefreshCw } from "lucide-react";

import {
  GoodsNeedForm,
  type GoodsNeedFormInput,
} from "@/components/goods-needs/GoodsNeedForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { authFetch } from "@/lib/auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function parseMultiValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveProformaFileUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!API_BASE) return raw;
  try {
    return new URL(raw, API_BASE).toString();
  } catch {
    return raw;
  }
}

async function fetchNeed(uuid: string, signal?: AbortSignal) {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE تنظیم نشده است");
  const res = await authFetch(
    `${API_BASE}/goods-needs/${encodeURIComponent(uuid)}/`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new Error(data?.detail || "خطا در دریافت بار");
  return data;
}

function toFormDefaults(data: any): GoodsNeedFormInput {
  const goods = Array.isArray(data?.goods) ? data.goods : [];
  return {
    uuid: String(data?.uuid ?? ""),
    proforma_file: undefined,
    proforma_file_url: resolveProformaFileUrl(data?.proforma_file),
    status: String(data?.status ?? "در کشور مبدا"),
    country_of_origin: String(data?.country_of_origin ?? ""),
    freight_price: Number(data?.freight_price ?? 0),
    currency_type: String(data?.currency_type ?? "USD"),
    fee_type: String(data?.fee_type ?? "فی دریافتی"),
    fee_amount: Number(data?.fee_amount ?? 0),
    entry_border: parseMultiValue(data?.entry_border),
    customs: parseMultiValue(data?.customs),
    means_of_transport: parseMultiValue(data?.means_of_transport || "SEA"),
    goods: goods.length
      ? goods.map((item: any) => ({
          uuid: String(item?.uuid ?? ""),
          hs_code: String(item?.hs_code ?? ""),
          description: String(item?.description ?? ""),
          hs_code_id: Number(item?.hs_code_id ?? 0),
          goods_status: String(item?.goods_status ?? "نو"),
          quantity: Number(item?.quantity ?? 1),
          unit: String(item?.unit ?? "KG"),
          manufacturer_country: parseMultiValue(
            item?.manufacturer_country || "CN",
          ),
          price: Number(item?.price ?? 0),
          line_subtotal: Number(item?.line_total ?? 0),
          nw_kg: Number(item?.nw_kg ?? 0),
          gw_kg: Number(item?.gw_kg ?? 0),
        }))
      : [
          {
            description: String(data?.description ?? ""),
            hs_code: String(data?.hs_code ?? ""),
            hs_code_id: Number(data?.hs_code_id ?? 0),
            goods_status: String(data?.goods_status ?? "نو"),
            quantity: Number(data?.quantity ?? 1),
            unit: String(data?.unit ?? "KG"),
            manufacturer_country: parseMultiValue(
              data?.manufacturer_country || "CN",
            ),
            price: Number(data?.price ?? 0),
            line_subtotal:
              Number(data?.price ?? 0) * Number(data?.quantity ?? 1),
            nw_kg: Number(data?.nw_kg ?? 0),
            gw_kg: Number(data?.gw_kg ?? 0),
          },
        ],
  };
}

export default function EditNeedPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const uuid = String(params?.id || "");
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [defaults, setDefaults] = React.useState<GoodsNeedFormInput | null>(
    null,
  );

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
          title="ویرایش بار"
          description={`UUID: ${uuid}`}
          icon={<FilePenLine className="h-6 w-6" />}
          accentClassName="bg-amber-600"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/my-needs")}
              >
                <ArrowRight className="h-4 w-4" />
                بازگشت به لیست
              </Button>
              <Button
                variant="outline"
                onClick={() => load()}
                disabled={loading}
              >
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
