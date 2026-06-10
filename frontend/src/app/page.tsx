import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  ClipboardList,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
  order_number: string;
  user: string;
  total_value: string | number;
  sub_total: string | number;
  currency_type: string;
  entry_border: string;
  country_of_origin: string;
  goods?: Array<{
    description?: string;
    hs_code?: string;
    quantity?: string | number;
    unit?: string;
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

async function fetchList<T>(endpoint: string): Promise<T[]> {
  if (!API_BASE) return [];

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
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
          <CardTitle className="text-base">
            ثبت سفارش {safeText(order.order_number)}
          </CardTitle>
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
            <span className="text-muted-foreground">مرز ورودی</span>
            <span className="font-medium">{safeText(order.entry_border)}</span>
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
            {need.goods?.length ? `${fmt(need.goods.length)} کالا` : safeText(need.status)}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-base">
            {safeText(firstGood?.description)}
          </CardTitle>
          <CardDescription className="mt-2 leading-7">
            پروفرما #{safeText(need.id)} توسط {safeText(need.user)}
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
            <span className="text-muted-foreground">قیمت</span>
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

export default async function HomePage() {
  const [orders, needs] = await Promise.all([
    fetchList<LatestOrder>("/marketplace/orders/"),
    fetchList<LatestNeed>("/marketplace/goods-needs/"),
  ]);

  const latestOrders = orders.slice(0, 3);
  const latestNeeds = needs.slice(0, 3);

  return (
    <div dir="rtl" className="min-h-screen ">
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
              <Sparkles className="h-4 w-4 text-amber-600" />
              بازار اتصال ثبت سفارش و پروفرما
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                ثبت سفارش و پروفرما را سریع‌تر به هم وصل کنید
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                کاربران ثبت سفارش‌های معتبر و پروفرماهای خود را ثبت می‌کنند
                تا طرف‌های مشابه بر اساس کالا، HS Code، مرز ورودی و شرایط تجاری
                سریع‌تر همدیگر را پیدا کنند.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/register">ساخت حساب و شروع</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl bg-background"
              >
                <Link href="/marketplace">مشاهده مارکت‌پلیس</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <ShieldCheck className="mb-3 h-5 w-5 text-emerald-600" />
                <p className="font-semibold">ناشناس برای کاربران</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  اطلاعات حساس فقط برای ادمین قابل مشاهده است.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <BadgeCheck className="mb-3 h-5 w-5 text-sky-600" />
                <p className="font-semibold">ثبت سفارش تاییدشده</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  مارکت‌پلیس روی موارد قابل اعتماد تمرکز دارد.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <Boxes className="mb-3 h-5 w-5 text-amber-600" />
                <p className="font-semibold">پروفرما</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  پروفرماها با چند کالا و HS Code مشخص ثبت می‌شوند.
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden border-0 bg-slate-950 text-white shadow-2xl">
            <CardHeader>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                <PackageSearch className="h-4 w-4 text-amber-300" />
                آخرین فعالیت‌ها
              </div>
              <CardTitle className="text-2xl">
                جدیدترین سفارش‌ها و پروفرماها
              </CardTitle>
              <CardDescription className="leading-7 text-white/65">
                چند نمونه از آخرین داده‌های ثبت‌شده در سیستم.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...latestOrders.slice(0, 2), ...latestNeeds.slice(0, 2)]
                .length ? (
                <>
                  {latestOrders.slice(0, 2).map((order) => (
                    <div
                      key={`order-${order.uuid}`}
                      className="rounded-2xl border border-white/10 bg-white/10 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                          ثبت سفارش {safeText(order.order_number)}
                        </span>
                        <Badge variant="secondary">
                          {safeText(order.currency_type)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-white/65">
                        {safeText(order.goods?.[0]?.description)}، مرز{" "}
                        {safeText(order.entry_border)}
                      </p>
                    </div>
                  ))}
                  {latestNeeds.slice(0, 2).map((need) => (
                    <div
                      key={`need-${need.uuid}`}
                      className="rounded-2xl border border-white/10 bg-white/10 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                          {safeText(need.description)}
                        </span>
                        <Badge variant="secondary">نیاز کالا</Badge>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-white/65">
                        HS {safeText(need.hs_code)}، مقدار {fmt(need.quantity)}{" "}
                        {safeText(need.unit)}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-7 text-white/70">
                  هنوز داده عمومی برای نمایش وجود ندارد. بعد از ثبت و تایید
                  سفارش‌ها، آخرین موارد اینجا نمایش داده می‌شوند.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-14 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">آخرین ثبت سفارش‌ها</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                نمونه‌ای از ثبت سفارش‌های تاییدشده که در مارکت‌پلیس قابل مشاهده
                هستند.
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
              <h2 className="text-2xl font-black">آخرین پروفرماها</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                پروفرماهای جدیدی که می‌توانند با ثبت سفارش‌های مشابه match شوند.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-xl bg-background"
            >
              <Link href="/marketplace/needs">مشاهده همه پروفرماها</Link>
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
                  هنوز پروفرمایی برای نمایش ثبت نشده است.
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
