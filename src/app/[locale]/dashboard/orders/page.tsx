"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Filter,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantLabel?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentStatus: "paid" | "pending" | "failed";
  paymentMethod: "wallet" | "sam";
  total: number;
  subtotal: number;
  createdAt: string;
  items: OrderItem[];
}

const mockOrders: Order[] = [
  {
    id: "ord-1",
    orderNumber: "GH-89421",
    customerName: "Ahmed Al-Saud",
    customerEmail: "ahmed@example.com",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "wallet",
    total: 25.0,
    subtotal: 25.0,
    createdAt: "2026-07-28T18:30:00Z",
    items: [
      {
        id: "i-1",
        nameAr: "بطاقة بايبال $25",
        nameEn: "PayPal Gift Card $25",
        quantity: 1,
        unitPrice: 25.0,
        totalPrice: 25.0,
      },
    ],
  },
  {
    id: "ord-2",
    orderNumber: "GH-89422",
    customerName: "Sara Khalid",
    customerEmail: "sara@example.com",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "sam",
    total: 50.0,
    subtotal: 50.0,
    createdAt: "2026-07-28T19:15:00Z",
    items: [
      {
        id: "i-2",
        nameAr: "شحن مجوهرات فري فاير",
        nameEn: "Free Fire Diamonds",
        quantity: 2,
        unitPrice: 25.0,
        totalPrice: 50.0,
        variantLabel: "1080 Diamonds",
      },
    ],
  },
  {
    id: "ord-3",
    orderNumber: "GH-89423",
    customerName: "Omar Hassan",
    customerEmail: "omar@example.com",
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "sam",
    total: 100.0,
    subtotal: 100.0,
    createdAt: "2026-07-28T20:00:00Z",
    items: [
      {
        id: "i-3",
        nameAr: "بطاقة باسبلاي 100$",
        nameEn: "PlayStation Store $100",
        quantity: 1,
        unitPrice: 100.0,
        totalPrice: 100.0,
      },
    ],
  },
  {
    id: "ord-4",
    orderNumber: "GH-89424",
    customerName: "Faisal Ahmed",
    customerEmail: "faisal@example.com",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "wallet",
    total: 15.0,
    subtotal: 15.0,
    createdAt: "2026-07-27T14:20:00Z",
    items: [
      {
        id: "i-4",
        nameAr: "شدات ببجي 660 UC",
        nameEn: "PUBG Mobile 660 UC",
        quantity: 1,
        unitPrice: 15.0,
        totalPrice: 15.0,
      },
    ],
  },
  {
    id: "ord-5",
    orderNumber: "GH-89425",
    customerName: "Nora Ali",
    customerEmail: "nora@example.com",
    status: "cancelled",
    paymentStatus: "failed",
    paymentMethod: "sam",
    total: 30.0,
    subtotal: 30.0,
    createdAt: "2026-07-26T11:10:00Z",
    items: [
      {
        id: "i-5",
        nameAr: "بطاقة آيتونز 30$",
        nameEn: "iTunes Gift Card $30",
        quantity: 1,
        unitPrice: 30.0,
        totalPrice: 30.0,
      },
    ],
  },
];

export default function DashboardOrdersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ─── Stats ───────────────────────────────────────────
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter(
    (o) => o.status === "pending" || o.status === "processing",
  ).length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  // ─── Filtered Orders ──────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleUpdateStatus = useCallback(
    (orderId: string, newStatus: Order["status"]) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                paymentStatus: newStatus === "completed" ? "paid" : o.paymentStatus,
              }
            : o,
        ),
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                paymentStatus: newStatus === "completed" ? "paid" : prev.paymentStatus,
              }
            : null,
        );
      }
    },
    [selectedOrder],
  );

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
            <CheckCircle2 className="size-3" />
            {isRtl ? "مكتمل" : "Completed"}
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="gap-1 bg-blue-600 text-white hover:bg-blue-600">
            <RefreshCw className="size-3 animate-spin" />
            {isRtl ? "قيد المعالجة" : "Processing"}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {isRtl ? "معلّق" : "Pending"}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="size-3" />
            {isRtl ? "ملغي" : "Cancelled"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isRtl ? "إدارة الطلبات" : "Order Management"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isRtl
              ? "متابعة وإدارة طلبات العملاء وتغيير حالات الشحن والدفع"
              : "Track, process and manage customer store orders"}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "إجمالي الطلبات" : "Total Orders"}
              </p>
              <p className="mt-1 text-2xl font-bold">{totalOrdersCount}</p>
            </div>
            <div className="bg-primary/10 text-primary rounded-xl p-3">
              <ShoppingBag className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "قيد المعالجة" : "In Progress"}
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "المكتملة" : "Completed"}
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "إجمالي المبيعات" : "Total Revenue"}
              </p>
              <p className="mt-1 text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <DollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table & Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-lg font-semibold">
              {isRtl ? "قائمة الطلبات" : "Orders List"}
            </CardTitle>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder={
                    isRtl ? "بحث برقم الطلب أو العميل..." : "Search order or customer..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                <SelectTrigger className="h-9 w-[140px] text-sm">
                  <Filter className="mr-1 size-3.5" />
                  <SelectValue placeholder={isRtl ? "الحالة" : "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRtl ? "جميع الحالات" : "All Statuses"}</SelectItem>
                  <SelectItem value="pending">{isRtl ? "معلّق" : "Pending"}</SelectItem>
                  <SelectItem value="processing">
                    {isRtl ? "قيد المعالجة" : "Processing"}
                  </SelectItem>
                  <SelectItem value="completed">{isRtl ? "مكتمل" : "Completed"}</SelectItem>
                  <SelectItem value="cancelled">{isRtl ? "ملغي" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">{isRtl ? "رقم الطلب" : "Order ID"}</TableHead>
                <TableHead>{isRtl ? "العميل" : "Customer"}</TableHead>
                <TableHead>{isRtl ? "طريقة الدفع" : "Payment"}</TableHead>
                <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isRtl ? "المبلغ" : "Total"}</TableHead>
                <TableHead className="px-4 text-end">{isRtl ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                    {isRtl ? "لا توجد طلبات تطابق الفلتر" : "No orders match your filter"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="px-4 font-mono font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-muted-foreground text-xs">{order.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-[11px] uppercase">
                        <CreditCard className="text-muted-foreground size-3" />
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      ${order.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-4 text-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>
                  {isRtl
                    ? `تفاصيل الطلب ${selectedOrder.orderNumber}`
                    : `Order Details ${selectedOrder.orderNumber}`}
                </span>
                {getStatusBadge(selectedOrder.status)}
              </DialogTitle>
              <DialogDescription>
                {new Date(selectedOrder.createdAt).toLocaleString(isRtl ? "ar-SA" : "en-US")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Customer info */}
              <div className="bg-muted/30 space-y-1 rounded-lg border p-3">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <User className="size-3.5" />
                  {isRtl ? "بيانات العميل" : "Customer Info"}
                </p>
                <p className="text-sm font-semibold">{selectedOrder.customerName}</p>
                <p className="text-muted-foreground text-xs">{selectedOrder.customerEmail}</p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Package className="size-3.5" />
                  {isRtl ? "المنتجات المشتراة" : "Order Items"}
                </p>
                <div className="divide-y rounded-lg border">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                      <div>
                        <p className="font-medium">{isRtl ? item.nameAr : item.nameEn}</p>
                        {item.variantLabel && (
                          <p className="text-muted-foreground text-xs">{item.variantLabel}</p>
                        )}
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {isRtl ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums">${item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Update Status Actions */}
              <div className="space-y-2 border-t pt-2">
                <p className="text-xs font-semibold">
                  {isRtl ? "تغيير حالة الطلب" : "Change Order Status"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={selectedOrder.status === "processing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "processing")}
                    className="w-full text-xs"
                  >
                    {isRtl ? "قيد المعالجة" : "Processing"}
                  </Button>
                  <Button
                    variant={selectedOrder.status === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "completed")}
                    className="w-full bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                  >
                    {isRtl ? "مكتمل" : "Complete"}
                  </Button>
                  <Button
                    variant={selectedOrder.status === "cancelled" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                    className="w-full text-xs"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
