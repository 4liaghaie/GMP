"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";

import type {
  MarketplaceOrder,
  OrderGood,
} from "@/components/marketplace/orders-list";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

/* -------- utils -------- */

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

/* -------- UI blocks -------- */

function GoodMobileCard({ g }: { g: OrderGood }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-2 p-4">
        <div className="text-sm font-medium leading-6">
          {safeText(g.description)}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="rounded-xl">
            HS: {safeText(g.hs_code)}
          </Badge>
          <Badge variant="outline" className="rounded-xl">
            مبدا: {safeText(g.origin)}
          </Badge>
          <Badge variant="outline" className="rounded-xl">
            واحد: {safeText(g.unit)}
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">NW</span>
            <span className="font-medium">{safeText(g.nw_kg)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">GW</span>
            <span className="font-medium">{safeText(g.gw_kg)}</span>
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

function SummaryCard({ order }: { order: MarketplaceOrder }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">خلاصه</CardTitle>
        <CardDescription>
          ارقام به {safeText(order.currency_type)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ارزش کالا</span>
          <span className="font-medium">
            {formatNumLike(order.total_value)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">کرایه حمل</span>
          <span className="font-medium">
            {formatNumLike(order.freight_price)}
          </span>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">جمع کل</span>
          <span className="text-base font-semibold">
            {formatNumLike(order.sub_total)}
          </span>
        </div>

        <Separator />

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">وزن خالص</span>
            <span className="font-medium">{formatNumLike(order.total_nw)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">وزن ناخالص</span>
            <span className="font-medium">{formatNumLike(order.total_gw)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تعداد کل</span>
            <span className="font-medium">
              {formatNumLike(order.total_qty)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailsMeta({ order }: { order: MarketplaceOrder }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">اطلاعات تکمیلی</CardTitle>
        <CardDescription>شرایط، مبدا، استاندارد و وضعیت ارسال</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">تحویل</span>
          <span className="font-medium">
            {safeText(order.terms_of_delivery)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">پرداخت</span>
          <span className="font-medium">
            {safeText(order.terms_of_payment)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">حمل</span>
          <span className="font-medium">
            {safeText(order.means_of_transport)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">مبدا</span>
          <span className="font-medium">
            {safeText(order.country_of_origin)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">استاندارد</span>
          <span className="font-medium">{safeText(order.standard)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ارسال جزئی</span>
          <span className="font-medium">
            {order.partial_shipment ? "بله" : "خیر"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">انقضا</span>
          <span className="font-medium">{safeText(order.expire_date)}</span>
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
          <div className="text-sm text-muted-foreground">
            کالایی ثبت نشده است.
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="rounded-2xl border bg-card">
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
                    <TableRow key={g.uuid}>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {safeText(g.description)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          مبدا: {safeText(g.origin)} • واحد: {safeText(g.unit)}{" "}
                          • NW: {safeText(g.nw_kg)} • GW: {safeText(g.gw_kg)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {safeText(g.hs_code)}
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

/**
 * Desktop: no tabs (clean 2-column)
 * Mobile: tabs (good UX)
 */
function DetailsBody({
  order,
  isDesktop,
}: {
  order: MarketplaceOrder;
  isDesktop: boolean;
}) {
  if (isDesktop) {
    return (
      <div className="grid gap-4 md:grid-cols-[1fr_340px]">
        <GoodsTable order={order} />

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
      </Tabs>

      {/* small fixed info card on phone (kept) */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">کشور فروشنده</span>
            <span className="font-medium">
              {safeText(order.seller_country)}
            </span>
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

/* -------- Main exported component -------- */

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
            // ✅ move the built-in X to the LEFT for RTL
            "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
          )}
        >
          <div className="border-b bg-background">
            <DialogHeader className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 text-right">
                  <DialogTitle className="text-right">
                    ثبت سفارش {safeText(order.order_number)}
                  </DialogTitle>
                  <DialogDescription className="text-right">
                    فروشنده: {safeText(order.user)} • کشور فروشنده:{" "}
                    {safeText(order.seller_country)} • تاریخ:{" "}
                    {safeText(order.date)}
                  </DialogDescription>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
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
                </div>

                {/* keep "بستن" too if you want */}
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
  // Mobile -> Sheet (fixed)
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
          // ✅ move built-in X to LEFT for RTL
          "[&>button]:left-4 [&>button]:right-auto [&>button]:top-4",
        )}
      >
        {/* Header */}
        <div className="border-b bg-background">
          <SheetHeader className="p-4 text-right">
            <SheetTitle className="text-right">
              ثبت سفارش {safeText(order.order_number)}
            </SheetTitle>
            <SheetDescription className="text-right">
              {safeText(order.user)} • {safeText(order.seller_country)} •{" "}
              {safeText(order.date)}
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
          </SheetHeader>
        </div>

        {/* Body (scroll) */}
        <ScrollArea className="h-[calc(92dvh-110px-76px)]">
          <div className="p-4">
            <DetailsBody order={order} isDesktop={false} />
            <div className="h-4" />
          </div>
        </ScrollArea>

        {/* ✅ Sticky footer (always visible) */}
        <div className="sticky bottom-0 z-10 border-t bg-background/95 p-4 backdrop-blur">
          <SheetClose asChild>
            <Button className="w-full rounded-2xl" variant="outline">
              بستن
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
