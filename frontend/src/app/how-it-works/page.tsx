import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  Box,
  CheckCircle2,
  FileCheck2,
  Handshake,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Box,
    title: "ثبت اطلاعات کالا یا پروفرما",
    description:
      "صاحب کالا مشخصات پروفرما و کالاهای مربوط را ثبت می‌کند تا پس از بررسی در بازار نمایش داده شود.",
  },
  {
    icon: FileCheck2,
    title: "ثبت اطلاعات سفارش",
    description:
      "دارنده ثبت سفارش مشخصات سفارش و کالاهای آن را همراه فایل مربوط در سامانه وارد می‌کند.",
  },
  {
    icon: BrainCircuit,
    title: "پیدا کردن فرصت مرتبط",
    description:
      "کاربران می‌توانند ثبت سفارش‌ها و پروفرماهای تاییدشده را جست‌وجو و جزئیات مرتبط را مقایسه کنند.",
  },
  {
    icon: Handshake,
    title: "ارتباط و ادامه همکاری",
    description:
      "پس از پیدا کردن گزینه مناسب، طرفین از مسیرهای ارتباطی موجود برای مذاکره و ادامه فرایند استفاده می‌کنند.",
  },
];

const paths = [
  {
    title: "اگر صاحب کالا یا پروفرما هستید",
    description: "اطلاعات پروفرما و کالاها را ثبت کنید تا پس از تایید مدیر در مارکت‌پلیس نمایش داده شود.",
    items: ["ثبت مشخصات کلی پروفرما", "افزودن اطلاعات حمل و مقصد", "ثبت کالاها و فایل مربوط"],
    href: "/add-need",
    action: "ثبت پروفرما",
    accent: "bg-[#078e9d] hover:bg-[#087d89]",
  },
  {
    title: "اگر دارنده ثبت سفارش هستید",
    description: "اطلاعات ثبت سفارش و کالاها را وارد کنید تا فرصت‌های مرتبط در بازار قابل پیدا کردن باشند.",
    items: ["ثبت اطلاعات عمومی سفارش", "تکمیل اطلاعات مالی موردنیاز", "افزودن کالاها و فایل سفارش"],
    href: "/add-order",
    action: "ثبت سفارش",
    accent: "bg-[#0a4774] hover:bg-[#083b62]",
  },
];

export default function HowItWorksPage() {
  return (
    <div dir="rtl" className="space-y-8 text-right">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#072f53] px-6 py-12 text-center text-white shadow-xl sm:px-10 sm:py-16">
        <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(circle_at_15%_0%,#0bb0bc_0,transparent_35%),linear-gradient(125deg,transparent_47%,rgba(255,255,255,.07)_47%,rgba(255,255,255,.07)_48%,transparent_48%)]" />
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-[#68dce2]">راهنمای استفاده از GMP</span>
        <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-[1.6] sm:text-4xl">از ثبت اطلاعات تا پیدا کردن شریک تجاری</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/70 sm:text-base">
          مسیر استفاده از GMP ساده است: اطلاعات را ثبت کنید، منتظر بررسی بمانید، فرصت‌های تاییدشده را پیدا کنید و برای همکاری ارتباط بگیرید.
        </p>
      </section>

      <section className="py-4">
        <div className="text-center">
          <p className="text-sm font-bold text-[#078e9d]">چهار مرحله اصلی</p>
          <h2 className="mt-2 text-2xl font-black">GMP چگونه کار می‌کند؟</h2>
        </div>
        <div className="relative mt-12 grid gap-5 md:grid-cols-4">
          <div className="absolute right-[12%] left-[12%] top-8 hidden border-t-2 border-dashed border-[#078e9d]/25 md:block" />
          {steps.map(({ icon: Icon, title, description }, index) => (
            <article key={title} className="relative rounded-[1.5rem] border bg-card px-5 pb-6 pt-10 text-center shadow-sm">
              <span className="absolute -top-4 right-1/2 grid h-9 w-9 translate-x-1/2 place-items-center rounded-full bg-[#078e9d] text-sm font-black text-white ring-8 ring-background">{index + 1}</span>
              <Icon className="mx-auto h-9 w-9 text-[#0a4774] dark:text-[#4cc7d1]" strokeWidth={1.6} />
              <h3 className="mt-4 text-sm font-black">{title}</h3>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {paths.map((path) => (
          <article key={path.title} className="rounded-[1.75rem] border bg-card p-6 shadow-sm sm:p-7">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f8f9] text-[#078e9d] dark:bg-[#078e9d]/15">
              <SearchCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-black">{path.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{path.description}</p>
            <div className="mt-5 space-y-3">
              {path.items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#079d58]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button asChild className={`mt-6 h-11 rounded-xl px-5 text-white ${path.accent}`}>
              <Link href={path.href}>
                {path.action}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-[#078e9d]/20 bg-[#eef9fa] p-6 dark:bg-[#078e9d]/10 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-[#078e9d] shadow-sm dark:bg-slate-900">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-lg font-black">بررسی و تایید اطلاعات</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              ثبت سفارش‌ها و پروفرماها پیش از نمایش عمومی توسط مدیر بررسی می‌شوند. نتیجه تایید یا رد از طریق اعلان‌های حساب کاربری به ثبت‌کننده اطلاع داده می‌شود.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-[1.75rem] border bg-card p-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">برای شروع وارد حساب خود شوید</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">پس از تایید حساب کاربری، همه بخش‌های بازار در دسترس شما قرار می‌گیرد.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="h-11 rounded-xl"><Link href="/login">ورود</Link></Button>
          <Button asChild className="h-11 rounded-xl bg-[#078e9d] hover:bg-[#087d89]"><Link href="/register">ثبت‌نام</Link></Button>
        </div>
      </section>
    </div>
  );
}
