"use client";

import { Button } from "@/components/ui/button";

export function PaginationControls(props: {
  page: number;
  total: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(props.total / props.pageSize));
  if (props.total <= props.pageSize && props.page === 1) return null;

  return (
    <div
      className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row"
      dir="rtl"
    >
      <p className="text-sm text-muted-foreground">
        {props.total.toLocaleString("fa-IR")} مورد
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.loading || props.page <= 1}
          onClick={() => props.onPageChange(props.page - 1)}
        >
          قبلی
        </Button>
        <span className="min-w-28 text-center text-sm">
          صفحه {props.page.toLocaleString("fa-IR")} از{" "}
          {totalPages.toLocaleString("fa-IR")}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.loading || props.page >= totalPages}
          onClick={() => props.onPageChange(props.page + 1)}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}
