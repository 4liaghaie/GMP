import Link from "next/link";
import { Phone } from "lucide-react";

import {
  formatSupportPhone,
  SUPPORT_PHONE_HREF,
} from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex flex-col items-center justify-between gap-3 text-xs md:flex-row">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} GMP — پلتفرم ارتباط ثبت سفارش و کالا
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              حریم خصوصی
            </Link>
            <a
              href={SUPPORT_PHONE_HREF}
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>شماره پشتیبانی:</span>
              <span dir="ltr">{formatSupportPhone()}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
