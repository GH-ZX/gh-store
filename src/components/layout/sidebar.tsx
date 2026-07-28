"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  TicketPercent,
  BarChart3,
  Cable,
  ScrollText,
  Globe,
  ChevronDown,
  ChevronLeft,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavSection {
  title: string;
  titleAr: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  labelAr: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    titleAr: "نظرة عامة",
    items: [
      {
        label: "Dashboard",
        labelAr: "لوحة التحكم",
        href: "/dashboard",
        icon: <LayoutDashboard className="size-4" />,
      },
    ],
  },
  {
    title: "Website",
    titleAr: "الموقع",
    items: [
      {
        label: "Settings",
        labelAr: "الإعدادات",
        href: "/dashboard/website/settings",
        icon: <Settings className="size-4" />,
      },
      {
        label: "Homepage",
        labelAr: "الصفحة الرئيسية",
        href: "/dashboard/website/homepage",
        icon: <Globe className="size-4" />,
      },
      {
        label: "SEO",
        labelAr: "تحسين محركات البحث",
        href: "/dashboard/website/seo",
        icon: <ScrollText className="size-4" />,
      },
      {
        label: "Themes",
        labelAr: "المظاهر",
        href: "/dashboard/website/themes",
        icon: <Package className="size-4" />,
      },
    ],
  },
  {
    title: "Store",
    titleAr: "المتجر",
    items: [
      {
        label: "Products",
        labelAr: "المنتجات",
        href: "/dashboard/store/products",
        icon: <Package className="size-4" />,
      },
      {
        label: "Categories",
        labelAr: "التصنيفات",
        href: "/dashboard/store/categories",
        icon: <ShoppingBag className="size-4" />,
      },
      {
        label: "Inventory",
        labelAr: "المخزون",
        href: "/dashboard/store/inventory",
        icon: <Package className="size-4" />,
      },
    ],
  },
  {
    title: "Orders",
    titleAr: "الطلبات",
    items: [
      {
        label: "All Orders",
        labelAr: "جميع الطلبات",
        href: "/dashboard/orders",
        icon: <ShoppingBag className="size-4" />,
      },
    ],
  },
  {
    title: "Customers",
    titleAr: "العملاء",
    items: [
      {
        label: "All Customers",
        labelAr: "جميع العملاء",
        href: "/dashboard/customers",
        icon: <Users className="size-4" />,
      },
    ],
  },
  {
    title: "Marketing",
    titleAr: "التسويق",
    items: [
      {
        label: "Coupons",
        labelAr: "الكوبونات",
        href: "/dashboard/coupons",
        icon: <TicketPercent className="size-4" />,
      },
    ],
  },
  {
    title: "Analytics",
    titleAr: "التحليلات",
    items: [
      {
        label: "Sales",
        labelAr: "المبيعات",
        href: "/dashboard/analytics/sales",
        icon: <BarChart3 className="size-4" />,
      },
      {
        label: "Revenue",
        labelAr: "الإيرادات",
        href: "/dashboard/analytics/revenue",
        icon: <BarChart3 className="size-4" />,
      },
    ],
  },
  {
    title: "System",
    titleAr: "النظام",
    items: [
      {
        label: "Providers",
        labelAr: "المزوّدون",
        href: "/dashboard/providers",
        icon: <Cable className="size-4" />,
      },
      {
        label: "Logs",
        labelAr: "السجلات",
        href: "/dashboard/logs/audit",
        icon: <ScrollText className="size-4" />,
      },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: SidebarProps) {
  const params = useParams<{ locale: string }>();
  const pathname = usePathname();
  const isRtl = params?.locale === "ar";
  const locale = params?.locale || "ar";
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === `/${locale}/dashboard`;
    return pathname.startsWith(`/${locale}${href}`);
  };

  return (
    <aside
      className={cn(
        "bg-sidebar flex flex-col border-l transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[260px]",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href={`/${locale}`} className="text-sm font-bold tracking-tight">
            {APP_NAME}
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform",
              collapsed && "rotate-180",
              isRtl && "rotate-180",
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h4 className="text-muted-foreground mb-1 px-3 text-[10px] font-semibold tracking-wider uppercase">
                  {isRtl ? section.titleAr : section.title}
                </h4>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={`/${locale}${item.href}`}
                      className={cn(
                        "inline-flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-normal transition-colors",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-start">
                            {isRtl ? item.labelAr : item.label}
                          </span>
                          {item.badge && (
                            <span className="bg-primary text-primary-foreground flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-medium">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-2">
        <Link
          href={`/${locale}`}
          className={cn(
            "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground inline-flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-normal transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && (isRtl ? "العودة للمتجر" : "Back to Store")}
        </Link>
      </div>
    </aside>
  );
}
