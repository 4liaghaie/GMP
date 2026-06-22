"use client";

import * as React from "react";
import {
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  User2,
  MapPin,
  BadgeCheck,
} from "lucide-react";

import type {
  MarketplaceOrder,
  OrderGood,
} from "@/components/marketplace/orders-list";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* =========================
   Config
========================= */

const WHATSAPP_NUMBER = "989122229979";
const WHATSAPP_MESSAGE = "سلام، درباره همین ثبت سفارش پیام می‌دم.";

/* =========================
   Utils
========================= */

function formatNumLike(x: string | number | null | undefined) {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (!Number.isFinite(n)) return String(x);
  return new Intl.NumberFormat("fa-IR").format(n);
}

function safeText(x: any) {
  if (x === null || x === undefined || x === "") return "—";
  return String(x);
}

function formatExpireDate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw);
  if (!match) return raw;
  const year = Number(match[1]);
  if (year < 1700) return raw;
  const date = new Date(year, Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return raw;
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const jy = parts.find((part) => part.type === "year")?.value ?? "";
  const jm = parts.find((part) => part.type === "month")?.value ?? "";
  const jd = parts.find((part) => part.type === "day")?.value ?? "";
  return `${jy}/${jm}/${jd}`;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

function buildWhatsAppLink(phone: string, text?: string) {
  const clean = String(phone || "").replace(/[^\d]/g, "");
  const msg = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${clean}${msg}`;
}

/* =========================
   Small UI helpers
========================= */

function KeyValue({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon ? (
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-muted">
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

/* =========================
   Goods
========================= */

function GoodMobileCard({ g }: { g: OrderGood }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-semibold leading-6">
            {safeText(g.description)}
          </div>
          <Badge variant="secondary" className="rounded-xl">
            {safeText(g.goods_status)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-xl">
            HS: {safeText(g.hs_code)}
          </Badge>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">قیمت</span>
          <span className="font-semibold">
            {formatNumLike(g.price ?? g.line_total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/*
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-semibold leading-6">
            {safeText(g.description)}
          </div>
          <Badge variant="secondary" className="rounded-xl">
            {safeText(g.unit)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-xl">
            HS: {safeText(g.hs_code)}
          </Badge>
          <Badge variant="outline" className="rounded-xl">
            وضعیت: {safeText(g.goods_status)}
          </Badge>
          <Badge variant="outline" className="rounded-xl">
            مبدا: {safeText(g.origin)}
          </Badge>
          <Badge variant="outline" className="rounded-xl">
            NW: {safeText(g.nw_kg)} • GW: {safeText(g.gw_kg)}
          </Badge>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">تعداد</span>
            <span className="font-medium">{formatNumLike(g.quantity)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">قیمت واحد</span>
            <span className="font-medium">{formatNumLike(g.unit_price)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">جمع ردیف</span>
          <span className="font-semibold">{formatNumLike(g.line_total)}</span>
        </div>
      </CardContent>
    </Card>
  );
*/

function GoodsTableDesktop({ order }: { order: MarketplaceOrder }) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold">اقلام کالا</div>
        <div className="text-xs text-muted-foreground">
          {order.goods?.length ? `${order.goods.length} ردیف` : "بدون کالا"}
        </div>
      </div>

      <ScrollArea className="h-[48dvh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">قیمت</TableHead>
              <TableHead className="text-right">HS</TableHead>
              <TableHead className="text-right w-[40%]">شرح</TableHead>
              <TableHead className="text-right w-[60px]">ردیف</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {order.goods?.length ? (
              order.goods.map((g, index) => (
                <TableRow key={g.uuid} className="hover:bg-muted/30">
                  <TableCell className="text-right font-semibold">
                    {formatNumLike(g.price ?? g.line_total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="rounded-xl">
                      {safeText(g.hs_code)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{safeText(g.description)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      وضعیت: {safeText(g.goods_status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-right" colSpan={4}>
                  کالایی ثبت نشده است.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

/*
  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold">اقلام کالا</div>
        <div className="text-xs text-muted-foreground">
          {order.goods?.length ? `${order.goods.length} ردیف` : "بدون کالا"}
        </div>
      </div>

      <ScrollArea className="h-[48dvh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">جمع</TableHead>
              <TableHead className="text-right">قیمت واحد</TableHead>
              <TableHead className="text-right">تعداد</TableHead>
              <TableHead className="text-right">HS</TableHead>
              <TableHead className="text-right w-[40%]">شرح</TableHead>
              <TableHead className="text-right w-[60px]">ردیف</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {order.goods?.length ? (
              order.goods.map((g, index) => (
                <TableRow key={g.uuid} className="hover:bg-muted/30">
                  {/* Index * /}

                  <TableCell className="text-right font-semibold">
                    {formatNumLike(g.line_total)}
                  </TableCell>

                  <TableCell className="text-right">
                    {formatNumLike(g.unit_price)}
                  </TableCell>

                  <TableCell className="text-right">
                    {formatNumLike(g.quantity)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Badge variant="outline" className="rounded-xl">
                      {safeText(g.hs_code)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="font-medium">{safeText(g.description)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      وضعیت: {safeText(g.goods_status)} • مبدا:{" "}
                      {safeText(g.origin)} • واحد: {safeText(g.unit)} • NW:{" "}
                      {safeText(g.nw_kg)} • GW: {safeText(g.gw_kg)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-right" colSpan={6}>
                  کالایی ثبت نشده است.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
*/

function GoodsTable({ order }: { order: MarketplaceOrder }) {
  return (
    <>
      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {order.goods?.length ? (
          order.goods.map((g) => <GoodMobileCard key={g.uuid} g={g} />)
        ) : (
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            کالایی ثبت نشده است.
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <GoodsTableDesktop order={order} />
      </div>
    </>
  );
}

/* =========================
   Left rail cards (desktop)
========================= */

function SummaryCard({ order }: { order: MarketplaceOrder }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border bg-muted">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">خلاصه</div>
            <div className="text-xs text-muted-foreground">
              ارقام به {safeText(order.currency_type)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <KeyValue label="ارزش کالا" value={formatNumLike(order.total_value)} />
        <KeyValue
          label="کرایه حمل"
          value={formatNumLike(order.freight_price)}
        />
        <KeyValue label="نوع فی" value={safeText(order.fee_type)} />
        <KeyValue
          label="مبلغ فی"
          value={`${formatNumLike(order.fee_amount)} تومان برای هر واحد ارز ثبت سفارش`}
        />

        <Separator />

        <div className="rounded-2xl border bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">جمع کل</span>
            <span className="text-base font-semibold">
              {formatNumLike(order.sub_total)}
            </span>
          </div>
        </div>

        <Separator />

      </CardContent>
    </Card>
  );
}

function DetailsMeta({ order }: { order: MarketplaceOrder }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border bg-muted">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">اطلاعات تکمیلی</div>
            <div className="text-xs text-muted-foreground">
              شرایط، مبدا، استاندارد و وضعیت ارسال
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {order.national_code ? (
          <KeyValue label="شناسه ملی" value={safeText(order.national_code)} />
        ) : null}
        <KeyValue label="تامین ارز" value={safeText(order.currency_supply)} />
        <KeyValue label="نام بانک" value={safeText(order.bank_name)} />
        <KeyValue label="شعبه بانک" value={safeText(order.bank_branch)} />
        <KeyValue
          label="ابزار پرداخت"
          value={safeText(order.payment_instrument)}
        />
        <KeyValue label="تحویل" value={safeText(order.terms_of_delivery)} />
        <KeyValue label="حمل" value={safeText(order.means_of_transport)} />
        <KeyValue label="گمرک" value={safeText(order.customs)} />
        <KeyValue label="مبدا" value={safeText(order.country_of_origin)} />
        <KeyValue
          label="حمل به دفعات"
          value="-"
        />
        <KeyValue label="انقضا" value={formatExpireDate(order.expire_date)} />
      </CardContent>
    </Card>
  );
}

/* =========================
   Contact UI
========================= */

function ContactStripCompact({
  order,
  referenceText,
}: {
  order: MarketplaceOrder;
  referenceText: string;
}) {
  const waLink = React.useMemo(() => {
    const msg = `${WHATSAPP_MESSAGE}\nشناسه سفارش: ${referenceText}`;
    return buildWhatsAppLink(WHATSAPP_NUMBER, msg);
  }, [referenceText]);

  const displayPhone = `+${String(WHATSAPP_NUMBER).replace(/[^\d]/g, "")}`;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border bg-muted">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">ارتباط سریع</div>
            <div className="text-xs text-muted-foreground">
              واتساپ:{" "}
              <span className="font-medium text-foreground">
                {displayPhone}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="rounded-2xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          پیام با شماره ثبت سفارش ارسال می‌شود.
        </div>
        <div className="grid gap-2">
          <Button asChild className="rounded-2xl">
            <a href={waLink} target="_blank" rel="noreferrer">
              <MessageCircle className="ms-2 h-4 w-4" />
              پیام واتساپ
              <ExternalLink className="ms-2 h-4 w-4 opacity-70" />
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <a
              href={buildWhatsAppLink(WHATSAPP_NUMBER)}
              target="_blank"
              rel="noreferrer"
            >
              باز کردن چت
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactPanelMobile({
  order,
  referenceText,
}: {
  order: MarketplaceOrder;
  referenceText: string;
}) {
  const waLink = React.useMemo(() => {
    const msg = `${WHATSAPP_MESSAGE}\nشناسه سفارش: ${referenceText}`;
    return buildWhatsAppLink(WHATSAPP_NUMBER, msg);
  }, [referenceText]);

  const displayPhone = `+${String(WHATSAPP_NUMBER).replace(/[^\d]/g, "")}`;

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border bg-muted">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">ارتباط</div>
            <div className="text-xs text-muted-foreground">
              پیام سریع برای مذاکره/هماهنگی
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="rounded-2xl border bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">واتساپ</span>
            <span className="text-sm font-medium">{displayPhone}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            شماره ثبت سفارش در پیام قرار می‌گیرد.
          </div>
        </div>

        <div className="grid gap-2">
          <Button asChild className="rounded-2xl">
            <a href={waLink} target="_blank" rel="noreferrer">
              <MessageCircle className="ms-2 h-4 w-4" />
              پیام واتساپ
              <ExternalLink className="ms-2 h-4 w-4 opacity-70" />
            </a>
          </Button>

          <Button asChild variant="outline" className="rounded-2xl">
            <a
              href={buildWhatsAppLink(WHATSAPP_NUMBER)}
              target="_blank"
              rel="noreferrer"
            >
              باز کردن چت
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================
   Desktop layout (effective)
   Left sticky rail + right scrollable goods
========================= */

function DesktopLayout({
  order,
  copied,
  onCopy,
  visibleOrderNumber,
  referenceText,
}: {
  order: MarketplaceOrder;
  copied: boolean;
  onCopy: () => void;
  visibleOrderNumber: string | null;
  referenceText: string;
}) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-2xl shadow-sm before:h-1 before:bg-slate-900 before:content-['']">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">ثبت سفارش</Badge>
                <Badge variant="outline">{safeText(order.currency_type)}</Badge>
                <Badge variant="outline">
                  {order.goods?.length
                    ? `${order.goods.length} ردیف کالا`
                    : "بدون کالا"}
                </Badge>
              </div>
              <div>
                <div className="text-xl">{safeText(order.uuid)}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  فروشنده: {safeText(order.user)} • مرز ورودی:{" "}
                  {safeText(order.entry_border)}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
              <KeyValue
                label="ارزش کالا"
                value={formatNumLike(order.total_value)}
              />
              <KeyValue
                label="کرایه حمل"
                value={formatNumLike(order.freight_price)}
              />
              <KeyValue label="جمع کل" value={formatNumLike(order.sub_total)} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-fit rounded-xl"
              onClick={onCopy}
            >
              {copied ? (
                <Check className="ms-2 h-4 w-4" />
              ) : (
                <Copy className="ms-2 h-4 w-4" />
              )}
              کپی شماره
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="goods" className="w-full">
        <TabsList className="w-full rounded-2xl md:w-auto">
          <TabsTrigger className="rounded-2xl px-5" value="goods">
            اقلام کالا
          </TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5" value="summary">
            خلاصه مالی
          </TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5" value="meta">
            اطلاعات تکمیلی
          </TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5" value="contact">
            ارتباط
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goods" className="mt-4">
          <GoodsTableDesktop order={order} />
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SummaryCard order={order} />
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2">
                <div className="text-sm font-semibold">شناسه‌ها</div>
                <div className="text-xs text-muted-foreground">
                  اطلاعات اصلی ثبت سفارش
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <KeyValue
                  label="فروشنده"
                  value={safeText(order.user)}
                  icon={<User2 className="h-4 w-4" />}
                />
                {order.applicant_name ? (
                  <KeyValue
                    label="متقاضی"
                    value={safeText(order.applicant_name)}
                    icon={<User2 className="h-4 w-4" />}
                  />
                ) : null}
                {visibleOrderNumber ? (
                  <KeyValue
                    label="شماره ثبت سفارش"
                    value={visibleOrderNumber}
                    icon={<BadgeCheck className="h-4 w-4" />}
                  />
                ) : null}
                <KeyValue
                  label="مرز ورودی"
                  value={safeText(order.entry_border)}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <KeyValue
                  label="ارز"
                  value={safeText(order.currency_type)}
                  icon={<BadgeCheck className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <DetailsMeta order={order} />
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <div className="max-w-md">
            <ContactStripCompact order={order} referenceText={referenceText} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* =========================
   Mobile body
========================= */

function MobileBody({
  order,
  visibleOrderNumber,
  referenceText,
}: {
  order: MarketplaceOrder;
  visibleOrderNumber: string | null;
  referenceText: string;
}) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="goods" className="w-full">
        <TabsList className="w-full rounded-2xl">
          <TabsTrigger className="flex-1 rounded-2xl" value="goods">
            اقلام
          </TabsTrigger>
          <TabsTrigger className="flex-1 rounded-2xl" value="summary">
            خلاصه
          </TabsTrigger>
          <TabsTrigger className="flex-1 rounded-2xl" value="meta">
            اطلاعات
          </TabsTrigger>
          <TabsTrigger className="flex-1 rounded-2xl" value="contact">
            ارتباط
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goods" className="mt-4">
          <GoodsTable order={order} />
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <SummaryCard order={order} />
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <DetailsMeta order={order} />
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <ContactPanelMobile order={order} referenceText={referenceText} />
        </TabsContent>
      </Tabs>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 text-sm">
          <div className="grid gap-2">
            {order.applicant_name ? (
              <KeyValue
                label="متقاضی"
                value={safeText(order.applicant_name)}
                icon={<User2 className="h-4 w-4" />}
              />
            ) : null}
            <KeyValue
              label="مرز ورودی"
              value={safeText(order.entry_border)}
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">جمع کل</span>
            <span className="font-semibold">
              {formatNumLike(order.sub_total)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   Main exported component
========================= */

export default function OrderDetails({ order }: { order: MarketplaceOrder }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [copied, setCopied] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAdmin((localStorage.getItem("role") || "") === "admin");
  }, []);

  const visibleOrderNumber = isAdmin ? safeText(order.order_number) : null;
  const referenceText = visibleOrderNumber || safeText(order.uuid);

  async function copyOrderNumber() {
    try {
      await navigator.clipboard.writeText(String(referenceText));
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {}
  }

  // Desktop -> Dialog
  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-xl cursor-pointer">
            جزئیات
          </Button>
        </DialogTrigger>

        <DialogContent
          className={cn(
            "p-0 overflow-hidden md:max-w-[1100px] lg:max-w-[1200px] md:rounded-2xl h-[90dvh]",
            "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
          )}
        >
          {/* Top bar */}
          <div className="border-b bg-background">
            <DialogHeader className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 text-right">
                  <DialogTitle className="text-right text-lg">
                    جزئیات ثبت سفارش
                  </DialogTitle>
                  <DialogDescription className="text-right">
                    جدول اقلام ثبت سفارش و خلاصه اطلاعات
                  </DialogDescription>
                </div>

                <DialogClose asChild />
              </div>
            </DialogHeader>
          </div>

          {/* Body: single scroll for dialog, but goods scroll stays inside its card */}
          <ScrollArea className="h-[calc(90dvh-92px)]">
            <div className="p-5">
              <DesktopLayout
                order={order}
                copied={copied}
                onCopy={copyOrderNumber}
                visibleOrderNumber={visibleOrderNumber}
                referenceText={referenceText}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile -> Sheet
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="rounded-xl cursor-pointer">
          جزئیات
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className={cn(
          "h-[92dvh] rounded-t-2xl p-0 overflow-hidden",
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        <div className="border-b bg-background">
          <SheetHeader className="p-4 text-right">
            <SheetTitle className="text-right text-lg">
              ثبت سفارش {safeText(order.order_number)}
            </SheetTitle>
            <SheetDescription className="text-right">
              مشاهده جزئیات، اقلام و خلاصه مالی
            </SheetDescription>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-xl">
                {safeText(order.currency_type)}
              </Badge>
              <Badge variant="outline" className="rounded-xl">
                {order.goods?.length
                  ? `${order.goods.length} ردیف کالا`
                  : "بدون کالا"}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={copyOrderNumber}
              >
                {copied ? (
                  <Check className="ms-2 h-4 w-4" />
                ) : (
                  <Copy className="ms-2 h-4 w-4" />
                )}
                کپی شماره
              </Button>
            </div>

            <div className="mt-3 grid gap-2">
              <KeyValue
                label="فروشنده"
                value={safeText(order.user)}
                icon={<User2 className="h-4 w-4" />}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {order.applicant_name ? (
                  <KeyValue
                    label="متقاضی"
                    value={safeText(order.applicant_name)}
                    icon={<User2 className="h-4 w-4" />}
                  />
                ) : null}
                <KeyValue
                  label="مرز ورودی"
                  value={safeText(order.entry_border)}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Body (scroll) */}
        <ScrollArea className="h-[calc(92dvh-160px-276px)]">
          <div className="p-4">
            <MobileBody
              order={order}
              visibleOrderNumber={visibleOrderNumber}
              referenceText={referenceText}
            />
            <div className="h-4" />
          </div>
        </ScrollArea>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 border-t bg-background/95 p-4 backdrop-blur">
          <div className="grid gap-2">
            <Button asChild className="w-full rounded-2xl">
              <a
                href={buildWhatsAppLink(
                  WHATSAPP_NUMBER,
                  `${WHATSAPP_MESSAGE}\nشماره ثبت سفارش: ${safeText(order.order_number)}`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="ms-2 h-4 w-4" />
                پیام واتساپ
                <ExternalLink className="ms-2 h-4 w-4 opacity-70" />
              </a>
            </Button>

            <SheetClose asChild>
              <Button className="w-full rounded-2xl" variant="outline">
                بستن
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
