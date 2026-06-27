"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  Lock,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";

import { authFetch } from "@/lib/auth-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type LatestOrder = {
  uuid: string;
  order_number?: string | null;
  user: string;
  total_value: string | number;
  sub_total: string | number;
  currency_type: string;
  goods?: Array<{
    description?: string;
    hs_code?: string;
    goods_status?: string;
    price?: string | number;
    line_total?: string | number;
  }>;
};

type LatestNeed = {
  uuid: string;
  id: number;
  user: string;
  status: string;
  currency_type: string;
  entry_border: string;
  description?: string;
  hs_code?: string;
  goods_status?: string;
  quantity?: string | number;
  unit?: string;
  price?: string | number;
  manufacturer_country?: string;
  goods?: Array<{
    description?: string;
    hs_code?: string;
    goods_status?: string;
    quantity?: string | number;
    unit?: string;
    price?: string | number;
    manufacturer_country?: string;
  }>;
};

async function fetchPrivateList<T>(endpoint: string): Promise<T[]> {
  if (!API_BASE) return [];
  if (typeof window !== "undefined") {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    if (!access || !refresh) return [];
  }

  try {
    const res = await authFetch(`${API_BASE}${endpoint}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) return [];
    return (Array.isArray(data) ? data : data?.results || []) as T[];
  } catch {
    return [];
  }
}

function fmt(value: string | number | null | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value ? String(value) : "-";
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function safeText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function OrderCard({ order }: { order: LatestOrder }) {
  const firstGood = order.goods?.[0];
  const goodsCount = order.goods?.length ?? 0;
  const title = order.order_number
    ? `ثبت سفارش ${safeText(order.order_number)}`
    : "ثبت سفارش";

  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="h-1 bg-sky-600" />
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-600 text-white shadow-sm">
            <ClipboardList className="h-5 w-5" />
          </span>
          <Badge variant="secondary" className="rounded-xl">
            {safeText(order.currency_type)}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="mt-2 leading-7">
            {safeText(firstGood?.description || "کالاهای ثبت سفارش")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 rounded-2xl bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">HS</span>
            <span className="font-medium">{safeText(firstGood?.hs_code)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ارزش کالا</span>
            <span className="font-medium">
              {fmt(firstGood?.price ?? firstGood?.line_total)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تعداد کالا</span>
            <span className="font-medium">{fmt(goodsCount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">جمع کل</span>
            <span className="font-semibold">{fmt(order.sub_total)}</span>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link href="/marketplace">
            مشاهده در مارکت‌پلیس
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function NeedCard({ need }: { need: LatestNeed }) {
  const firstGood = need.goods?.[0];

  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="h-1 bg-amber-600" />
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-600 text-white shadow-sm">
            <PackageSearch className="h-5 w-5" />
          </span>
          <Badge variant="secondary" className="rounded-xl">
            {need.goods?.length
              ? `${fmt(need.goods.length)} کالا`
              : safeText(need.status)}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-base">
            {safeText(firstGood?.description)}
          </CardTitle>
          <CardDescription className="mt-2 leading-7">
            بار #{safeText(need.id)} توسط {safeText(need.user)}
          </CardDescription>
          <CardDescription className="mt-2 leading-7">
            {safeText(need.uuid)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 rounded-2xl bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">HS</span>
            <span className="font-medium">{safeText(firstGood?.hs_code)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">مقدار</span>
            <span className="font-medium">
              {fmt(firstGood?.quantity)} {safeText(firstGood?.unit)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ارزش</span>
            <span className="font-semibold">
              {fmt(firstGood?.price)} {safeText(need.currency_type)}
            </span>
          </div>
        </div>
        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link href="/marketplace/needs">
            جستجوی ثبت سفارش مشابه
            <Search className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [latestOrders, setLatestOrders] = React.useState<LatestOrder[]>([]);
  const [latestNeeds, setLatestNeeds] = React.useState<LatestNeed[]>([]);

  React.useEffect(() => {
    setMounted(true);
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    setIsLoggedIn(Boolean(access && refresh));
  }, []);

  React.useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    Promise.all([
      fetchPrivateList<LatestOrder>("/marketplace/orders/"),
      fetchPrivateList<LatestNeed>("/marketplace/goods-needs/"),
    ]).then(([orders, needs]) => {
      if (cancelled) return;
      setLatestOrders(orders.slice(0, 3));
      setLatestNeeds(needs.slice(0, 3));
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  return (
    <div dir="rtl" className="min-h-screen]">
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <Sparkles className="h-5 w-5 text-amber-600" />
              بازار اتصال ثبت سفارش و بار
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                تسهیل در تجارت براساس تعرفه و ارزش
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                این سامانه بستری مناسب و موثر برای ارتباط میان افراد دارای ثبت
                سفارش و صاحبین کالا ایجاد کرده تا براساس تعرفه و ارزش کالا ،
                سریع و آسان فرصت همکاری شکل گیرد.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl">
                <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                  {isLoggedIn ? "ورود به داشبورد" : "ورود به حساب"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl bg-background"
              >
                <Link href={isLoggedIn ? "/marketplace" : "/register"}>
                  {isLoggedIn ? "مشاهده مارکت‌پلیس" : "ایجاد حساب"}
                </Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-0 bg-slate-950 text-white shadow-2xl">
            <CardHeader className="space-y-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">
                <Lock className="h-4 w-4 text-amber-300" />
                دسترسی محافظت‌شده
              </div>
              <CardTitle className="text-2xl">
                مشاهده بازار بعد از لاگین
              </CardTitle>
              <CardDescription className="leading-7 text-white/65">
                داده‌های بازار عمومی نیستند و بعد از احراز هویت در اختیار شما
                قرار می‌گیرند.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Store className="h-4 w-4 text-sky-300" />
                  مارکت‌پلیس ثبت سفارش
                </div>
                <p className="mt-2 leading-7 text-white/70">
                  لیست ثبت سفارش‌های تاییدشده فقط بعد از ورود قابل مشاهده است.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <PackageSearch className="h-4 w-4 text-amber-300" />
                  مارکت‌پلیس بار
                </div>
                <p className="mt-2 leading-7 text-white/70">
                  بارها و پروفرماها هم تا قبل از ورود نمایش داده نمی‌شوند.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  اطلاعات حساس
                </div>
                <p className="mt-2 leading-7 text-white/70">
                  اطلاعات حساس فقط برای ادمین قابل نمایش است.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {!mounted ? null : isLoggedIn ? (
          <>
            <section className="mt-14 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black">آخرین ثبت سفارش‌ها</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    نمونه‌ای از ثبت سفارش‌های تاییدشده که در مارکت‌پلیس قابل
                    مشاهده هستند.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl bg-background"
                >
                  <Link href="/marketplace">مشاهده همه</Link>
                </Button>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {latestOrders.length ? (
                  latestOrders.map((order) => (
                    <OrderCard key={order.uuid} order={order} />
                  ))
                ) : (
                  <Card className="md:col-span-3">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      هنوز ثبت سفارش تاییدشده‌ای برای نمایش وجود ندارد.
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            <section className="mt-14 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black">آخرین بارها</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    بارهای جدیدی که می‌توانند با ثبت سفارش‌های مشابه مچ شوند.
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl bg-background"
                >
                  <Link href="/marketplace/needs">مشاهده همه بارها</Link>
                </Button>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {latestNeeds.length ? (
                  latestNeeds.map((need) => (
                    <NeedCard key={need.uuid} need={need} />
                  ))
                ) : (
                  <Card className="md:col-span-3">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      هنوز باری برای نمایش ثبت نشده است.
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-12">
            <Card className="border-dashed">
              <CardContent className="flex flex-col gap-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-right">
                <div>
                  <div className="text-lg font-bold">برای ادامه وارد شوید</div>
                  <div className="mt-1 text-sm leading-7 text-muted-foreground">
                    بعد از ورود می‌توانید داشبورد، ثبت سفارش‌ها، بارها و
                    مارکت‌پلیس‌ها را ببینید.
                  </div>
                </div>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/login">
                    رفتن به صفحه ورود
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
