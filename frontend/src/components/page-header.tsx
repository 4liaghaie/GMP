import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  accentClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  accentClassName = "bg-slate-900",
}: PageHeaderProps) {
  return (
    <section className="rounded-[2rem] border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {icon ? (
            <span
              className={cn(
                "grid h-13 w-13 shrink-0 place-items-center rounded-2xl text-white shadow-sm",
                accentClassName,
              )}
            >
              {icon}
            </span>
          ) : null}
          <div>
            {eyebrow ? (
              <Badge variant="secondary" className="mb-3">
                {eyebrow}
              </Badge>
            ) : null}
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
