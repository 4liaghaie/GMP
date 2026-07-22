import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  Building2,
  Handshake,
  PackageCheck,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Handshake,
    title: "ارتباط مستقیم",
    description:
      "GMP صاحبان کالا و دارندگان ثبت سفارش را در یک فضای تخصصی به یکدیگر متصل می‌کند.",
  },
  {
    icon: BrainCircuit,
    title: "تطبیق هدفمند",
    description:
      "اطلاعات ثبت‌شده کمک می‌کند فرصت‌های مرتبط سریع‌تر و دقیق‌تر پیدا شوند.",
  },
  {
    icon: ShieldCheck,
    title: "دسترسی کنترل‌شده",
    description:
      "اطلاعات بازار پس از ورود نمایش داده می‌شود و داده‌های حساس فقط در اختیار مدیران مجاز است.",
  },
];

const audiences = [
  { icon: PackageCheck, label: "صاحبان کالا و بار" },
  { icon: Target, label: "دارندگان ثبت سفارش" },
  { icon: Building2, label: "شرکت‌های بازرگانی" },
  { icon: Users, label: "فعالان تجارت خارجی" },
];

export default function AboutPage() {
  return (
    <div dir="rtl" className="space-y-8 text-right">
      <section className="relative isolate overflow-hidden rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-950 sm:p-9">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_22%,rgba(7,142,157,.13),transparent_32%)]" />
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_.72fr]">
          <div>
            <span className="inline-flex rounded-full bg-[#e9f8f9] px-4 py-2 text-xs font-bold text-[#078e9d] dark:bg-[#078e9d]/15">
              درباره پلتفرم GMP
            </span>
            <h1 className="mt-5 text-3xl font-black leading-[1.6] text-[#092e54] dark:text-white sm:text-4xl">
              بستری تخصصی برای ساختن ارتباط‌های تجاری بهتر
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">
              GMP با هدف ساده‌تر کردن ارتباط میان صاحبان کالا و دارندگان ثبت
              سفارش شکل گرفته است. کاربران اطلاعات خود را ثبت می‌کنند، فرصت‌های
              مرتبط را می‌بینند و برای ادامه همکاری مستقیما با یکدیگر ارتباط
              می‌گیرند.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#078e9d] px-6 hover:bg-[#087d89]"
              >
                <Link href="/register">
                  ایجاد حساب کاربری
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl bg-white px-6 dark:bg-transparent"
              >
                <Link href="/how-it-works">آشنایی با نحوه کار</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[390px]">
            <div className="absolute inset-[16%] rounded-full bg-[#0798a7]/10 blur-3xl" />
            <Image
              src="/gmp-hero.png"
              alt="بازار گمرکی GMP"
              width={1254}
              height={1254}
              sizes="(max-width: 1024px) 80vw, 32vw"
              className="relative h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="text-center">
          <p className="text-sm font-bold text-[#078e9d]">
            آنچه برای ما مهم است
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#092e54] dark:text-white">
            ارزش پیشنهادی GMP
          </h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border bg-card p-6 shadow-sm"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f8f9] text-[#087f8d] dark:bg-[#078e9d]/15">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border bg-[#f7fbfc] p-6 dark:bg-white/[.03] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-bold text-[#078e9d]">جامعه کاربران</p>
            <h2 className="mt-2 text-2xl font-black">
              GMP برای چه کسانی ساخته شده است؟
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              این پلتفرم برای فعالانی طراحی شده که در فرایند تامین، ثبت سفارش،
              واردات و عرضه کالا نقش دارند و به دنبال فرصت همکاری تخصصی هستند.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {audiences.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-2xl border bg-background p-4 text-center"
              >
                <Icon className="mx-auto h-7 w-7 text-[#087f8d]" />
                <p className="mt-3 text-xs font-bold leading-6">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-[#072f53] p-7 text-white sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">
              برای پیدا کردن فرصت مناسب آماده‌اید؟
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              پس از ثبت‌نام و تایید حساب، می‌توانید وارد بازار GMP شوید.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-[#079d58] px-7 hover:bg-[#07864d]"
          >
            <Link href="/register">شروع ثبت‌نام</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
