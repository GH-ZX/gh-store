"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";

const footerLinks = [
  {
    titleAr: "المتجر",
    titleEn: "Store",
    links: [
      { labelAr: "جميع المنتجات", labelEn: "All Products", href: "/store" },
      { labelAr: "التوب أب", labelEn: "Top Ups", href: "/store?type=topup" },
      { labelAr: "بطاقات الهدايا", labelEn: "Gift Cards", href: "/store?type=gift_card" },
      { labelAr: "العروض", labelEn: "Sale Offers", href: "/store?type=sale" },
    ],
  },
  {
    titleAr: "الدعم",
    titleEn: "Support",
    links: [
      { labelAr: "اتصل بنا", labelEn: "Contact Us", href: "/contact" },
      { labelAr: "الأسئلة الشائعة", labelEn: "FAQ", href: "/faq" },
      { labelAr: "كيف يعمل", labelEn: "How It Works", href: "/how-it-works" },
      { labelAr: "الإرجاع", labelEn: "Returns", href: "/returns" },
    ],
  },
  {
    titleAr: "القانوني",
    titleEn: "Legal",
    links: [
      { labelAr: "الشروط والأحكام", labelEn: "Terms & Conditions", href: "/terms" },
      { labelAr: "سياسة الخصوصية", labelEn: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export function Footer() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href={`/${locale}`} className="font-bold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRtl
                ? "منصتك الموثوقة لشراء المنتجات الرقمية بأسعار تنافسية وتوصيل فوري."
                : "Your trusted platform for buying digital products at competitive prices with instant delivery."}
            </p>
          </div>

          {/* Link Columns */}
          {footerLinks.map((group) => (
            <div key={group.titleEn} className="space-y-3">
              <h4 className="text-sm font-semibold">
                {isRtl ? group.titleAr : group.titleEn}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={`/${locale}${link.href}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {isRtl ? link.labelAr : link.labelEn}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}.{" "}
            {isRtl ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {isRtl ? "صُنع بـ" : "Made with"}{" "}
            <Heart className="size-3 fill-destructive text-destructive" />{" "}
            {isRtl ? "لأفضل تجربة تسوق" : "for the best shopping experience"}
          </p>
        </div>
      </div>
    </footer>
  );
}
