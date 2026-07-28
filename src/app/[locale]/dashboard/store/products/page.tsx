"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Package,
  Search,
  Plus,
  Pencil,
  Eye,
  Star,
  Check,
  X,
  Tag,
  DollarSign,
  Layers,
  Filter,
  Gamepad2,
  Gift,
  RefreshCw,
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
import { Label } from "@/components/ui/label";
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

interface DashboardProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  type: "topup" | "gift_card" | "code";
  price: number;
  originalPrice?: number;
  status: "active" | "inactive";
  isFeatured: boolean;
  salesCount: number;
  provider: string;
}

const mockProducts: DashboardProduct[] = [
  {
    id: "p-1",
    nameAr: "بطاقة بايبال $25",
    nameEn: "PayPal Gift Card $25",
    category: "Gift Cards",
    type: "gift_card",
    price: 25.0,
    originalPrice: 27.0,
    status: "active",
    isFeatured: true,
    salesCount: 142,
    provider: "G2Bulk",
  },
  {
    id: "p-2",
    nameAr: "بطاقة باسبلاي 50$",
    nameEn: "PlayStation Store $50",
    category: "Gaming Cards",
    type: "gift_card",
    price: 50.0,
    status: "active",
    isFeatured: true,
    salesCount: 98,
    provider: "G2Bulk",
  },
  {
    id: "p-3",
    nameAr: "شحن مجوهرات فري فاير 1080",
    nameEn: "Free Fire 1080 Diamonds",
    category: "Game Topup",
    type: "topup",
    price: 10.0,
    originalPrice: 12.0,
    status: "active",
    isFeatured: false,
    salesCount: 310,
    provider: "G2Bulk",
  },
  {
    id: "p-4",
    nameAr: "شدات ببجي 660 UC",
    nameEn: "PUBG Mobile 660 UC",
    category: "Game Topup",
    type: "topup",
    price: 15.0,
    status: "active",
    isFeatured: true,
    salesCount: 520,
    provider: "G2Bulk",
  },
  {
    id: "p-5",
    nameAr: "بطاقة آيتونز 100$",
    nameEn: "iTunes Gift Card $100",
    category: "Gift Cards",
    type: "gift_card",
    price: 100.0,
    status: "inactive",
    isFeatured: false,
    salesCount: 45,
    provider: "G2Bulk",
  },
];

export default function DashboardProductsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const [products, setProducts] = useState<DashboardProduct[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<DashboardProduct | null>(null);

  // ─── Stats ───────────────────────────────────────────
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const featuredProducts = products.filter((p) => p.isFeatured).length;

  // ─── Filtering ───────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [products, searchQuery, typeFilter]);

  const toggleStatus = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p,
      ),
    );
  }, []);

  const toggleFeatured = useCallback((id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p)));
  }, []);

  const handleSaveProduct = useCallback(() => {
    if (!editingProduct) return;
    setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? editingProduct : p)));
    setEditingProduct(null);
  }, [editingProduct]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isRtl ? "إدارة المنتجات" : "Product Catalog"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isRtl
              ? "عرض وتعديل أسعار وحالات المنتجات والمزامنة من G2Bulk"
              : "Manage products, pricing, featured items and catalog sync"}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "إجمالي المنتجات" : "Total Products"}
              </p>
              <p className="mt-1 text-2xl font-bold">{totalProducts}</p>
            </div>
            <div className="bg-primary/10 text-primary rounded-xl p-3">
              <Package className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "نشط حالياً" : "Active"}
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeProducts}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Check className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "المميزة" : "Featured"}
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {featuredProducts}
              </p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Star className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-lg font-semibold">
              {isRtl ? "قائمة المنتجات" : "Products List"}
            </CardTitle>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder={
                    isRtl ? "بحث باسم المنتج أو القسم..." : "Search product or category..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={(val) => val && setTypeFilter(val)}>
                <SelectTrigger className="h-9 w-[140px] text-sm">
                  <Filter className="mr-1 size-3.5" />
                  <SelectValue placeholder={isRtl ? "النوع" : "Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRtl ? "الكل" : "All Types"}</SelectItem>
                  <SelectItem value="topup">{isRtl ? "شحن ألعاب" : "Topup"}</SelectItem>
                  <SelectItem value="gift_card">{isRtl ? "بطاقات هدايا" : "Gift Cards"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">{isRtl ? "المنتج" : "Product"}</TableHead>
                <TableHead>{isRtl ? "القسم" : "Category"}</TableHead>
                <TableHead>{isRtl ? "السعر" : "Price"}</TableHead>
                <TableHead>{isRtl ? "مميز" : "Featured"}</TableHead>
                <TableHead>{isRtl ? "الحالة" : "Status"}</TableHead>
                <TableHead className="px-4 text-end">{isRtl ? "تعديل" : "Edit"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-4 font-medium">
                    <div>
                      <p className="text-sm font-semibold">{isRtl ? p.nameAr : p.nameEn}</p>
                      <p className="text-muted-foreground text-xs">{p.nameEn}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {p.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    ${p.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => toggleFeatured(p.id)}
                    >
                      <Star
                        className={cn(
                          "size-4",
                          p.isFeatured
                            ? "fill-amber-400 text-amber-500"
                            : "text-muted-foreground/40",
                        )}
                      />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={p.status === "active" ? "default" : "secondary"}
                      size="sm"
                      onClick={() => toggleStatus(p.id)}
                      className={cn(
                        "h-7 px-2.5 text-xs",
                        p.status === "active" && "bg-emerald-600 text-white hover:bg-emerald-700",
                      )}
                    >
                      {p.status === "active"
                        ? isRtl
                          ? "نشط"
                          : "Active"
                        : isRtl
                          ? "غير نشط"
                          : "Inactive"}
                    </Button>
                  </TableCell>
                  <TableCell className="px-4 text-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditingProduct(p)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRtl ? "تعديل بيانات المنتج" : "Edit Product Details"}</DialogTitle>
              <DialogDescription>{editingProduct.nameEn}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{isRtl ? "الاسم بالعربية" : "Name (Arabic)"}</Label>
                <Input
                  value={editingProduct.nameAr}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRtl ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
                <Input
                  value={editingProduct.nameEn}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRtl ? "السعر ($)" : "Price ($)"}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <Button onClick={handleSaveProduct} className="mt-2 w-full">
                {isRtl ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
