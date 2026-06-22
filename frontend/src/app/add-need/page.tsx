"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FilePlus2, ListChecks } from "lucide-react";

import { GoodsNeedForm, type GoodsNeedFormInput } from "@/components/goods-needs/GoodsNeedForm";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

function defaultValues(): GoodsNeedFormInput {
  return {
    proforma_file: undefined,
    proforma_file_url: "",
    status: "در کشور مبدا",
    country_of_origin: "",
    freight_price: 0,
    currency_type: "USD",
    fee_type: "فی دریافتی",
    fee_amount: 0,
    entry_border: [],
    customs: [],
    means_of_transport: ["SEA"],
    goods: [],
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
          eyebrow="پروفرما"
          title="ایجاد پروفرما"
          description="پروفرمای جدید را با اطلاعات کلی، مالی و کالاها ثبت کنید."
          icon={<FilePlus2 className="h-6 w-6" />}
          accentClassName="bg-amber-600"
          actions={
            <>
              <Button variant="outline" onClick={() => router.push("/my-needs")}>
                <ListChecks className="h-4 w-4" />
                لیست پروفرماهای من
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowRight className="h-4 w-4" />
                بازگشت
              </Button>
            </>
          }
        />

        <GoodsNeedForm initialValues={defaultValues()} onDone={() => router.push("/my-needs")} />
      </main>
    </div>
  );
}
