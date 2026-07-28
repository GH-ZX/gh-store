"use client";

import { type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Menu, LayoutDashboard } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/**
 * Client shell for the admin dashboard.
 *
 * Renders the sidebar on large screens and a Sheet-based mobile nav trigger.
 * Authorization lives in the server layout that renders this — never here.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const params = useParams<{ locale: string }>();
  const isRtl = params?.locale === "ar";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <DashboardSidebar className="hidden shrink-0 lg:flex" />

      {/* Mobile content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar with nav trigger */}
        <div className="flex h-14 items-center gap-2 border-b px-4 lg:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className="w-72 p-0">
              <DashboardSidebar className="!flex h-full !w-full border-none" />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LayoutDashboard className="text-muted-foreground size-4" />
            <span>{isRtl ? "لوحة التحكم" : "Dashboard"}</span>
          </div>
        </div>

        {/* Main content area */}
        <main className="bg-background flex-1 overflow-x-auto">
          <div className="mx-auto max-w-7xl p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
