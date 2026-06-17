"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  PackageSearch,
  PlusCircle,
  Search,
  Sparkles,
  Store,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ActionCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
  featured?: boolean;
  onNavigate: (href: string) => void;
};

function ActionCard(props: ActionCardProps) {
  return (
    <Card
      className={[
        "group relative cursor-pointer overflow-hidden border-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl",
        props.featured ? "md:col-span-2" : "",
      ].join(" ")}
      onClick={() => props.onNavigate(props.href)}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${props.accent}`} />
      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-white/50 blur-2xl transition group-hover:scale-125" />
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <span
            className={`grid h-12 w-12 place-items-center rounded-2xl text-white shadow-sm ${props.accent}`}
          >
            {props.icon}
          </span>
          <ArrowLeft className="h-5 w-5 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-foreground" />
        </div>
        <CardTitle className="pt-2 text-lg">{props.title}</CardTitle>
        <CardDescription className="leading-7">
          {props.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative flex items-center justify-between">
        <Button
          className="rounded-xl"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            props.onNavigate(props.href);
          }}
        >
          {props.buttonLabel}
        </Button>
        <span className="text-xs text-muted-foreground">دسترسی سریع</span>
      </CardContent>
    </Card>
  );
}

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
  const actions = [
    {
      title: "ایجاد ثبت سفارش",
      description:
        "ثبت سفارش جدید را با اطلاعات تجاری، کالاها، فایل PDF و جزئیات مالی ایجاد کنید.",
      buttonLabel: "شروع ثبت",
      href: "/add-order",
      icon: <FilePlus2 className="h-6 w-6" />,
      accent: "bg-sky-600",
      featured: true,
    },
    {
      title: "ایجاد بار",
      description:
        "باری چندکالایی ثبت کنید تا دارندگان ثبت سفارش مشابه بتوانند آن را پیدا کنند.",
      buttonLabel: "ثبت بار",
      href: "/add-need",
      icon: <PackageSearch className="h-6 w-6" />,
      accent: "bg-amber-600",
      featured: true,
    },
    {
      title: "ثبت سفارش‌های من",
      description:
        "ویرایش، حذف و پیگیری ثبت سفارش‌هایی که با حساب شما ساخته شده‌اند.",
      buttonLabel: "مشاهده",
      href: "/my-orders",
      icon: <ClipboardList className="h-6 w-6" />,
      accent: "bg-emerald-600",
    },
    {
      title: "بارهای من",
      description: "مدیریت بارها، ویرایش اطلاعات و حذف موارد قدیمی.",
      buttonLabel: "مدیریت",
      href: "/my-needs",
      icon: <Search className="h-6 w-6" />,
      accent: "bg-rose-600",
    },
    {
      title: "مارکت‌پلیس",
      description:
        "مشاهده فرصت‌ها، ثبت سفارش‌های تاییدشده و کالاهای موجود در بازار.",
      buttonLabel: "ورود",
      href: "/marketplace",
      icon: <Store className="h-6 w-6" />,
      accent: "bg-slate-800",
    },
  ];

  return (
    <div dir="rtl" className="min-h-[calc(100vh-80px)]]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-10 text-white shadow-2xl sm:px-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.12),transparent_45%)]" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-300" />
                مرکز کنترل ثبت سفارش و بار
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                داشبورد مدیریتی
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-8 text-white/75 sm:text-base">
                ثبت سفارش، بار، مدیریت درخواست‌ها و ورود به مارکت‌پلیس را از یک
                مسیر سریع و منظم انجام دهید.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <div className="text-xs text-white/60">نقش شما</div>
                <div className="mt-3 flex items-center gap-2 text-xl font-bold">
                  <LayoutDashboard className="h-5 w-5 text-sky-300" />
                  {role}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <div className="text-xs text-white/60">میانبرهای فعال</div>
                <div className="mt-3 flex items-center gap-2 text-xl font-bold">
                  <PlusCircle className="h-5 w-5 text-amber-300" />
                  {actions.length} مسیر
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              اقدام‌های سریع
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              مسیرهای اصلی حساب شما برای شروع سریع‌تر
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <ActionCard
              key={action.href}
              {...action}
              onNavigate={(href) => router.push(href)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
