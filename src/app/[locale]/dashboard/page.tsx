"use client";

import { useParams } from "next/navigation";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Activity,
} from "lucide-react";
import { Chart } from "@/components/dashboard/chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Mock Dashboard Data ─────────────────────────────

const statsCards = [
  {
    title: "Total Revenue",
    titleAr: "إجمالي الإيرادات",
    value: "$12,426.80",
    change: "+18.2%",
    trend: "up" as const,
    icon: DollarSign,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Total Orders",
    titleAr: "إجمالي الطلبات",
    value: "342",
    change: "+12.5%",
    trend: "up" as const,
    icon: ShoppingBag,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Total Customers",
    titleAr: "إجمالي العملاء",
    value: "1,284",
    change: "+5.7%",
    trend: "up" as const,
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "Total Profit",
    titleAr: "إجمالي الأرباح",
    value: "$3,842.50",
    change: "-2.3%",
    trend: "down" as const,
    icon: TrendingUp,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
];

const revenueData = [
  { month: "Jan", revenue: 8450, profit: 2540 },
  { month: "Feb", revenue: 9120, profit: 2730 },
  { month: "Mar", revenue: 8780, profit: 2630 },
  { month: "Apr", revenue: 10230, profit: 3100 },
  { month: "May", revenue: 11450, profit: 3480 },
  { month: "Jun", revenue: 10820, profit: 3250 },
  { month: "Jul", revenue: 12426, profit: 3842 },
];

const categoryData = [
  { name: "Top-Up", value: 45 },
  { name: "Gift Cards", value: 22 },
  { name: "VPN", value: 13 },
  { name: "Streaming", value: 10 },
  { name: "Software", value: 7 },
  { name: "AI Subs", value: 3 },
];

const recentOrders = [
  {
    id: "GH-1042",
    customer: "Ahmed Al-Saud",
    email: "ahmed@example.com",
    items: 2,
    total: "$29.99",
    status: "completed" as const,
    date: "2026-07-28",
  },
  {
    id: "GH-1041",
    customer: "Sara Khalid",
    email: "sara@example.com",
    items: 1,
    total: "$14.97",
    status: "processing" as const,
    date: "2026-07-28",
  },
  {
    id: "GH-1040",
    customer: "Omar Hassan",
    email: "omar@example.com",
    items: 3,
    total: "$49.50",
    status: "pending" as const,
    date: "2026-07-27",
  },
  {
    id: "GH-1039",
    customer: "Nora Ali",
    email: "nora@example.com",
    items: 1,
    total: "$25.00",
    status: "completed" as const,
    date: "2026-07-27",
  },
  {
    id: "GH-1038",
    customer: "Faisal Ahmed",
    email: "faisal@example.com",
    items: 4,
    total: "$89.96",
    status: "refunded" as const,
    date: "2026-07-26",
  },
];

const statusConfig: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Completed", labelAr: "مكتمل", variant: "default" },
  processing: { label: "Processing", labelAr: "قيد المعالجة", variant: "secondary" },
  pending: { label: "Pending", labelAr: "معلق", variant: "outline" },
  refunded: { label: "Refunded", labelAr: "مسترجع", variant: "destructive" },
};

const topProducts = [
  { name: "PUBG Mobile UC", sales: 142, revenue: "$2,130.00" },
  { name: "Google Play $25", sales: 98, revenue: "$2,450.00" },
  { name: "Free Fire Diamonds", sales: 76, revenue: "$684.00" },
  { name: "Netflix Premium", sales: 54, revenue: "$809.00" },
  { name: "NordVPN 1 Year", sales: 41, revenue: "$1,435.00" },
];

const providerStats = [
  { name: "G2Bulk", total: 287, success: 271, failed: 16, rate: "94.4%" },
  { name: "SAM API", total: 342, success: 342, failed: 0, rate: "100%" },
];

// ─── Component ───────────────────────────────────────

export default function DashboardOverview() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isRtl ? "لوحة التحكم" : "Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRtl
            ? "نظرة عامة على متجرك اليوم"
            : "An overview of your store today"}
        </p>
      </div>

      {/* ─── Stats Cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isRtl ? stat.titleAr : stat.title}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                </div>
                <div className={`flex size-10 items-center justify-center rounded-full ${stat.bg}`}>
                  <stat.icon className={`size-5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="size-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownRight className="size-3.5 text-red-600 dark:text-red-400" />
                )}
                <span className={stat.trend === "up" ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground">
                  {isRtl ? "مقارنة بالشهر الماضي" : "vs last month"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Charts Row ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Chart
          type="area"
          data={revenueData}
          series={[
            { key: "revenue", name: "Revenue", nameAr: "الإيرادات" },
            { key: "profit", name: "Profit", nameAr: "الأرباح" },
          ]}
          xAxisKey="month"
          title={isRtl ? "الإيرادات والأرباح" : "Revenue & Profit"}
          titleAr="الإيرادات والأرباح"
          height={320}
        />
        <Chart
          type="pie"
          data={categoryData}
          series={[{ key: "value", name: "Sales", nameAr: "المبيعات" }]}
          xAxisKey="name"
          title={isRtl ? "المبيعات حسب التصنيف" : "Sales by Category"}
          titleAr="المبيعات حسب التصنيف"
          height={320}
        />
      </div>

      {/* ─── Bottom Grid: Recent Orders + Top Products ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="size-5 text-muted-foreground" />
              {isRtl ? "آخر الطلبات" : "Recent Orders"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">{isRtl ? "الطلب" : "Order"}</TableHead>
                  <TableHead>{isRtl ? "العميل" : "Customer"}</TableHead>
                  <TableHead className="hidden sm:table-cell">{isRtl ? "المبلغ" : "Amount"}</TableHead>
                  <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => {
                  const sc = statusConfig[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="px-4 font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.customer}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">{order.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{order.total}</TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>
                          {isRtl ? sc.labelAr : sc.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="size-5 text-muted-foreground" />
              {isRtl ? "أفضل المنتجات" : "Top Products"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">{isRtl ? "المنتج" : "Product"}</TableHead>
                  <TableHead>{isRtl ? "المبيعات" : "Sales"}</TableHead>
                  <TableHead>{isRtl ? "الإيرادات" : "Revenue"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="px-4 font-medium">{product.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${(product.sales / Math.max(...topProducts.map((p) => p.sales))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm tabular-nums">{product.sales}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{product.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ─── Provider Stats ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="size-5 text-muted-foreground" />
            {isRtl ? "إحصائيات المزوّدين" : "Provider Statistics"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">{isRtl ? "المزوّد" : "Provider"}</TableHead>
                <TableHead>{isRtl ? "إجمالي الطلبات" : "Total"}</TableHead>
                <TableHead>{isRtl ? "ناجحة" : "Success"}</TableHead>
                <TableHead>{isRtl ? "فاشلة" : "Failed"}</TableHead>
                <TableHead>{isRtl ? "نسبة النجاح" : "Success Rate"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerStats.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="px-4 font-medium">{p.name}</TableCell>
                  <TableCell className="tabular-nums">{p.total}</TableCell>
                  <TableCell className="tabular-nums text-green-600 dark:text-green-400">{p.success}</TableCell>
                  <TableCell className="tabular-nums text-red-600 dark:text-red-400">{p.failed}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: p.rate }}
                        />
                      </div>
                      <span className="text-sm font-medium tabular-nums">{p.rate}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
