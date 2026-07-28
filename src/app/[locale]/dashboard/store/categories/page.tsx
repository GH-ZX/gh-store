"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Plus,
  Pencil,
  Check,
  FolderTree,
  Gamepad2,
  Gift,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  productCount: number;
  status: "active" | "inactive";
  source: "G2Bulk" | "Manual";
}

const mockCategories: DashboardCategory[] = [
  {
    id: "c-1",
    slug: "gift-cards",
    nameAr: "بطاقات الهدايا",
    nameEn: "Gift Cards",
    productCount: 24,
    status: "active",
    source: "G2Bulk",
  },
  {
    id: "c-2",
    slug: "gaming-cards",
    nameAr: "بطاقات الألعاب",
    nameEn: "Gaming Cards",
    productCount: 18,
    status: "active",
    source: "G2Bulk",
  },
  {
    id: "c-3",
    slug: "game-topup",
    nameAr: "شحن ألعاب مباشر",
    nameEn: "Game Topup",
    productCount: 42,
    status: "active",
    source: "G2Bulk",
  },
  {
    id: "c-4",
    slug: "software",
    nameAr: "برامج واشتراكات",
    nameEn: "Software & Subs",
    productCount: 8,
    status: "active",
    source: "Manual",
  },
];

export default function DashboardCategoriesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const [categories, setCategories] = useState<DashboardCategory[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState<DashboardCategory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatNameAr, setNewCatNameAr] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [categories, searchQuery]);

  const handleAddCategory = () => {
    if (!newCatNameAr.trim() || !newCatNameEn.trim()) return;
    const slug = newCatNameEn.toLowerCase().replace(/\s+/g, "-");
    const newCat: DashboardCategory = {
      id: `c-${Date.now()}`,
      slug,
      nameAr: newCatNameAr.trim(),
      nameEn: newCatNameEn.trim(),
      productCount: 0,
      status: "active",
      source: "Manual",
    };
    setCategories((prev) => [...prev, newCat]);
    setNewCatNameAr("");
    setNewCatNameEn("");
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isRtl ? "تصنيفات المتجر" : "Categories Management"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isRtl
              ? "إدارة وتقسيم فئات المنتجات والألعاب"
              : "Manage product categories, slugs and display structure"}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="shrink-0 gap-2">
          <Plus className="size-4" />
          {isRtl ? "إضافة قسم جديد" : "Add Category"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "إجمالي الأقسام" : "Total Categories"}
              </p>
              <p className="mt-1 text-2xl font-bold">{categories.length}</p>
            </div>
            <div className="bg-primary/10 text-primary rounded-xl p-3">
              <FolderTree className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "أقسام G2Bulk" : "G2Bulk Synced"}
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {categories.filter((c) => c.source === "G2Bulk").length}
              </p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Layers className="size-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isRtl ? "الأقسام النشطة" : "Active Categories"}
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {categories.filter((c) => c.status === "active").length}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-lg font-semibold">
              {isRtl ? "قائمة الأقسام" : "Categories List"}
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder={isRtl ? "بحث باسم القسم..." : "Search category..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">{isRtl ? "اسم القسم" : "Category Name"}</TableHead>
                <TableHead>{isRtl ? "الرابط السريع (Slug)" : "Slug"}</TableHead>
                <TableHead>{isRtl ? "عدد المنتجات" : "Products"}</TableHead>
                <TableHead>{isRtl ? "المصدر" : "Source"}</TableHead>
                <TableHead className="px-4 text-end">{isRtl ? "تعديل" : "Edit"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 text-sm font-semibold">
                    {isRtl ? c.nameAr : c.nameEn}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {c.slug}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{c.productCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-normal">
                      {c.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditingCategory(c)}
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

      {/* Add Category Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? "إضافة قسم جديد" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{isRtl ? "الاسم بالعربية" : "Name (Arabic)"}</Label>
              <Input
                value={newCatNameAr}
                onChange={(e) => setNewCatNameAr(e.target.value)}
                placeholder="بطاقات بلايستيشن"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
              <Input
                value={newCatNameEn}
                onChange={(e) => setNewCatNameEn(e.target.value)}
                placeholder="PlayStation Cards"
              />
            </div>
            <Button onClick={handleAddCategory} className="mt-2 w-full">
              {isRtl ? "إضافة القسم" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
