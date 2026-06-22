"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageCheck,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RegisteredOrderForm, type RegisteredOrderFormInput } from "@/components/registered-orders/RegisteredOrderForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    currency_supply: "",
    bank_name: "",
    bank_branch: "",
    payment_instrument: "",
    expire_date: "1406/10/11",
    goods: [],
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
                <DialogTitle className="text-right text-lg leading-8 sm:text-xl">
                  لطفا اطلاعات مانده ثبت سفارش را وارد کنید
                </DialogTitle>
                <DialogDescription className="mt-2 text-right leading-7">
                  فرم جدید در سه مرحله تکمیل می‌شود. کالاها را در مرحله آخر از طریق جدول اضافه کنید.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(90dvh-220px)] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                <p>
                  اطلاعات این فرم باید مانده واقعی ثبت سفارش باشد. فایل PDF یا JPG الزامی است و حداقل یک کالا باید به جدول
                  کالاها اضافه شود.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <PackageCheck className="h-5 w-5 text-rose-600" />
                مدیریت کالاها
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                در مرحله کالاها، دکمه افزودن کالا یک پنجره باز می‌کند و بعد از ذخیره، کالا به جدول اضافه می‌شود.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/20 px-4 py-4 sm:justify-start sm:px-6">
            <Button type="button" className="w-full sm:w-auto sm:min-w-[150px]" onClick={() => setNoticeOpen(false)}>
              <CheckCircle2 className="h-4 w-4" />
              متوجه شدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="ثبت سفارش"
          title="ایجاد ثبت سفارش"
          description="ثبت سفارش جدید را با اطلاعات کلی، مالی و کالاها وارد کنید."
          icon={<FileText className="h-6 w-6" />}
          accentClassName="bg-sky-600"
          actions={
            <>
              <Button variant="outline" onClick={() => router.push("/my-orders")}>
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

        <RegisteredOrderForm mode="create" initialValues={defaultValues()} onDone={() => router.push("/my-orders")} />
      </main>
    </div>
  );
}
