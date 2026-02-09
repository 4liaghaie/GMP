import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex flex-col items-center justify-between gap-3 text-xs md:flex-row">
          {/* Brand + text */}
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} GMP — پلتفرم ارتباط ثبت سفارش و کالا
          </p>

          {/* Links */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              حریم خصوصی
            </Link>
            <Link href="#" className="hover:text-foreground">
              پشتیبانی
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
