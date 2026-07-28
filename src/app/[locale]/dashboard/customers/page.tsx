"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Mail,
  Shield,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Mock Customers ──────────────────────────────────

interface MockCustomer {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  status: "active" | "inactive";
  orders: number;
  totalSpent: number;
  joinedAt: string;
  lastOrder: string | null;
}

const customers: MockCustomer[] = [
  {
    id: "1",
    name: "Ahmed Al-Saud",
    email: "ahmed@example.com",
    role: "customer",
    status: "active",
    orders: 12,
    totalSpent: 348.5,
    joinedAt: "2026-01-15",
    lastOrder: "2026-07-28",
  },
  {
    id: "2",
    name: "Sara Khalid",
    email: "sara@example.com",
    role: "customer",
    status: "active",
    orders: 8,
    totalSpent: 215.0,
    joinedAt: "2026-02-20",
    lastOrder: "2026-07-27",
  },
  {
    id: "3",
    name: "Omar Hassan",
    email: "omar@example.com",
    role: "customer",
    status: "active",
    orders: 5,
    totalSpent: 129.75,
    joinedAt: "2026-03-10",
    lastOrder: "2026-07-26",
  },
  {
    id: "4",
    name: "Nora Ali",
    email: "nora@example.com",
    role: "customer",
    status: "inactive",
    orders: 3,
    totalSpent: 75.0,
    joinedAt: "2026-03-22",
    lastOrder: null,
  },
  {
    id: "5",
    name: "Faisal Ahmed",
    email: "faisal@example.com",
    role: "customer",
    status: "active",
    orders: 15,
    totalSpent: 542.3,
    joinedAt: "2026-01-05",
    lastOrder: "2026-07-28",
  },
  {
    id: "6",
    name: "Layla Mohammed",
    email: "layla@example.com",
    role: "customer",
    status: "active",
    orders: 7,
    totalSpent: 198.0,
    joinedAt: "2026-04-18",
    lastOrder: "2026-07-25",
  },
  {
    id: "7",
    name: "Khalid Omar",
    email: "khalid@example.com",
    role: "admin",
    status: "active",
    orders: 0,
    totalSpent: 0,
    joinedAt: "2026-01-01",
    lastOrder: null,
  },
  {
    id: "8",
    name: "Mona Ibrahim",
    email: "mona@example.com",
    role: "customer",
    status: "active",
    orders: 22,
    totalSpent: 890.0,
    joinedAt: "2025-11-12",
    lastOrder: "2026-07-27",
  },
  {
    id: "9",
    name: "Sultan Al-Qahtani",
    email: "sultan@example.com",
    role: "customer",
    status: "inactive",
    orders: 1,
    totalSpent: 14.99,
    joinedAt: "2026-06-01",
    lastOrder: "2026-06-01",
  },
  {
    id: "10",
    name: "Hind Abdullah",
    email: "hind@example.com",
    role: "customer",
    status: "active",
    orders: 9,
    totalSpent: 312.0,
    joinedAt: "2026-02-28",
    lastOrder: "2026-07-24",
  },
  {
    id: "11",
    name: "Abdulaziz Mohammed",
    email: "aziz@example.com",
    role: "customer",
    status: "active",
    orders: 6,
    totalSpent: 178.5,
    joinedAt: "2026-05-14",
    lastOrder: "2026-07-22",
  },
  {
    id: "12",
    name: "Nouf Saleh",
    email: "nouf@example.com",
    role: "customer",
    status: "active",
    orders: 14,
    totalSpent: 425.75,
    joinedAt: "2025-12-03",
    lastOrder: "2026-07-26",
  },
  {
    id: "13",
    name: "Turki Al-Otaibi",
    email: "turki@example.com",
    role: "customer",
    status: "inactive",
    orders: 2,
    totalSpent: 39.98,
    joinedAt: "2026-06-20",
    lastOrder: "2026-07-01",
  },
  {
    id: "14",
    name: "Reem Fahad",
    email: "reem@example.com",
    role: "customer",
    status: "active",
    orders: 11,
    totalSpent: 467.0,
    joinedAt: "2026-01-30",
    lastOrder: "2026-07-28",
  },
];

const ITEMS_PER_PAGE = 10;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CustomersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Summary Stats ─────────────────────────────────
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  // ─── Filtering & Pagination ────────────────────────
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isRtl ? "العملاء" : "Customers"}</h1>
          <p className="text-muted-foreground mt-1">
            {isRtl ? "إدارة وعرض جميع عملاء المتجر" : "Manage and view all store customers"}
          </p>
        </div>
      </div>

      {/* ─── Summary Stats ───────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <Users className="text-primary size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {isRtl ? "إجمالي العملاء" : "Total Customers"}
              </p>
              <p className="text-2xl font-bold">{totalCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Users className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{isRtl ? "نشط" : "Active"}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeCustomers}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <DollarSign className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {isRtl ? "إجمالي الإنفاق" : "Total Spent"}
              </p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search & Table ──────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-lg">{isRtl ? "جميع العملاء" : "All Customers"}</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder={isRtl ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
                className="h-9 pl-9 text-sm"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">{isRtl ? "العميل" : "Customer"}</TableHead>
                <TableHead>{isRtl ? "الدور" : "Role"}</TableHead>
                <TableHead className="hidden sm:table-cell">
                  {isRtl ? "الحالة" : "Status"}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {isRtl ? "الطلبات" : "Orders"}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {isRtl ? "الإجمالي" : "Total"}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {isRtl ? "آخر طلب" : "Last Order"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="text-muted-foreground/50 size-6" />
                      <p>{isRtl ? "لا توجد نتائج للبحث" : "No customers match your search"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((customer) => (
                  <TableRow key={customer.id} className="group">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Mail className="size-3" />
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={customer.role === "admin" ? "default" : "secondary"}
                        className="gap-1"
                      >
                        <Shield className="size-3" />
                        {customer.role === "admin"
                          ? isRtl
                            ? "مدير"
                            : "Admin"
                          : isRtl
                            ? "عميل"
                            : "Customer"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          customer.status === "active"
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            customer.status === "active" ? "bg-green-500" : "bg-muted-foreground/50"
                          }`}
                        />
                        {customer.status === "active"
                          ? isRtl
                            ? "نشط"
                            : "Active"
                          : isRtl
                            ? "غير نشط"
                            : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1 tabular-nums">
                        <ShoppingBag className="text-muted-foreground size-3" />
                        {customer.orders}
                      </span>
                    </TableCell>
                    <TableCell className="hidden font-medium tabular-nums md:table-cell">
                      ${customer.totalSpent.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm lg:table-cell">
                      {formatDate(customer.lastOrder, locale)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* ─── Pagination ────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-muted-foreground text-sm">
              {isRtl
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className={`size-4 ${isRtl ? "rotate-180" : ""}`} />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="icon"
                  className="size-8 text-xs"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className={`size-4 ${isRtl ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
