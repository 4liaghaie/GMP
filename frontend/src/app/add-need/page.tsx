"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FilePlus2, ListChecks } from "lucide-react";

import {
  GoodsNeedForm,
  type GoodsNeedFormInput,
} from "@/components/goods-needs/GoodsNeedForm";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

function defaultValues(): GoodsNeedFormInput {
  return {
    status: "در کشور مبدا",
    country_of_origin: "",
    currency_type: "USD",
    fee_type: "فی دریافتی",
    fee_amount: 0,
    entry_border: [],
    customs: [],
    means_of_transport: ["SEA"],
    goods: [
      {
        description: "",
        hs_code_id: 0,
        goods_status: "نو",
        quantity: 1,
        unit: "KG",
        manufacturer_country: ["CN"],
        price: 0,
        line_subtotal: 0,
        nw_kg: 0,
        gw_kg: 0,
      },
    ],
  };
}

export default function AddNeedPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div dir="rtl">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="بار"
          title="ایجاد بار"
          description="باری جدید را با چند کالا ثبت کنید تا دارندگان ثبت سفارش مشابه بتوانند آن را پیدا کنند."
          icon={<FilePlus2 className="h-6 w-6" />}
          accentClassName="bg-amber-600"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/my-needs")}
              >
                <ListChecks className="h-4 w-4" />
                لیست بارهای من
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowRight className="h-4 w-4" />
                بازگشت
              </Button>
            </>
          }
        />

        <GoodsNeedForm
          initialValues={defaultValues()}
          onDone={() => router.push("/my-needs")}
        />
      </main>
    </div>
  );
}
