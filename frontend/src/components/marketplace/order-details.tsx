"use client";

import * as React from "react";
import {
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  User2,
  MapPin,
  Calendar,
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
            {safeText(g.unit)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-xl">
            HS: {safeText(g.hs_code)}
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
}

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
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-semibold">اقلام کالا</div>
            <div className="text-xs text-muted-foreground">
              {order.goods?.length ? `${order.goods.length} ردیف` : "بدون کالا"}
            </div>
          </div>

          <ScrollArea className="h-[520px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">شرح</TableHead>
                  <TableHead className="text-right">HS</TableHead>
                  <TableHead className="text-right">تعداد</TableHead>
                  <TableHead className="text-right">قیمت واحد</TableHead>
                  <TableHead className="text-right">جمع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.goods?.length ? (
                  order.goods.map((g) => (
                    <TableRow key={g.uuid} className="hover:bg-muted/30">
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {safeText(g.description)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          مبدا: {safeText(g.origin)} • واحد: {safeText(g.unit)}{" "}
                          • NW: {safeText(g.nw_kg)} • GW: {safeText(g.gw_kg)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="rounded-xl">
                          {safeText(g.hs_code)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumLike(g.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumLike(g.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumLike(g.line_total)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-right" colSpan={5}>
                      کالایی ثبت نشده است.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

/* =========================
   Right column cards
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

        <div className="grid gap-2">
          <KeyValue label="وزن خالص" value={formatNumLike(order.total_nw)} />
          <KeyValue label="وزن ناخالص" value={formatNumLike(order.total_gw)} />
          <KeyValue label="تعداد کل" value={formatNumLike(order.total_qty)} />
        </div>
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
        <KeyValue label="تحویل" value={safeText(order.terms_of_delivery)} />
        <KeyValue label="پرداخت" value={safeText(order.terms_of_payment)} />
        <KeyValue label="حمل" value={safeText(order.means_of_transport)} />
        <KeyValue label="مبدا" value={safeText(order.country_of_origin)} />
        <KeyValue label="استاندارد" value={safeText(order.standard)} />
        <KeyValue
          label="ارسال جزئی"
          value={order.partial_shipment ? "بله" : "خیر"}
        />
        <KeyValue label="انقضا" value={safeText(order.expire_date)} />
      </CardContent>
    </Card>
  );
}

/* =========================
   ✅ New Contact UI + Position
   - Desktop: inline “Contact Strip” right under header (NOT in right column)
   - Mobile: action is already in sticky footer; tab stays but with better UI
========================= */

function ContactStrip({ order }: { order: MarketplaceOrder }) {
  const waLink = React.useMemo(() => {
    const msg = `${WHATSAPP_MESSAGE}\nشماره ثبت سفارش: ${safeText(
      order.order_number,
    )}`;
    return buildWhatsAppLink(WHATSAPP_NUMBER, msg);
  }, [order.order_number]);

  const displayPhone = `+${String(WHATSAPP_NUMBER).replace(/[^\d]/g, "")}`;

  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-background">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">ارتباط سریع</div>
            <div className="text-xs text-muted-foreground">
              واتساپ:{" "}
              <span className="font-medium text-foreground">
                {displayPhone}
              </span>
              <span className="mx-2 text-muted-foreground">•</span>
              پیام با شماره ثبت سفارش ارسال می‌شود
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
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
      </div>
    </div>
  );
}

function ContactPanelMobile({ order }: { order: MarketplaceOrder }) {
  const waLink = React.useMemo(() => {
    const msg = `${WHATSAPP_MESSAGE}\nشماره ثبت سفارش: ${safeText(
      order.order_number,
    )}`;
    return buildWhatsAppLink(WHATSAPP_NUMBER, msg);
  }, [order.order_number]);

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
   Details body
========================= */

function DetailsBody({
  order,
  isDesktop,
}: {
  order: MarketplaceOrder;
  isDesktop: boolean;
}) {
  if (isDesktop) {
    return (
      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* ✅ better position: contact right under goods area */}
          <GoodsTable order={order} />
          <ContactStrip order={order} />
        </div>

        <div className="space-y-4 md:sticky md:top-4 md:self-start">
          <SummaryCard order={order} />
          <DetailsMeta order={order} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="goods" className="w-full">
        <TabsList className="w-full rounded-2xl">
          <TabsTrigger className="flex-1" value="goods">
            اقلام
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="summary">
            خلاصه
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="meta">
            اطلاعات
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="contact">
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

        {/* ✅ improved mobile contact tab UI */}
        <TabsContent value="contact" className="mt-4">
          <ContactPanelMobile order={order} />
        </TabsContent>
      </Tabs>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 text-sm">
          <div className="grid gap-2">
            <KeyValue
              label="کشور فروشنده"
              value={safeText(order.seller_country)}
              icon={<MapPin className="h-4 w-4" />}
            />
            <KeyValue
              label="تاریخ"
              value={safeText(order.date)}
              icon={<Calendar className="h-4 w-4" />}
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

  async function copyOrderNumber() {
    try {
      await navigator.clipboard.writeText(String(order.order_number ?? ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {}
  }

  const headerBadges = (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="rounded-xl">
        {safeText(order.currency_type)}
      </Badge>
      <Badge variant="outline" className="rounded-xl">
        {order.goods?.length ? `${order.goods.length} ردیف کالا` : "بدون کالا"}
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
  );

  const headerMeta = (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <KeyValue
        label="فروشنده"
        value={safeText(order.user)}
        icon={<User2 className="h-4 w-4" />}
      />
      <KeyValue
        label="کشور فروشنده"
        value={safeText(order.seller_country)}
        icon={<MapPin className="h-4 w-4" />}
      />
      <KeyValue
        label="تاریخ"
        value={safeText(order.date)}
        icon={<Calendar className="h-4 w-4" />}
      />
    </div>
  );

  // Desktop -> Dialog
  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary" className="rounded-xl">
            جزئیات
          </Button>
        </DialogTrigger>

        <DialogContent
          className={cn(
            "p-0 overflow-hidden md:max-w-6xl md:rounded-2xl",
            "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
          )}
        >
          <div className="border-b bg-background">
            <DialogHeader className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 text-right">
                  <DialogTitle className="text-right text-lg">
                    ثبت سفارش {safeText(order.order_number)}
                  </DialogTitle>
                  <DialogDescription className="text-right">
                    مشاهده جزئیات، اقلام و خلاصه مالی
                  </DialogDescription>
                  {headerBadges}
                  {headerMeta}

                  {/* ✅ best position on desktop: right under header */}
                  <div className="pt-2">
                    <ContactStrip order={order} />
                  </div>
                </div>

                <DialogClose asChild></DialogClose>
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[78vh]">
            <div className="p-5">
              <DetailsBody order={order} isDesktop />
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
        <Button variant="secondary" className="rounded-xl">
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

            {headerBadges}

            <div className="mt-3 grid gap-2">
              <KeyValue
                label="فروشنده"
                value={safeText(order.user)}
                icon={<User2 className="h-4 w-4" />}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <KeyValue
                  label="کشور فروشنده"
                  value={safeText(order.seller_country)}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <KeyValue
                  label="تاریخ"
                  value={safeText(order.date)}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Body (scroll) */}
        <ScrollArea className="h-[calc(92dvh-160px-276px)]">
          <div className="p-4">
            <DetailsBody order={order} isDesktop={false} />
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
                  `${WHATSAPP_MESSAGE}\nشماره ثبت سفارش: ${safeText(
                    order.order_number,
                  )}`,
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
