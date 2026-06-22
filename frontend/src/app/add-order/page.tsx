"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageCheck,
  Scale,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RegisteredOrderForm,
  type RegisteredOrderFormInput,
} from "@/components/registered-orders/RegisteredOrderForm";

function defaultValues(): RegisteredOrderFormInput {
  return {
    order_number: "",
    order_pdf: undefined,
    order_pdf_url: "",
    id: "",
    freight_price: 0,
    currency_type: "USD",
    fee_type: "فی دریافتی",
    fee_amount: 0,
    applicant_name: "",
    national_code: "",
    entry_border: [],
    customs: [],
    currency_supply: "",
    bank_name: "",
    bank_branch: "",
    payment_instrument: "",
    expire_date: "1406/10/11",
    terms_of_delivery: "FOB",
    partial_shipment: false,
    means_of_transport: ["SEA"],
    country_of_origin: ["CN"],
    goods: [
      {
        description: "",
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

export default function AddRegisteredOrderPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [noticeOpen, setNoticeOpen] = React.useState(false);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      router.replace("/login");
      return;
    }
    setReady(true);
    setNoticeOpen(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div dir="rtl">
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] overflow-hidden p-0 text-right sm:max-w-2xl [&>button]:left-4 [&>button]:right-auto">
          <div className="h-1 bg-amber-600" />

          <DialogHeader className="space-y-4 px-4 pt-6 text-right sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-600 text-white shadow-sm">
                <AlertTriangle className="h-6 w-6" />
              </span>

              <div className="min-w-0">
                <DialogTitle className="text-right text-lg font-black leading-8 sm:text-xl">
                  لطفا اطلاعات مانده ثبت سفارش را وارد کنید
                </DialogTitle>

                <DialogDescription className="mt-2 text-right leading-7">
                  اگر بخشی از ثبت سفارش و کرایه حمل استفاده شده، فقط باقیمانده
                  قابل فروش را در فرم وارد کنید.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(90dvh-220px)] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                <p>
                  اطلاعات این فرم باید مانده واقعی ثبت سفارش باشد. وارد کردن
                  مقدار مصرف‌شده باعث نمایش اطلاعات اشتباه ثبت سفارش در
                  مارکت‌پلیس می‌شود.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Scale className="h-5 w-5 text-sky-600" />
                  مانده قابل فروش
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  مبالغ، تعداد، وزن و ارزش کالا را فقط بر اساس مانده قابل فروش
                  وارد کنید.
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  فایل PDF الزامی
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  فایل PDF ثبت سفارش را قبل از ذخیره انتخاب کنید؛ بدون PDF فرم
                  ثبت نمی‌شود.
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <PackageCheck className="h-5 w-5 text-rose-600" />
                  تکمیل هر کالا
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  برای هر کالا، HS Code، وضعیت کالا، مبدا، مقدار و ارزش کالا را
                  جداگانه وارد کنید.
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Calculator className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  محاسبه خودکار
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  قیمت واحد از مقدار و ارزش کالا محاسبه می‌شود؛ فقط ارزش کالا را
                  درست وارد کنید.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/20 px-4 py-4 sm:px-6 sm:justify-start">
            <Button
              type="button"
              className="w-full sm:min-w-[150px] sm:w-auto"
              onClick={() => setNoticeOpen(false)}
            >
              <CheckCircle2 className="h-4 w-4" />
              متوجه شدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <PageHeader
          eyebrow="ثبت سفارش"
          title="ایجاد ثبت سفارش"
          description="ثبت سفارش جدید را با فیلدهای بازرگانی، فایل PDF و اطلاعات کالا وارد کنید."
          icon={<FileText className="h-6 w-6" />}
          accentClassName="bg-sky-600"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/my-orders")}
              >
                <ClipboardList className="h-4 w-4" />
                لیست ثبت سفارش‌ها
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowRight className="h-4 w-4" />
                بازگشت
              </Button>
            </>
          }
        />

        <RegisteredOrderForm
          mode="create"
          initialValues={defaultValues()}
          onDone={() => router.push("/my-orders")}
        />
      </main>
    </div>
  );
}
