"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="">
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="h-14 w-14 text-destructive" />

        <h1 className="text-3xl font-bold">403 — دسترسی غیرمجاز</h1>

        <p className="max-w-md text-muted-foreground">
          شما مجوز دسترسی به این بخش را ندارید. فقط مدیر سیستم می‌تواند به این
          صفحه دسترسی داشته باشد.
        </p>

        <Button onClick={() => (window.location.href = "/dashboard")}>
          بازگشت به داشبورد
        </Button>
      </div>
    </div>
  );
}
