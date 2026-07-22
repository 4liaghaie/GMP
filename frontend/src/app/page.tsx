"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  BarChart3,
  Box,
  BrainCircuit,
  Building2,
  Clock3,
  FileCheck2,
  Globe2,
  Handshake,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { authFetch } from "@/lib/auth-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type LatestOrder = {
  uuid: string;
  order_number?: string | null;
  total_value: string | number;
  sub_total: string | number;
  currency_type: string;
  goods?: Array<{
    description?: string;
    hs_code?: string;
    price?: string | number;
  }>;
};

type LatestNeed = {
  uuid: string;
  id: number;
  status: string;
  currency_type: string;
  goods?: Array<{
    description?: string;
    hs_code?: string;
    price?: string | number;
  }>;
};

const benefits = [
  {
    icon: BarChart3,
    title: "فرصت‌های بیشتر",
    text: "فرصت‌های همکاری مرتبط را در یک بازار تخصصی پیدا کنید.",
  },
  {
    icon: ShieldCheck,
    title: "امنیت اطلاعات",
    text: "اطلاعات کاربران در بستری امن و کنترل‌شده نگهداری می‌شود.",
  },
  {
    icon: BrainCircuit,
    title: "تطبیق هوشمند",
    text: "کالا و ثبت سفارش بر اساس اطلاعات تخصصی به هم متصل می‌شوند.",
  },
  {
    icon: Clock3,
    title: "صرفه‌جویی در زمان",
    text: "بدون جست‌وجوی پراکنده، سریع‌تر به گزینه مناسب برسید.",
  },
  {
    icon: Users,
    title: "حذف واسطه‌های غیرضروری",
    text: "ارتباط مستقیم میان صاحبان کالا و دارندگان ثبت سفارش.",
  },
];

const steps = [
  {
    icon: Box,
    title: "ثبت اطلاعات کالا",
    text: "صاحب کالا مشخصات محموله و پروفرما را ثبت می‌کند.",
  },
  {
    icon: FileCheck2,
    title: "ثبت اطلاعات سفارش",
    text: "دارنده ثبت سفارش اطلاعات و اسناد خود را وارد می‌کند.",
  },
  {
    icon: BrainCircuit,
    title: "تطبیق در GMP",
    text: "فرصت‌های مرتبط بر اساس اطلاعات کالا نمایش داده می‌شوند.",
  },
  {
    icon: Handshake,
    title: "ارتباط و مذاکره",
    text: "دو طرف برای ادامه همکاری با یکدیگر ارتباط می‌گیرند.",
  },
];

const audiences = [
  { icon: Box, label: "صاحبان کالا" },
  { icon: FileCheck2, label: "دارندگان ثبت سفارش" },
  { icon: Building2, label: "شرکت‌های بازرگانی" },
  { icon: PackageCheck, label: "ترخیص‌کاران" },
  { icon: Globe2, label: "واردکنندگان" },
];

const heroTraits = [
  { icon: ShieldCheck, label: "شفاف‌تر" },
  { icon: BrainCircuit, label: "هوشمندتر" },
  { icon: Clock3, label: "سریع‌تر" },
];

async function fetchPrivateList<T>(endpoint: string): Promise<T[]> {
  if (!API_BASE || typeof window === "undefined") return [];
  if (!localStorage.getItem("access") || !localStorage.getItem("refresh"))
    return [];

  try {
    const response = await authFetch(`${API_BASE}${endpoint}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as
      | T[]
      | { results?: T[] };
    if (!response.ok) return [];
    return Array.isArray(data) ? data : data.results || [];
  } catch {
    return [];
  }
}

function formatNumber(value: string | number | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value ? String(value) : "-";
  return number.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
}

function MarketplacePreviewCard({
  accent,
  badge,
  description,
  href,
  hsCode,
  title,
  value,
}: {
  accent: "teal" | "navy";
  badge: string;
  description: string;
  href: string;
  hsCode?: string;
  title: string;
  value?: string | number;
}) {
  return (
    <article className="group overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_16px_50px_-38px_rgba(8,40,73,.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-35px_rgba(8,40,73,.5)] dark:border-white/10 dark:bg-slate-900">
      <div
        className={
          accent === "teal" ? "h-1.5 bg-[#0798a7]" : "h-1.5 bg-[#0b3157]"
        }
      />
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e7f7f8] text-[#087f8d] dark:bg-[#087f8d]/20">
            {accent === "teal" ? (
              <Box className="h-5 w-5" />
            ) : (
              <FileCheck2 className="h-5 w-5" />
            )}
          </span>
          <Badge variant="secondary" className="rounded-full px-3">
            {badge}
          </Badge>
        </div>
        <div>
          <h3 className="line-clamp-1 font-bold text-[#0a3158] dark:text-white">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-white/5">
          <span className="text-slate-500">HS Code</span>
          <span className="text-left font-semibold">{hsCode || "-"}</span>
          <span className="text-slate-500">ارزش</span>
          <span className="text-left font-semibold">{formatNumber(value)}</span>
        </div>
        <Link
          href={href}
          className="flex items-center justify-between text-sm font-bold text-[#087f8d]"
        >
          مشاهده در بازار
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [latestOrders, setLatestOrders] = React.useState<LatestOrder[]>([]);
  const [latestNeeds, setLatestNeeds] = React.useState<LatestNeed[]>([]);

  React.useEffect(() => {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    setIsLoggedIn(Boolean(access && refresh));
    setMounted(true);
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
    <div
      dir="rtl"
      className="gmp-home-page w-full overflow-x-clip bg-white text-right text-[#092e54] dark:bg-[#07182c] dark:text-slate-50"
    >
      <section className="relative isolate border-b border-slate-100 dark:border-white/5">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_38%,rgba(11,154,166,.09),transparent_34%),linear-gradient(180deg,#fff_0%,#fbfdfe_100%)] dark:bg-[radial-gradient(circle_at_72%_38%,rgba(11,154,166,.14),transparent_34%)]" />
        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-8 px-5 py-12 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-16">
          <div className="order-2 max-w-xl justify-self-start lg:order-2">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <Sparkles className="h-4 w-4 text-[#078e9d]" />
              اولین بازار هوشمند اتصال صاحبان کالا و دارندگان ثبت سفارش
            </div>
            <h1 className="text-4xl font-black leading-[1.5] tracking-tight sm:text-5xl lg:text-[3rem]">
              بازار هوشمند تجارت خارجی
              <span className="mt-1 block text-[#078e9d]">
                اتصال سریع، شفاف و بدون واسطه
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              GMP بستری تخصصی برای ارتباط صاحبان کالا و دارندگان ثبت سفارش است؛
              مناسب‌ترین فرصت تجاری خود را سریع‌تر پیدا کنید.
            </p>
            <div className="mt-7 grid max-w-md grid-cols-3 gap-3">
              {heroTraits.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-xs font-bold sm:text-sm"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                    <Icon className="h-4 w-4 text-[#0a4774] dark:text-[#42c4cf]" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#07924f] px-6 hover:bg-[#087d47]"
              >
                <Link href={mounted && isLoggedIn ? "/dashboard" : "/register"}>
                  <UserPlus className="h-4 w-4" />
                  {mounted && isLoggedIn
                    ? "ورود به داشبورد"
                    : "ایجاد حساب کاربری"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-[#0a4774]/30 bg-white px-6 dark:bg-transparent"
              >
                <Link href={mounted && isLoggedIn ? "/marketplace" : "/login"}>
                  <Search className="h-4 w-4" />
                  {mounted && isLoggedIn
                    ? "مشاهده فرصت‌های همکاری"
                    : "ورود به حساب"}
                </Link>
              </Button>
            </div>
            <a
              href="#how-it-works"
              className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-[#078e9d]"
            >
              همین حالا شروع کنید و اولین فرصت همکاری خود را پیدا کنید
              <ArrowUpLeft className="h-4 w-4" />
            </a>
          </div>

          <div className="order-1 w-full min-w-0 justify-self-end lg:order-1">
            <div className="relative mx-auto w-full max-w-[660px]">
              <div className="absolute inset-[12%] rounded-full bg-[#0798a7]/10 blur-3xl" />
              <Image
                src="/gmp-hero.png"
                alt="پلتفرم بازار گمرکی GMP"
                width={1254}
                height={1254}
                priority
                sizes="(max-width: 1024px) 92vw, 52vw"
                className="relative h-auto w-full object-contain drop-shadow-[0_30px_34px_rgba(8,40,73,.12)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="benefits"
        className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"
      >
        <div className="text-center">
          <p className="text-sm font-bold text-[#078e9d]">مزیت‌های پلتفرم</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">
            چرا GMP انتخاب هوشمندانه شماست؟
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {benefits.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-center shadow-[0_14px_45px_-36px_rgba(8,40,73,.5)] transition hover:-translate-y-1 hover:border-[#0798a7]/40 dark:border-white/10 dark:bg-white/[.035]"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#edf8f9] text-[#0a4774] dark:bg-[#0798a7]/15 dark:text-[#4cc7d1]">
                <Icon className="h-7 w-7" strokeWidth={1.7} />
              </span>
              <h3 className="mt-5 text-sm font-extrabold">{title}</h3>
              <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-slate-100 bg-[#f8fbfc] dark:border-white/5 dark:bg-white/[.025]"
      >
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="text-center">
            <p className="text-sm font-bold text-[#078e9d]">مسیر همکاری</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              GMP چگونه کار می‌کند؟
            </h2>
          </div>
          <div className="relative mt-12 grid gap-5 md:grid-cols-4">
            <div className="absolute right-[12%] left-[12%] top-7 hidden border-t-2 border-dashed border-[#0a7890]/25 md:block" />
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="relative rounded-[1.4rem] border border-slate-200 bg-white px-5 pb-6 pt-9 text-center shadow-sm dark:border-white/10 dark:bg-[#0a2038]"
              >
                <span className="absolute -top-4 right-1/2 grid h-9 w-9 translate-x-1/2 place-items-center rounded-full bg-[#078e9d] text-sm font-black text-white ring-8 ring-[#f8fbfc] dark:ring-[#0a1c31]">
                  {index + 1}
                </span>
                <Icon
                  className="mx-auto h-9 w-9 text-[#0a4774] dark:text-[#4cc7d1]"
                  strokeWidth={1.6}
                />
                <h3 className="mt-4 text-sm font-extrabold">{title}</h3>
                <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-black sm:text-3xl">
            GMP مناسب چه کسانی است؟
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {audiences.map(({ icon: Icon, label }) => (
            <div key={label} className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#0a4774]/15 bg-white text-[#0a4774] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#4cc7d1]">
                <Icon className="h-8 w-8" strokeWidth={1.5} />
              </span>
              <p className="mt-4 text-sm font-bold">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {mounted && isLoggedIn ? (
        <section className="border-y border-slate-100 bg-[#f8fbfc] dark:border-white/5 dark:bg-white/[.025]">
          <div className="mx-auto max-w-7xl space-y-12 px-5 py-16 lg:px-8">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#078e9d]">مارکت‌پلیس</p>
                  <h2 className="mt-2 text-2xl font-black">
                    آخرین ثبت سفارش‌ها
                  </h2>
                </div>
                <Link
                  href="/marketplace"
                  className="text-sm font-bold text-[#087f8d]"
                >
                  مشاهده همه
                </Link>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {latestOrders.length ? (
                  latestOrders.map((order) => (
                    <MarketplacePreviewCard
                      key={order.uuid}
                      accent="navy"
                      badge={order.currency_type}
                      title={order.goods?.[0]?.description || "ثبت سفارش"}
                      description={
                        order.order_number
                          ? `شماره ثبت سفارش ${order.order_number}`
                          : order.uuid
                      }
                      hsCode={order.goods?.[0]?.hs_code}
                      value={order.sub_total || order.total_value}
                      href="/marketplace"
                    />
                  ))
                ) : (
                  <p className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
                    هنوز ثبت سفارش تاییدشده‌ای برای نمایش وجود ندارد.
                  </p>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#078e9d]">بارها</p>
                  <h2 className="mt-2 text-2xl font-black">آخرین بارها</h2>
                </div>
                <Link
                  href="/marketplace/needs"
                  className="text-sm font-bold text-[#087f8d]"
                >
                  مشاهده همه
                </Link>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {latestNeeds.length ? (
                  latestNeeds.map((need) => (
                    <MarketplacePreviewCard
                      key={need.uuid}
                      accent="teal"
                      badge={need.currency_type || need.status}
                      title={need.goods?.[0]?.description || "پروفرما"}
                      description={`پروفرما ${need.uuid}`}
                      hsCode={need.goods?.[0]?.hs_code}
                      value={need.goods?.[0]?.price}
                      href="/marketplace/needs"
                    />
                  ))
                ) : (
                  <p className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
                    هنوز پروفرمای تاییدشده‌ای برای نمایش وجود ندارد.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative isolate overflow-hidden bg-[#072d50] text-white">
        <div className="absolute inset-0 -z-10 opacity-35 [background-image:radial-gradient(circle_at_20%_100%,#0ca7b7_0,transparent_35%),linear-gradient(115deg,transparent_45%,rgba(255,255,255,.06)_45%,rgba(255,255,255,.06)_46%,transparent_46%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-bold text-[#50d1d9]">
              همکاری را از همین‌جا آغاز کنید
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-black leading-[1.6] sm:text-4xl">
              شریک تجاری بعدی شما شاید همین حالا در GMP حضور داشته باشد.
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/70">
              حساب خود را ایجاد کنید و به فرصت‌های مرتبط با تجارت خارجی دسترسی
              داشته باشید.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 h-12 rounded-xl bg-[#079d58] px-7 hover:bg-[#07864d]"
            >
              <Link href={mounted && isLoggedIn ? "/dashboard" : "/register"}>
                {mounted && isLoggedIn ? "مشاهده داشبورد" : "ایجاد حساب کاربری"}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="rounded-[1.6rem] border border-white/15 bg-white p-6 text-[#092e54] shadow-2xl sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f8f9] text-[#078e9d]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-xl font-black">ورود امن به حساب کاربری</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              اطلاعات بازار فقط پس از ورود و تایید حساب کاربری نمایش داده
              می‌شود.
            </p>
            <Button
              asChild
              className="mt-6 h-11 w-full rounded-xl bg-[#078e9d] hover:bg-[#087d89]"
            >
              <Link href={mounted && isLoggedIn ? "/dashboard" : "/login"}>
                {mounted && isLoggedIn ? "ورود به داشبورد" : "ورود"}
              </Link>
            </Button>
            {!isLoggedIn ? (
              <p className="mt-4 text-center text-xs text-slate-500">
                حساب کاربری ندارید؟{" "}
                <Link href="/register" className="font-bold text-[#078e9d]">
                  ثبت‌نام کنید
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
