"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard } from "lucide-react";

/**
 * Admin Dashboard Layout.
 *
 * Renders the sidebar on large screens and a Sheet-based mobile nav trigger.
 * Already protected by middleware (requires admin role).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <DashboardSidebar className="hidden lg:flex shrink-0" />

      {/* Mobile content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar with nav trigger */}
        <div className="lg:hidden flex items-center gap-2 border-b px-4 h-14">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="size-8" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className="w-72 p-0">
              <DashboardSidebar className="!flex !w-full border-none h-full" />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LayoutDashboard className="size-4 text-muted-foreground" />
            <span>{isRtl ? "لوحة التحكم" : "Dashboard"}</span>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-x-auto bg-background">
          <div className="mx-auto max-w-7xl p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
