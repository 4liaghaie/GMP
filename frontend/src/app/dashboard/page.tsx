"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
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

  const role = localStorage.getItem("role") || "user";

  return (
    <div className="">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">داشبورد</h1>
            <p className="mt-1 text-sm text-muted-foreground leading-6">
              خوش آمدید. نقش شما:{" "}
              <span className="font-medium text-foreground">{role}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/profile")}>
              پروفایل
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                localStorage.removeItem("role");
                router.push("/");
              }}
            >
              خروج
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">ثبت‌سفارش‌ها</CardTitle>
              <CardDescription>ایجاد و مدیریت درخواست‌ها</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-6">
              در مرحله بعد: مدل ثبت‌سفارش + لیست + فیلترها + وضعیت‌ها
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">کالاهای موجود</CardTitle>
              <CardDescription>ثبت کالا برای مچ شدن</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-6">
              در مرحله بعد: تعریف کالا/محموله + مقدار + شرایط + محل گمرک
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">مچ‌ها و پیشنهادها</CardTitle>
              <CardDescription>
                پیشنهاد قیمت و توافق ساختاریافته
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-6">
              در مرحله بعد: پیشنهادها، پذیرش/رد، تاریخچه و پیگیری
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
