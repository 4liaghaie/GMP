"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Compass,
  FilePlus2,
  Package,
  PackageSearch,
  Sparkles,
  Store,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DashboardLink = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

type FeatureGroupProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  links: DashboardLink[];
};

function DashboardLinkCard({ title, description, href, icon }: DashboardLink) {
  return (
    <Link
      href={href}
      className="
        group flex items-center justify-between
        rounded-2xl border border-slate-200 bg-white/80 p-4
        backdrop-blur transition-all duration-300
        hover:-translate-y-1
        hover:border-slate-300
        hover:bg-white
        hover:shadow-md

        dark:border-slate-800
        dark:bg-slate-900/60
        dark:hover:border-slate-700
        dark:hover:bg-slate-800/70
        dark:hover:shadow-none
      "
    >
      <div className="flex items-start gap-4">
        <div
          className="
            flex h-12 w-12 shrink-0 items-center justify-center
            rounded-xl bg-slate-100 text-slate-700

            dark:bg-slate-800
            dark:text-slate-200
          "
        >
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <ArrowLeft
        className="
          h-5 w-5 shrink-0 text-slate-400
          transition group-hover:-translate-x-1

          dark:text-slate-500
        "
      />
    </Link>
  );
}

function FeatureGroup({
  title,
  description,
  icon,
  accent,
  links,
}: FeatureGroupProps) {
  return (
    <Card
      className="
        overflow-hidden rounded-[2rem]
        border border-slate-200
        bg-white/80
        backdrop-blur-xl
        shadow-sm

        dark:border-slate-800
        dark:bg-slate-900/70
        dark:shadow-none
        dark:ring-1
        dark:ring-white/5
      "
    >
      <div className={`h-1.5 ${accent}`} />

      <CardHeader className="pb-4">
        <div
          className="
            mb-4 flex h-16 w-16 items-center justify-center
            rounded-2xl bg-slate-100

            dark:bg-slate-800
          "
        >
          {icon}
        </div>

        <CardTitle className="text-2xl  text-slate-950 dark:text-slate-100">
          {title}
        </CardTitle>

        <CardDescription className="text-base leading-7 text-slate-600 dark:text-slate-400">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {links.map((link) => (
            <DashboardLinkCard key={link.href} {...link} />
          ))}
        </div>
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

  const orderLinks: DashboardLink[] = [
    {
      title: "ایجاد ثبت سفارش",
      description: "ثبت سفارش جدید همراه با جزئیات کالا",
      href: "/add-order",
      icon: <FilePlus2 className="h-5 w-5" />,
    },
    {
      title: "ثبت سفارش‌های من",
      description: "مدیریت و پیگیری ثبت سفارش‌های ثبت‌شده",
      href: "/my-orders",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      title: "مارکت‌پلیس ثبت سفارش",
      description: "مشاهده ثبت سفارش‌های تاییدشده بازار",
      href: "/marketplace",
      icon: <Store className="h-5 w-5" />,
    },
  ];

  const proformaLinks: DashboardLink[] = [
    {
      title: "ایجاد بار",
      description: "ثبت باری جدید برای بازار",
      href: "/add-need",
      icon: <PackageSearch className="h-5 w-5" />,
    },
    {
      title: "بارهای من",
      description: "مدیریت و ویرایش بارهای ثبت‌شده",
      href: "/my-needs",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "مارکت‌پلیس بار",
      description: "مشاهده بارها و بارهای موجود",
      href: "/marketplace/needs",
      icon: <Compass className="h-5 w-5" />,
    },
  ];

  return (
    <div
      dir="rtl"
      className="
        min-h-screen

        bg-[radial-gradient(circle_at_top_right,#fff7ed_0%,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)]

        dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%),#0B1120]
      "
    >
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HERO */}
        <section
          className="
            relative overflow-hidden rounded-[2.5rem]
            border border-slate-200
            bg-slate-950
            px-8 py-12 text-white shadow-2xl

            dark:border-slate-800
            dark:bg-slate-900/70
            dark:backdrop-blur-2xl
            dark:shadow-none
            dark:ring-1
            dark:ring-white/5
          "
        >
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              داشبورد مدیریت
            </div>

            <h1 className="mt-6 text-4xl  sm:text-5xl">
              مدیریت ثبت سفارش و بار
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
              ایجاد، مدیریت و جستجوی ثبت سفارش‌ها و بارها در یک داشبورد ساده و
              متمرکز.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="
                  rounded-2xl
                  bg-white
                  text-slate-950
                  hover:bg-white/90

                  dark:bg-sky-500
                  dark:text-white
                  dark:hover:bg-sky-400
                "
              >
                <Link href="/add-order">ثبت سفارش جدید</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="
                  rounded-2xl
                  border-white/20
                  bg-white/10
                  text-white
                  hover:bg-white/15

                  dark:border-slate-700
                  dark:bg-slate-800/60
                  dark:text-slate-100
                  dark:hover:bg-slate-800
                "
              >
                <Link href="/add-need">ایجاد بار</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* GROUPS */}
        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <FeatureGroup
            title="ثبت سفارش"
            description="ایجاد، مدیریت و مشاهده فرصت‌های ثبت سفارش"
            icon={<Package className="h-8 w-8 text-sky-500" />}
            accent="bg-sky-500"
            links={orderLinks}
          />

          <FeatureGroup
            title="بار"
            description="مدیریت بارها و مشاهده بارهای موجود بازار"
            icon={<FileText className="h-8 w-8 text-amber-500" />}
            accent="bg-amber-500"
            links={proformaLinks}
          />
        </section>
      </main>
    </div>
  );
}
