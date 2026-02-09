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
    <div>
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
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

        {/* Quick Actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Add Order */}
          <Card
            className="cursor-pointer transition hover:shadow-md"
            onClick={() => router.push("/add-order")}
          >
            <CardHeader>
              <CardTitle className="text-base">ایجاد ثبت‌سفارش</CardTitle>
              <CardDescription>ثبت سریع یک درخواست جدید</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                فرم ثبت‌سفارش با جزئیات کامل
              </p>
              <Button size="sm" onClick={() => router.push("/add-order")}>
                ورود
              </Button>
            </CardContent>
          </Card>

          {/* My Orders */}
          <Card
            className="cursor-pointer transition hover:shadow-md"
            onClick={() => router.push("/my-orders")}
          >
            <CardHeader>
              <CardTitle className="text-base">ثبت‌سفارش‌های من</CardTitle>
              <CardDescription>مشاهده و مدیریت درخواست‌ها</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                ویرایش، حذف و پیگیری وضعیت
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/my-orders")}
              >
                مشاهده
              </Button>
            </CardContent>
          </Card>

          {/* Marketplace */}
          <Card
            className="cursor-pointer transition hover:shadow-md"
            onClick={() => router.push("/marketplace")}
          >
            <CardHeader>
              <CardTitle className="text-base">مارکت‌پلیس</CardTitle>
              <CardDescription>مشاهده فرصت‌ها و مچ‌ها</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                لیست ثبت‌سفارش‌ها و کالاها
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => router.push("/marketplace")}
              >
                ورود
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
