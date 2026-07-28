"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Zap,
  RefreshCw,
  Check,
  X,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Gamepad2,
  Key,
  Wallet,
  Database,
  Save,
  Eye,
  EyeOff,
  Pencil,
  Package,
  Info,
  LayoutGrid,
  List,
  Image,
  CreditCard,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowDownUp,
  Settings2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────

interface G2BulkCategory {
  id: number;
  title: string;
  count: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
}

interface G2BulkGame {
  code: string;
  name: string;
  description?: string;
  image_url?: string;
  region?: string;
}

interface G2BulkUser {
  username: string;
  firstName: string;
  balance: number;
}

interface SyncAlert {
  type: "success" | "error";
  message: string;
  detail?: string;
}

interface SAMWallet {
  id: string;
  provider: string;
  providerDisplayName: string;
  label: string;
  phone: string;
  walletAddress?: string;
  accountNumber?: string;
  cashCode?: string;
  region?: string;
  status: string;
  balances?: { currency: string; amount: number; label: string | null }[] | null;
}

interface SAMAdvancedConfig {
  profitMargin: number;
  defaultWalletId: string | null;
  defaultCurrency: "USD" | "SYP" | "EUR";
  webhookUrl: string;
  autoConfirm: boolean;
}

interface SAMTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  counterparty: string;
  description: string | null;
  status: string | null;
  occurredAt: string;
}

type ViewMode = "grid" | "list";
type SelectionFilter = "all" | "selected" | "unselected";

// ─── Stat Card ───────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn(accent && "border-primary/30 bg-primary/5")}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
            {sub && <p className="text-muted-foreground truncate text-xs">{sub}</p>}
          </div>
          <div
            className={cn(
              "shrink-0 rounded-xl p-2.5",
              accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ───────────────────────────────────────

export default function ProvidersPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "connected" | "failed"
  >("idle");
  const [connectionMsg, setConnectionMsg] = useState("");
  const [userInfo, setUserInfo] = useState<G2BulkUser | null>(null);

  const [categories, setCategories] = useState<G2BulkCategory[]>([]);
  const [games, setGames] = useState<G2BulkGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [alert, setAlert] = useState<SyncAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCatIds, setSelectedCatIds] = useState<Set<number>>(new Set());
  const [selectedGameCodes, setSelectedGameCodes] = useState<Set<string>>(new Set());
  const [carouselCodes, setCarouselCodes] = useState<Set<string>>(new Set());

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectionFilter, setSelectionFilter] = useState<SelectionFilter>("all");

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [apiKeyLocked, setApiKeyLocked] = useState(true);
  const [g2bulkExpanded, setG2bulkExpanded] = useState(true);
  const [samExpanded, setSamExpanded] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const GAMES_PAGE_SIZE = 20;
  const CATEGORIES_PAGE_SIZE = 20;

  // ─── Fetch catalog ──────────────────────────────
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      setConnectionStatus("testing");
      const res = await fetch("/api/g2bulk/catalog");
      const data = await res.json();
      if (!res.ok || !data.success) {
        setConnectionStatus("failed");
        setConnectionMsg(data.message || "Failed to connect to G2Bulk");
        return;
      }
      setConnectionStatus("connected");
      setCategories(data.voucherCategories || []);
      setGames(data.games || []);
      setUserInfo(data.user || null);
      setConnectionMsg(
        data.user
          ? `@${data.user.username} · $${Number(data.user.balance).toFixed(2)} · ${data.counts.products} categories`
          : `${data.counts.products} voucher categories, ${data.counts.games} games`,
      );
    } catch (err) {
      setConnectionStatus("failed");
      setConnectionMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setAlert(null);
    try {
      const res = await fetch("/api/g2bulk/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setShowApiKey(false);
      setApiKeyLocked(true);
      setApiKeyInput("");
      setAlert({ type: "success", message: "API key saved", detail: data.maskedKey });
      await fetchCatalog();
    } catch (err) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSavingKey(false);
    }
  };

  const handleSync = async () => {
    if (selectedCatIds.size === 0 && selectedGameCodes.size === 0) return;
    setSyncing(true);
    setAlert(null);
    try {
      const res = await fetch("/api/g2bulk/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: [...selectedCatIds],
          games: [...selectedGameCodes],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: data.message,
          detail: `Created: ${data.results.productsCreated} · Updated: ${data.results.productsUpdated}`,
        });
        setSelectedCatIds(new Set());
        setSelectedGameCodes(new Set());
        setCarouselCodes(new Set());
      } else {
        setAlert({ type: "error", message: data.message });
        if (data.results?.errors?.length) console.error("Sync errors:", data.results.errors);
      }
    } catch (err) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  const toggleCat = (id: number) =>
    setSelectedCatIds((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleGame = (code: string) =>
    setSelectedGameCodes((p) => {
      const n = new Set(p);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  const toggleCarousel = (code: string) => {
    setCarouselCodes((p) => {
      const n = new Set(p);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
    if (!selectedGameCodes.has(code)) setSelectedGameCodes((p) => new Set(p).add(code));
  };

  // ─── Filters ─────────────────────────────────────
  const q = searchQuery.toLowerCase();
  const matchesCat = (c: G2BulkCategory) =>
    c.title.toLowerCase().includes(q) || String(c.id).includes(q);
  const matchesGame = (g: G2BulkGame) =>
    g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);

  const filteredCats = useMemo(() => {
    const base = categories.filter(matchesCat);
    if (selectionFilter === "selected") return base.filter((c) => selectedCatIds.has(c.id));
    if (selectionFilter === "unselected") return base.filter((c) => !selectedCatIds.has(c.id));
    return base;
  }, [categories, searchQuery, selectionFilter, selectedCatIds]);

  const filteredGames = useMemo(() => {
    const base = games.filter(matchesGame);
    if (selectionFilter === "selected") return base.filter((g) => selectedGameCodes.has(g.code));
    if (selectionFilter === "unselected") return base.filter((g) => !selectedGameCodes.has(g.code));
    return base;
  }, [games, searchQuery, selectionFilter, selectedGameCodes]);

  const totalSelected = selectedCatIds.size + selectedGameCodes.size;
  const balance = userInfo?.balance ?? 0;

  const totalGamesPages = Math.max(1, Math.ceil(filteredGames.length / GAMES_PAGE_SIZE));
  const paginatedGames = useMemo(() => {
    const start = (gamesPage - 1) * GAMES_PAGE_SIZE;
    return filteredGames.slice(start, start + GAMES_PAGE_SIZE);
  }, [filteredGames, gamesPage]);

  const totalCatsPages = Math.max(1, Math.ceil(filteredCats.length / CATEGORIES_PAGE_SIZE));
  const paginatedCats = useMemo(() => {
    const start = (categoriesPage - 1) * CATEGORIES_PAGE_SIZE;
    return filteredCats.slice(start, start + CATEGORIES_PAGE_SIZE);
  }, [filteredCats, categoriesPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setGamesPage(1);
  }, [searchQuery, selectionFilter]);
  useEffect(() => {
    setCategoriesPage(1);
  }, [searchQuery, selectionFilter]);

  return (
    <div className="space-y-6 pb-8">
      {/* ═══ G2Bulk Section ═══ */}
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setG2bulkExpanded(!g2bulkExpanded)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <div className="bg-primary/10 text-primary rounded-2xl p-3">
            <Zap className="size-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">G2Bulk</h1>
              {g2bulkExpanded ? (
                <ChevronUp className="text-muted-foreground size-5" />
              ) : (
                <ChevronDown className="text-muted-foreground size-5" />
              )}
            </div>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              {isRtl
                ? "إدارة مزامنة المنتجات والألعاب من G2Bulk"
                : "Manage product and game sync from G2Bulk"}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {connectionStatus === "connected" && (
            <Badge
              variant="default"
              className="gap-1.5 bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-200" />
              </span>
              {isRtl ? "متصل" : "Connected"}
            </Badge>
          )}
          {connectionStatus === "failed" && (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1">
              <X className="size-3" />
              {isRtl ? "فشل" : "Failed"}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCatalog}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            {isRtl ? "تحديث" : "Refresh"}
          </Button>
          <button
            type="button"
            onClick={() => setG2bulkExpanded(!g2bulkExpanded)}
            className="hover:bg-muted/50 rounded-lg border p-2 transition-colors"
          >
            {g2bulkExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {g2bulkExpanded && (
        <div className="contents">
          {/* Alerts */}
          {connectionMsg && connectionStatus !== "idle" && (
            <Alert
              variant={connectionStatus === "connected" ? "default" : "destructive"}
              className={cn(
                connectionStatus === "connected" &&
                  "border-emerald-500/50 text-emerald-700 dark:text-emerald-400",
                "py-3",
              )}
            >
              {connectionStatus === "connected" ? (
                <Zap className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <AlertDescription className="font-medium">{connectionMsg}</AlertDescription>
            </Alert>
          )}
          {alert && (
            <Alert
              variant={alert.type === "success" ? "default" : "destructive"}
              className={cn(
                alert.type === "success" &&
                  "border-emerald-500/50 text-emerald-700 dark:text-emerald-400",
              )}
            >
              {alert.type === "success" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <div>
                <AlertDescription className="font-medium">{alert.message}</AlertDescription>
                {alert.detail && <p className="mt-0.5 text-xs opacity-70">{alert.detail}</p>}
              </div>
            </Alert>
          )}

          {/* Stats */}
          {connectionStatus === "connected" && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                icon={Wallet}
                label={isRtl ? "الرصيد" : "Balance"}
                value={`$${balance.toFixed(2)}`}
                sub={userInfo ? `@${userInfo.username}` : undefined}
                accent
              />
              <StatCard
                icon={Package}
                label={isRtl ? "الفئات" : "Categories"}
                value={String(categories.length)}
                sub={`${categories.filter((c) => c.count > 0).length} ${isRtl ? "نشطة" : "active"}`}
              />
              <StatCard
                icon={Gamepad2}
                label={isRtl ? "الألعاب" : "Games"}
                value={String(games.length)}
                sub={isRtl ? "متاحة للمزامنة" : "available to sync"}
              />
              <StatCard
                icon={Database}
                label={isRtl ? "تمت المزامنة" : "Synced"}
                value="—"
                sub={isRtl ? "آخر مزامنة: لم تتم" : "Last sync: never"}
              />
            </div>
          )}

          {/* API Key editor */}
          {connectionStatus === "connected" && (
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="text-muted-foreground size-4" />
                    <CardTitle className="text-sm font-medium">
                      {isRtl ? "مفتاح API" : "API Key"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {!apiKeyLocked && (
                      <Badge variant="secondary" className="text-[10px]">
                        {isRtl ? "جارٍ التعديل" : "Editing"}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {isRtl ? "محفوظ في الخادم" : "Stored server-side"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    {apiKeyLocked ? (
                      <div className="border-input bg-muted/50 flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 font-mono text-sm">
                        <span className="text-muted-foreground">••••••••••••••••••</span>
                        <button
                          type="button"
                          onClick={() => {
                            setApiKeyLocked(false);
                            setShowApiKey(true);
                          }}
                          className="text-muted-foreground hover:text-foreground hover:bg-background rounded-md p-1.5 transition-all"
                        >
                          <Pencil className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={isRtl ? "أدخل مفتاح API جديد..." : "Enter new API key..."}
                          className="pr-20 font-mono text-sm"
                        />
                        <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                          >
                            {showApiKey ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApiKeyLocked(true);
                              setShowApiKey(false);
                            }}
                            className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {!apiKeyLocked && (
                    <Button
                      size="sm"
                      onClick={handleSaveApiKey}
                      disabled={!apiKeyInput.trim() || savingKey}
                      className="shrink-0 gap-2"
                    >
                      {savingKey ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      {isRtl ? "حفظ" : "Save"}
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  <Info className="mr-1 inline size-3" />
                  {apiKeyLocked
                    ? isRtl
                      ? "اضغط على قلم التعديل لتغيير مفتاح API"
                      : "Click the edit pen to change the API key"
                    : isRtl
                      ? "يتم تخزين المفتاح في الخادم ولا يتم إرساله إلى المتصفح"
                      : "The key is stored server-side and never sent to the browser"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Search + Filters */}
          {connectionStatus === "connected" && (
            <Card className="border-muted">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      placeholder={isRtl ? "بحث..." : "Search..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCatIds(new Set(categories.map((c) => c.id)));
                        setSelectedGameCodes(new Set(games.map((g) => g.code)));
                      }}
                      disabled={categories.length === 0 && games.length === 0}
                      className="gap-2"
                    >
                      <Check className="size-4" />
                      {isRtl ? "تحديد الكل" : "Select All"}
                    </Button>
                    {totalSelected > 0 && (
                      <Button onClick={handleSync} disabled={syncing} className="shrink-0 gap-2">
                        {syncing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                        {isRtl ? `مزامنة (${totalSelected})` : `Sync (${totalSelected})`}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "selected", "unselected"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectionFilter(opt)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                        selectionFilter === opt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {opt === "all"
                        ? isRtl
                          ? "الكل"
                          : "All"
                        : opt === "selected"
                          ? isRtl
                            ? "المحدد"
                            : "Selected"
                          : isRtl
                            ? "غير المحدد"
                            : "Unselected"}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 rounded-lg border p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "rounded-md p-1.5 transition-all",
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <LayoutGrid className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "rounded-md p-1.5 transition-all",
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <List className="size-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="space-y-4 text-center">
                  <Loader2 className="text-primary mx-auto size-10 animate-spin" />
                  <div>
                    <p className="font-medium">
                      {isRtl ? "جاري التحميل..." : "Loading G2Bulk catalog..."}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {isRtl ? "جلب المنتجات والألعاب" : "Fetching products and games"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionStatus === "idle" && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <Zap className="text-muted-foreground/20 mb-4 size-14" />
                <h3 className="mb-2 text-lg font-semibold">
                  {isRtl ? "لم يتم التحميل بعد" : "Catalog not loaded"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md text-sm">
                  {isRtl ? "اضغط تحديث لتحميل الكتالوج" : "Click Refresh to load"}
                </p>
                <Button onClick={fetchCatalog} className="gap-2" size="lg">
                  <RefreshCw className="size-4" />
                  {isRtl ? "تحميل" : "Load"}
                </Button>
              </CardContent>
            </Card>
          )}

          {connectionStatus === "failed" && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="text-destructive/30 mb-4 size-14" />
                <h3 className="mb-2 text-lg font-semibold">
                  {isRtl ? "فشل الاتصال" : "Connection failed"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md text-sm">{connectionMsg}</p>
                <Button onClick={fetchCatalog} variant="outline" className="gap-2">
                  <RefreshCw className="size-4" />
                  {isRtl ? "إعادة المحاولة" : "Retry"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          {!loading && connectionStatus === "connected" && (
            <Tabs defaultValue="categories" className="space-y-6">
              <TabsList className="h-auto p-1">
                <TabsTrigger value="categories" className="gap-2 px-4 py-2.5">
                  <ShoppingBag className="size-4" />
                  {isRtl ? "الفئات" : "Categories"}
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {categories.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="games" className="gap-2 px-4 py-2.5">
                  <Gamepad2 className="size-4" />
                  {isRtl ? "الألعاب" : "Games"}
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {games.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Categories tab */}
              <TabsContent value="categories" className="space-y-4">
                {filteredCats.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    <ShoppingBag className="mx-auto mb-3 size-10 opacity-30" />
                    <p>
                      {searchQuery || selectionFilter !== "all"
                        ? isRtl
                          ? "لا توجد فئات مطابقة"
                          : "No matching categories"
                        : isRtl
                          ? "لا توجد فئات"
                          : "No categories"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className={cn(
                        viewMode === "grid"
                          ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                          : "space-y-1.5",
                      )}
                    >
                      {paginatedCats.map((cat) => {
                        const sel = selectedCatIds.has(cat.id);
                        return viewMode === "grid" ? (
                          <button
                            key={cat.id}
                            onClick={() => toggleCat(cat.id)}
                            className={cn(
                              "rounded-xl border p-3.5 text-left text-sm transition-all",
                              sel
                                ? "border-primary bg-primary/5 ring-primary ring-1"
                                : "hover:bg-muted/50 hover:border-border",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                  sel && "bg-primary border-primary text-primary-foreground",
                                )}
                              >
                                {sel && <Check className="size-3" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{cat.title}</p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {cat.count} {isRtl ? "منتج" : "items"} · $
                                  {cat.minPrice.toFixed(2)}–${cat.maxPrice.toFixed(2)}
                                </p>
                                <Badge variant="secondary" className="mt-1 text-[10px]">
                                  #{cat.id}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ) : (
                          <button
                            key={cat.id}
                            onClick={() => toggleCat(cat.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                              sel ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                sel && "bg-primary border-primary text-primary-foreground",
                              )}
                            >
                              {sel && <Check className="size-3" />}
                            </div>
                            <span className="flex-1 truncate font-medium">{cat.title}</span>
                            <span className="text-muted-foreground shrink-0 text-xs">
                              {cat.count} {isRtl ? "قطعة" : "items"}
                            </span>
                            <span className="text-primary shrink-0 text-xs font-bold">
                              ${cat.minPrice.toFixed(2)}–${cat.maxPrice.toFixed(2)}
                            </span>
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              #{cat.id}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>

                    <PaginationControls
                      currentPage={categoriesPage}
                      totalPages={totalCatsPages}
                      totalItems={filteredCats.length}
                      onPageChange={setCategoriesPage}
                      label={isRtl ? "فئة" : "category"}
                      labelPlural={isRtl ? "فئة" : "categories"}
                      isRtl={isRtl}
                    />
                  </>
                )}
              </TabsContent>

              {/* Games tab */}
              <TabsContent value="games" className="space-y-4">
                {filteredGames.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center">
                    <Gamepad2 className="mx-auto mb-3 size-10 opacity-30" />
                    <p>
                      {searchQuery || selectionFilter !== "all"
                        ? isRtl
                          ? "لا توجد ألعاب مطابقة"
                          : "No matching games"
                        : isRtl
                          ? "لا توجد ألعاب"
                          : "No games"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className={cn(
                        viewMode === "grid"
                          ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                          : "space-y-1.5",
                      )}
                    >
                      {paginatedGames.map((game) => {
                        const sel = selectedGameCodes.has(game.code);
                        const inCarousel = carouselCodes.has(game.code);
                        return viewMode === "grid" ? (
                          <div
                            key={game.code}
                            className={cn(
                              "overflow-hidden rounded-xl border transition-all",
                              sel ? "border-primary ring-primary ring-1" : "hover:border-border",
                            )}
                          >
                            <div className="bg-muted/30 relative aspect-[2/1] overflow-hidden">
                              {game.image_url ? (
                                <img
                                  src={game.image_url}
                                  alt={game.name}
                                  className="h-full w-full object-contain p-3"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Image className="text-muted-foreground/30 size-8" />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCarousel(game.code);
                                }}
                                className={cn(
                                  "absolute top-2 right-2 rounded-lg border p-1.5 transition-all",
                                  inCarousel
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-background/80 border-border text-muted-foreground hover:text-foreground",
                                )}
                              >
                                <LayoutGrid className="size-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => toggleGame(game.code)}
                              className="w-full p-3 text-left"
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={cn(
                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                    sel && "bg-primary border-primary text-primary-foreground",
                                  )}
                                >
                                  {sel && <Check className="size-3" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{game.name}</p>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <Badge variant="secondary" className="text-[10px]">
                                      {game.code}
                                    </Badge>
                                    {game.region && (
                                      <span className="text-muted-foreground text-[10px]">
                                        {game.region}
                                      </span>
                                    )}
                                  </div>
                                  {inCarousel && (
                                    <Badge
                                      variant="default"
                                      className="bg-primary/10 text-primary border-primary/20 mt-1.5 text-[9px]"
                                    >
                                      <LayoutGrid className="mr-1 size-2.5" />
                                      {isRtl ? "كاروسيل" : "Carousel"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div
                            key={game.code}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                              sel ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                            )}
                          >
                            {game.image_url ? (
                              <img
                                src={game.image_url}
                                alt=""
                                className="bg-muted/30 size-8 shrink-0 rounded-md object-contain"
                              />
                            ) : (
                              <div className="bg-muted/30 flex size-8 shrink-0 items-center justify-center rounded-md">
                                <Image className="text-muted-foreground/30 size-4" />
                              </div>
                            )}
                            <button
                              onClick={() => toggleGame(game.code)}
                              className="flex min-w-0 flex-1 items-center gap-2"
                            >
                              <div
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                  sel && "bg-primary border-primary text-primary-foreground",
                                )}
                              >
                                {sel && <Check className="size-3" />}
                              </div>
                              <span className="flex-1 truncate font-medium">{game.name}</span>
                              <Badge variant="secondary" className="shrink-0 text-[10px]">
                                {game.code}
                              </Badge>
                              {game.region && (
                                <span className="text-muted-foreground shrink-0 text-[10px]">
                                  {game.region}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCarousel(game.code);
                              }}
                              className={cn(
                                "shrink-0 rounded-md border p-1.5 transition-all",
                                inCarousel
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <LayoutGrid className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <PaginationControls
                      currentPage={gamesPage}
                      totalPages={totalGamesPages}
                      totalItems={filteredGames.length}
                      onPageChange={setGamesPage}
                      label={isRtl ? "لعبة" : "game"}
                      labelPlural={isRtl ? "ألعاب" : "games"}
                      isRtl={isRtl}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
      {/* end g2bulk expanded */}

      {/* -- Divider -------------- */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <Badge variant="secondary" className="px-4 py-1 text-xs">
            {isRtl ? "مزوّدو الدفع" : "Payment Providers"}
          </Badge>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ─── SAM API Section ────────────────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <SAMSettings isRtl={isRtl} samExpanded={samExpanded} setSamExpanded={setSamExpanded} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SAM API Provider Component
// ═══════════════════════════════════════════════════════

function SAMSettings({
  isRtl,
  samExpanded,
  setSamExpanded,
}: {
  isRtl: boolean;
  samExpanded: boolean;
  setSamExpanded: (v: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "connected" | "failed">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [keySet, setKeySet] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [samKeyLocked, setSamKeyLocked] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [wallets, setWallets] = useState<SAMWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [txData, setTxData] = useState<
    Record<string, { loading: boolean; items: SAMTransaction[] }>
  >({});
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [alert, setAlert] = useState<SyncAlert | null>(null);

  // Advanced config state
  const [config, setConfig] = useState<SAMAdvancedConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [walletOptions, setWalletOptions] = useState<
    { id: string; label: string; provider: string }[]
  >([]);

  // Fetch current key status
  const fetchStatus = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/sam/settings");
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("failed");
        setStatusMsg(data.message || "Failed to check");
        return;
      }
      setKeySet(data.keySet);
      setMaskedKey(data.maskedKey || "");
      if (data.config) setConfig(data.config);
      if (data.wallets) setWalletOptions(data.wallets);
      if (data.keySet) {
        setStatus("connected");
        setStatusMsg(
          data.source === "env"
            ? isRtl
              ? "المفتاح موجود في المتغيرات البيئية"
              : "Key set via environment variable"
            : isRtl
              ? "المفتاح محفوظ في قاعدة البيانات"
              : "Key saved in database",
        );
      } else {
        setStatus("idle");
        setStatusMsg(isRtl ? "لم يتم تكوين مفتاح API بعد" : "API key not configured yet");
      }
    } catch (err) {
      setStatus("failed");
      setStatusMsg(err instanceof Error ? err.message : "Request failed");
    }
  }, [isRtl]);

  const fetchWallets = useCallback(async () => {
    setWalletsLoading(true);
    try {
      const res = await fetch("/api/sam/wallets");
      const data = await res.json();
      if (data.success) {
        setWallets(data.wallets || []);
      }
    } catch (err) {
      console.error("Failed to fetch SAM wallets:", err);
    } finally {
      setWalletsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (wallet: SAMWallet) => {
    const wid = wallet.id;
    setTxData((prev) => ({ ...prev, [wid]: { ...prev[wid], loading: true } }));
    try {
      const params = new URLSearchParams({ provider: wallet.provider });
      if (wallet.walletAddress) params.set("walletAddress", wallet.walletAddress);
      if (wallet.phone) params.set("phone", wallet.phone);
      if (wallet.cashCode) params.set("cashCode", wallet.cashCode);
      params.set("walletId", wallet.id);

      const res = await fetch(`/api/sam/transactions?${params}`);
      const data = await res.json();
      if (data.success) {
        setTxData((prev) => ({
          ...prev,
          [wid]: { loading: false, items: data.transactions || [] },
        }));
      } else {
        setTxData((prev) => ({
          ...prev,
          [wid]: { loading: false, items: [] },
        }));
      }
    } catch {
      setTxData((prev) => ({
        ...prev,
        [wid]: { loading: false, items: [] },
      }));
    }
  }, []);

  const toggleWalletExpanded = (wallet: SAMWallet) => {
    if (expandedWalletId === wallet.id) {
      setExpandedWalletId(null);
    } else {
      setExpandedWalletId(wallet.id);
      if (!txData[wallet.id]) {
        fetchTransactions(wallet);
      }
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch wallets whenever key status changes to connected
  useEffect(() => {
    if (keySet) fetchWallets();
  }, [keySet, fetchWallets]);

  const handleSave = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch("/api/sam/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setShowKey(false);
      setSamKeyLocked(true);
      setKeyInput("");
      setMaskedKey(data.maskedKey);
      setKeySet(true);
      setStatus("connected");
      setStatusMsg(isRtl ? "المفتاح محفوظ في قاعدة البيانات" : "Key saved in database");
      setAlert({
        type: "success",
        message: isRtl ? "تم حفظ المفتاح" : "API key saved",
        detail: data.maskedKey,
      });
    } catch (err) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async (partial: Partial<SAMAdvancedConfig>) => {
    if (!config) return;
    setSavingConfig(true);
    try {
      const merged = { ...config, ...partial };
      const res = await fetch("/api/sam/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: merged }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setConfig(data.config || merged);
      setAlert({ type: "success", message: isRtl ? "تم حفظ الإعدادات" : "Settings saved" });
    } catch (err) {
      setAlert({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setSamExpanded(!samExpanded)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <div className="shrink-0 rounded-2xl bg-blue-600/10 p-3 text-blue-600 dark:text-blue-400">
            <CreditCard className="size-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">SAM API</h2>
              {samExpanded ? (
                <ChevronUp className="text-muted-foreground size-5" />
              ) : (
                <ChevronDown className="text-muted-foreground size-5" />
              )}
            </div>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              {isRtl
                ? "بوابة دفع عبر محافظ شام كاش وسيريتل كاش"
                : "Payment gateway via ShamCash and Syriatel Cash wallets"}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {status === "connected" && (
            <Badge
              variant="default"
              className="gap-1.5 bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-200" />
              </span>
              {isRtl ? "المفتاح موجود" : "Key Set"}
            </Badge>
          )}
          {status === "failed" && (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1">
              <X className="size-3" />
              {isRtl ? "خطأ" : "Error"}
            </Badge>
          )}
          <a href="https://sam-api.pro/api-docs" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="size-3.5" />
              {isRtl ? "التوثيق" : "Docs"}
            </Button>
          </a>
          <button
            type="button"
            onClick={() => setSamExpanded(!samExpanded)}
            className="hover:bg-muted/50 rounded-lg border p-2 transition-colors"
          >
            {samExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {samExpanded && (
        <div className="contents">
          {/* Status alert */}
          {(status === "connected" || status === "failed") && statusMsg && (
            <Alert
              variant={status === "connected" ? "default" : "destructive"}
              className={cn(
                status === "connected" &&
                  "border-emerald-500/50 text-emerald-700 dark:text-emerald-400",
                "py-2.5",
              )}
            >
              {status === "connected" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <AlertDescription className="text-sm font-medium">{statusMsg}</AlertDescription>
            </Alert>
          )}

          {alert && (
            <Alert
              variant={alert.type === "success" ? "default" : "destructive"}
              className={cn(
                alert.type === "success" &&
                  "border-emerald-500/50 text-emerald-700 dark:text-emerald-400",
              )}
            >
              {alert.type === "success" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              <div>
                <AlertDescription className="font-medium">{alert.message}</AlertDescription>
                {alert.detail && <p className="mt-0.5 text-xs opacity-70">{alert.detail}</p>}
              </div>
            </Alert>
          )}

          {/* API Key editor */}
          <Card className="border-muted">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="text-muted-foreground size-4" />
                  <CardTitle className="text-sm font-medium">
                    {isRtl ? "مفتاح API" : "API Key"}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {!samKeyLocked && (
                    <Badge variant="secondary" className="text-[10px]">
                      {isRtl ? "جارٍ التعديل" : "Editing"}
                    </Badge>
                  )}
                  {keySet && maskedKey && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {maskedKey}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  {samKeyLocked ? (
                    <div className="border-input bg-muted/50 flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 font-mono text-sm">
                      <span className="text-muted-foreground">••••••••••••••••••</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSamKeyLocked(false);
                          setShowKey(true);
                        }}
                        className="text-muted-foreground hover:text-foreground hover:bg-background rounded-md p-1.5 transition-all"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type={showKey ? "text" : "password"}
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder={isRtl ? "أدخل مفتاح API..." : "Enter API key..."}
                        className="pr-20 font-mono text-sm"
                      />
                      <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                        >
                          {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSamKeyLocked(true);
                            setShowKey(false);
                          }}
                          className="text-muted-foreground hover:text-foreground p-1.5 transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {!samKeyLocked && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!keyInput.trim() || saving}
                    className="shrink-0 gap-2"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isRtl ? "حفظ" : "Save"}
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                <Info className="inline size-3" />
                {samKeyLocked
                  ? isRtl
                    ? "اضغط على قلم التعديل لتغيير مفتاح API"
                    : "Click the edit pen to change the API key"
                  : isRtl
                    ? "المفتاح يُخزّن بشكل آمن في الخادم. اذهب إلى sam-api.pro لإنشاء مفتاح"
                    : "The key is stored securely server-side. Visit sam-api.pro to create a key"}
              </p>
            </CardContent>
          </Card>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      {isRtl ? "المزوّد" : "Provider"}
                    </p>
                    <p className="text-lg font-bold tracking-tight">SAM API</p>
                  </div>
                  <div className="rounded-xl bg-blue-600/10 p-2 text-blue-600">
                    <CreditCard className="size-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      {isRtl ? "المحافظ" : "Wallets"}
                    </p>
                    <p className="text-lg font-bold tracking-tight">
                      {walletsLoading ? "..." : wallets.length}
                    </p>
                    {wallets.length > 0 && (
                      <p className="text-muted-foreground truncate text-xs">
                        {wallets[0].providerDisplayName}
                        {wallets.length > 1 ? ` +${wallets.length - 1}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="bg-muted text-muted-foreground rounded-xl p-2">
                    <Wallet className="size-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      {isRtl ? "النوع" : "Type"}
                    </p>
                    <p className="text-lg font-bold tracking-tight">{isRtl ? "دفع" : "Payment"}</p>
                  </div>
                  <div className="bg-muted text-muted-foreground rounded-xl p-2">
                    <CreditCard className="size-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      {isRtl ? "الحالة" : "Status"}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold tracking-tight",
                        keySet ? "text-emerald-600" : "text-muted-foreground",
                      )}
                    >
                      {keySet ? (isRtl ? "مفعل" : "Active") : isRtl ? "غير مفعل" : "Inactive"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl p-2",
                      keySet
                        ? "bg-emerald-600/10 text-emerald-600"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {keySet ? <CheckCircle2 className="size-4" /> : <X className="size-4" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Advanced Settings ─── */}
          {config && keySet && (
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="text-muted-foreground size-4" />
                  <CardTitle className="text-sm font-medium">
                    {isRtl ? "الإعدادات المتقدمة" : "Advanced Settings"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Profit Margin */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      {isRtl ? "نسبة الربح" : "Profit Margin"}
                    </label>
                    <span className="text-primary text-sm font-bold">{config.profitMargin}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.profitMargin}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev ? { ...prev, profitMargin: Number(e.target.value) } : prev,
                      )
                    }
                    onMouseUp={() =>
                      config && handleSaveConfig({ profitMargin: config.profitMargin })
                    }
                    onTouchEnd={() =>
                      config && handleSaveConfig({ profitMargin: config.profitMargin })
                    }
                    disabled={savingConfig}
                    className="bg-muted accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div className="text-muted-foreground flex justify-between text-[10px]">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    <Info className="mr-1 inline size-3" />
                    {isRtl
                      ? "يُضاف هامش الربح على سعر المنتج عند الدفع عبر SAM API"
                      : "Profit margin added to the product price when paying via SAM API"}
                  </p>
                </div>

                {/* Separator */}
                <div className="border-t" />

                {/* Default Wallet */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRtl ? "المحفظة الافتراضية" : "Default Wallet"}
                  </label>
                  <select
                    value={config.defaultWalletId || ""}
                    onChange={(e) => handleSaveConfig({ defaultWalletId: e.target.value || null })}
                    disabled={savingConfig}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">{isRtl ? "— غير محدد —" : "— Not set —"}</option>
                    {walletOptions.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label || w.id} ({w.provider})
                      </option>
                    ))}
                  </select>
                  <p className="text-muted-foreground text-xs">
                    <Info className="mr-1 inline size-3" />
                    {isRtl
                      ? "المحفظة التي ستُستخدم لاستقبال المدفوعات"
                      : "Default wallet to receive payments"}
                  </p>
                </div>

                {/* Separator */}
                <div className="border-t" />

                {/* Default Currency */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRtl ? "العملة الافتراضية" : "Default Currency"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(["USD", "SYP", "EUR"] as const).map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => handleSaveConfig({ defaultCurrency: cur })}
                        disabled={savingConfig}
                        className={cn(
                          "rounded-lg border px-4 py-2 text-sm font-semibold transition-all",
                          config.defaultCurrency === cur
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {cur === "USD" && "$ "}
                        {cur === "SYP" && "ل.س "}
                        {cur === "EUR" && "€ "}
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t" />

                {/* Webhook URL — auto-generated */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isRtl ? "رابط Webhook" : "Webhook URL"}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={config.webhookUrl || ""}
                      readOnly
                      placeholder={isRtl ? "لم يتم التوليد بعد" : "Not generated yet"}
                      className="bg-muted/50 flex-1 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setSavingConfig(true);
                        try {
                          const res = await fetch("/api/sam/settings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ regenerateWebhook: true }),
                          });
                          const data = await res.json();
                          if (data.success && data.webhookUrl) {
                            setConfig((prev) =>
                              prev ? { ...prev, webhookUrl: data.webhookUrl } : prev,
                            );
                            setAlert({
                              type: "success",
                              message: isRtl ? "تم تجديد رابط Webhook" : "Webhook URL regenerated",
                            });
                          } else {
                            throw new Error(data.message || "Failed");
                          }
                        } catch (err) {
                          setAlert({
                            type: "error",
                            message: err instanceof Error ? err.message : "Failed",
                          });
                        } finally {
                          setSavingConfig(false);
                        }
                      }}
                      disabled={savingConfig}
                      className="shrink-0 gap-2"
                    >
                      {savingConfig ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      {isRtl ? "تجديد" : "Regenerate"}
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    <Info className="mr-1 inline size-3" />
                    {isRtl
                      ? "رابط Webhook مولّد تلقائياً. SAM API يُرسل إشعارات الدفع إلى هذا الرابط. تجديد الرابط يلغي القديم."
                      : "Auto-generated webhook URL. SAM API sends payment notifications here. Regenerating invalidates the old URL."}
                  </p>
                </div>

                {/* Separator */}
                <div className="border-t" />

                {/* Auto Confirm */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {isRtl ? "تأكيد الطلب تلقائياً" : "Auto-confirm Orders"}
                    </label>
                    <p className="text-muted-foreground text-xs">
                      {isRtl
                        ? "يتم تأكيد الطلب تلقائياً بعد استلام إشعار الدفع"
                        : "Orders are confirmed automatically after payment notification"}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.autoConfirm}
                    onClick={() => handleSaveConfig({ autoConfirm: !config.autoConfirm })}
                    disabled={savingConfig}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                      config.autoConfirm ? "bg-primary" : "bg-input",
                      savingConfig && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        config.autoConfirm ? "translate-x-5" : "translate-x-0",
                      )}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet List - always visible */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                {isRtl ? "المحافظ المرتبطة" : "Linked Wallets"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchWallets}
                disabled={walletsLoading}
                className="h-7 gap-2 text-xs"
              >
                <RefreshCw className={cn("size-3", walletsLoading && "animate-spin")} />
                {isRtl ? "تحديث الرصيد" : "Refresh"}
              </Button>
            </div>
            {wallets.length === 0 ? (
              <Card className="border-muted-foreground/20 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Wallet className="text-muted-foreground/20 mb-3 size-10" />
                  <p className="text-muted-foreground text-sm font-medium">
                    {isRtl ? "لم تقم بإضافة أي محفظة بعد" : "No wallets linked yet"}
                  </p>
                  <p className="text-muted-foreground/60 mt-1 max-w-xs text-xs">
                    {isRtl
                      ? "أضف محفظة شام كاش أو سيريتل كاش من موقع sam-api.pro لتظهر هنا مع الرصيد وسجل المعاملات"
                      : "Add a ShamCash or Syriatel Cash wallet from sam-api.pro to see it here with balances and transaction history"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {wallets.map((wallet) => {
                  const isExpanded = expandedWalletId === wallet.id;
                  const txInfo = txData[wallet.id];
                  return (
                    <Card
                      key={wallet.id}
                      className={cn(
                        "overflow-hidden border transition-all duration-200",
                        isExpanded
                          ? "border-primary/30 shadow-md"
                          : "border-muted hover:border-muted-foreground/30 hover:shadow-sm",
                      )}
                    >
                      {/* Card Header — clickable */}
                      <button
                        type="button"
                        onClick={() => toggleWalletExpanded(wallet)}
                        className="w-full text-left"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Left: Icon */}
                            <div
                              className={cn(
                                "shrink-0 rounded-2xl p-3",
                                wallet.provider === "shamcash"
                                  ? "bg-[#2F4095]/10 text-[#2F4095] dark:bg-[#2F4095]/30 dark:text-[#81A0F2]"
                                  : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
                              )}
                            >
                              {wallet.provider === "shamcash" ? (
                                <svg
                                  className="size-6"
                                  viewBox="0 0 68 79"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M50.2993 55.3317L38.347 48.0665C37.0678 47.289 37.0649 45.4334 38.3415 44.6518L47.8252 38.8454C49.1182 38.0538 49.0946 36.1676 47.7823 35.4085L20.1623 19.4322C19.5443 19.0747 19.1637 18.4149 19.1637 17.7009L19.1637 3.42207C19.1637 1.89188 20.812 0.928516 22.1452 1.6795L66.9816 26.9354C67.6107 27.2898 68 27.9559 68 28.678L68 45.2056C68 45.9219 67.6169 46.5835 66.9957 46.9401L52.3339 55.3571C51.7017 55.72 50.9222 55.7103 50.2993 55.3317Z"
                                    fill="currentColor"
                                  />
                                  <path
                                    d="M17.7007 23.4865L29.653 30.7516C30.9322 31.5291 30.9351 33.3847 29.6585 34.1664L20.1748 39.9727C18.8818 40.7643 18.9054 42.6505 20.2177 43.4096L47.8377 59.3859C48.4557 59.7434 48.8363 60.4032 48.8363 61.1172V75.396C48.8363 76.9262 47.188 77.8896 45.8548 77.1386L1.01843 51.8827C0.389264 51.5283 0 50.8623 0 50.1401L0 33.6125C0 32.8962 0.38306 32.2346 1.00426 31.878L15.6661 23.461C16.2983 23.0981 17.0778 23.1078 17.7007 23.4865Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              ) : (
                                <Wallet className="size-6" />
                              )}
                            </div>

                            {/* Center: Info + Balances */}
                            <div className="min-w-0 flex-1 space-y-2">
                              {/* Badge row */}
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  className={cn(
                                    "px-2.5 py-0.5 text-xs font-semibold",
                                    wallet.provider === "shamcash"
                                      ? "bg-[#2F4095]/15 text-[#2F4095] hover:bg-[#2F4095]/20 dark:text-[#81A0F2]"
                                      : "bg-sky-600/15 text-sky-700 hover:bg-sky-600/20 dark:text-sky-400",
                                  )}
                                >
                                  {wallet.providerDisplayName || wallet.provider}
                                </Badge>
                                {wallet.status === "active" ? (
                                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <span className="size-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300" />
                                    {isRtl ? "نشط" : "Active"}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                                    <span className="bg-muted-foreground size-2 rounded-full" />
                                    {wallet.status}
                                  </span>
                                )}
                              </div>

                              {/* Name */}
                              {wallet.label && (
                                <p className="text-base font-bold sm:text-lg">{wallet.label}</p>
                              )}

                              {/* Phone + Region */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                {wallet.phone && (
                                  <span
                                    className="text-muted-foreground flex items-center gap-1.5 font-mono text-sm"
                                    dir="ltr"
                                  >
                                    <span className="text-muted-foreground/50">
                                      {isRtl ? "📞" : "📞"}
                                    </span>
                                    {wallet.phone}
                                  </span>
                                )}
                                {wallet.region && (
                                  <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                    <span className="text-muted-foreground/50">
                                      {isRtl ? "📍" : "📍"}
                                    </span>
                                    {wallet.region}
                                  </span>
                                )}
                                {wallet.walletAddress && (
                                  <span
                                    className="text-muted-foreground/60 max-w-[160px] truncate font-mono text-xs"
                                    title={wallet.walletAddress}
                                  >
                                    ID: {wallet.walletAddress.slice(0, 16)}…
                                  </span>
                                )}
                              </div>

                              {/* Balances — BIG */}
                              {wallet.balances &&
                                wallet.balances.filter((b) => b.amount > 0).length > 0 && (
                                  <div className="flex flex-wrap gap-3 pt-1">
                                    {wallet.balances
                                      .filter((b) => b.amount > 0)
                                      .map((b) => (
                                        <div key={b.currency} className="flex items-baseline gap-1">
                                          <span className="text-lg font-bold tracking-tight sm:text-xl">
                                            {b.currency === "USD" && "$"}
                                            {b.currency === "SYP" && "ل.س "}
                                            {b.currency === "EUR" && "€"}
                                            {Number(b.amount).toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                          </span>
                                          <span
                                            className={cn(
                                              "text-[10px] font-semibold tracking-wider uppercase",
                                              b.currency === "USD" && "text-emerald-600",
                                              b.currency === "SYP" && "text-amber-600",
                                              b.currency === "EUR" && "text-sky-600",
                                            )}
                                          >
                                            {b.currency}
                                          </span>
                                          {b.label && (
                                            <span className="text-muted-foreground text-[10px]">
                                              · {b.label}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                )}
                            </div>

                            {/* Right: Expand arrow */}
                            <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                              <div
                                className={cn(
                                  "rounded-full p-1.5 transition-all duration-200",
                                  isExpanded
                                    ? "bg-primary/10 rotate-180"
                                    : "text-muted-foreground hover:bg-muted",
                                )}
                              >
                                <ChevronDown className="size-5" />
                              </div>
                              <span className="text-muted-foreground text-[10px]">
                                {isExpanded
                                  ? isRtl
                                    ? "إخفاء"
                                    : "Hide"
                                  : isRtl
                                    ? "المعاملات"
                                    : "Transactions"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </button>

                      {/* ─── Transactions Section ─── */}
                      {isExpanded && (
                        <div className="bg-muted/30 border-t">
                          {/* Header */}
                          <div className="border-border/50 flex items-center justify-between border-b px-5 py-3">
                            <h4 className="flex items-center gap-2 text-sm font-bold">
                              <ArrowDownUp className="text-primary size-4" />
                              {isRtl ? "سجل المعاملات" : "Transaction History"}
                            </h4>
                            {txInfo && !txInfo.loading && txInfo.items.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="px-2.5 py-0.5 text-xs font-semibold"
                              >
                                {txInfo.items.length} {isRtl ? "معاملة" : "transactions"}
                              </Badge>
                            )}
                          </div>

                          {/* Content */}
                          {txInfo?.loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                              <Loader2 className="text-primary/60 size-8 animate-spin" />
                              <p className="text-muted-foreground text-sm">
                                {isRtl ? "جاري تحميل المعاملات..." : "Loading transactions..."}
                              </p>
                            </div>
                          ) : txInfo?.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                              <ArrowDownUp className="text-muted-foreground/20 mb-3 size-10" />
                              <p className="text-muted-foreground text-sm font-medium">
                                {isRtl ? "لا توجد معاملات" : "No transactions found"}
                              </p>
                              <p className="text-muted-foreground/60 mt-1 text-xs">
                                {isRtl
                                  ? "ستظهر المعاملات هنا بعد إجراء أي عملية على المحفظة"
                                  : "Transactions will appear here after any wallet activity"}
                              </p>
                            </div>
                          ) : (
                            <div className="divide-border/50 max-h-80 divide-y overflow-y-auto">
                              {txInfo?.items.map((tx, idx) => {
                                const isTxExpanded = expandedTxId === tx.id;
                                return (
                                  <div
                                    key={tx.id}
                                    className={cn(
                                      "cursor-pointer transition-colors",
                                      isTxExpanded && "bg-primary/5",
                                    )}
                                  >
                                    {/* Clickable row */}
                                    <button
                                      type="button"
                                      onClick={() => setExpandedTxId(isTxExpanded ? null : tx.id)}
                                      className={cn(
                                        "flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors",
                                        idx % 2 === 0 && !isTxExpanded
                                          ? "bg-background/50"
                                          : "bg-transparent",
                                        !isTxExpanded && "hover:bg-muted/50",
                                      )}
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        {/* Bigger icon */}
                                        <div
                                          className={cn(
                                            "shrink-0 rounded-xl p-2",
                                            tx.type === "credit"
                                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                          )}
                                        >
                                          {tx.type === "credit" ? (
                                            <svg
                                              className="size-5"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth={2}
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 19V5m0 0l-7 7m7-7l7 7"
                                              />
                                            </svg>
                                          ) : (
                                            <svg
                                              className="size-5"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth={2}
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 5v14m0 0l7-7m-7 7l-7-7"
                                              />
                                            </svg>
                                          )}
                                        </div>

                                        {/* Text */}
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">
                                              {tx.type === "credit"
                                                ? isRtl
                                                  ? "إيداع"
                                                  : "Deposit"
                                                : isRtl
                                                  ? "سحب"
                                                  : "Withdrawal"}
                                            </span>
                                            {tx.status && (
                                              <Badge
                                                variant="outline"
                                                className={cn(
                                                  "px-1.5 py-0 text-[10px]",
                                                  tx.status === "completed" &&
                                                    "border-emerald-500/30 text-emerald-600",
                                                  tx.status === "pending" &&
                                                    "border-amber-500/30 text-amber-600",
                                                  tx.status === "failed" &&
                                                    "border-red-500/30 text-red-600",
                                                )}
                                              >
                                                {tx.status === "completed"
                                                  ? isRtl
                                                    ? "مكتمل"
                                                    : "Completed"
                                                  : tx.status === "pending"
                                                    ? isRtl
                                                      ? "قيد الانتظار"
                                                      : "Pending"
                                                    : tx.status === "failed"
                                                      ? isRtl
                                                        ? "فاشل"
                                                        : "Failed"
                                                      : tx.status}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="mt-0.5 flex items-center gap-2">
                                            {tx.counterparty && (
                                              <span className="text-muted-foreground text-sm">
                                                {tx.counterparty}
                                              </span>
                                            )}
                                            <span className="text-muted-foreground/60 text-xs">
                                              {new Date(tx.occurredAt).toLocaleDateString(
                                                isRtl ? "ar" : "en",
                                                {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                },
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-3">
                                        {/* Amount — BIG */}
                                        <div className="text-right">
                                          <div
                                            className={cn(
                                              "font-mono text-lg font-extrabold tracking-tight sm:text-xl",
                                              tx.type === "credit"
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-red-600 dark:text-red-400",
                                            )}
                                          >
                                            {tx.type === "credit" ? "+" : "−"}
                                            {tx.currency === "USD" && "$"}
                                            {tx.currency === "SYP" && "ل.س "}
                                            {tx.currency === "EUR" && "€"}
                                            {Number(tx.amount).toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}
                                          </div>
                                          <span className="text-muted-foreground/60 font-mono text-[10px]">
                                            {tx.currency}
                                          </span>
                                        </div>
                                        <ChevronDown
                                          className={cn(
                                            "text-muted-foreground/40 size-4 transition-transform",
                                            isTxExpanded && "rotate-180",
                                          )}
                                        />
                                      </div>
                                    </button>

                                    {/* ─── Expanded Detail ─── */}
                                    {isTxExpanded && (
                                      <div className="border-border/30 bg-muted/10 border-t px-5 py-4">
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                          <div>
                                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                              {isRtl ? "المعرف" : "ID"}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs break-all">
                                              {tx.id}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                              {isRtl ? "النوع" : "Type"}
                                            </p>
                                            <p className="mt-0.5 text-xs font-medium">
                                              {tx.type === "credit"
                                                ? isRtl
                                                  ? "إيداع"
                                                  : "Deposit"
                                                : tx.type === "debit"
                                                  ? isRtl
                                                    ? "سحب"
                                                    : "Withdrawal"
                                                  : tx.type}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                              {isRtl ? "الحالة" : "Status"}
                                            </p>
                                            <p
                                              className={cn(
                                                "mt-0.5 text-xs font-medium",
                                                tx.status === "completed" && "text-emerald-600",
                                                tx.status === "pending" && "text-amber-600",
                                                tx.status === "failed" && "text-red-600",
                                              )}
                                            >
                                              {tx.status === "completed"
                                                ? isRtl
                                                  ? "مكتمل"
                                                  : "Completed"
                                                : tx.status === "pending"
                                                  ? isRtl
                                                    ? "قيد الانتظار"
                                                    : "Pending"
                                                  : tx.status === "failed"
                                                    ? isRtl
                                                      ? "فاشل"
                                                      : "Failed"
                                                    : tx.status || (isRtl ? "—" : "—")}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                              {isRtl ? "المبلغ" : "Amount"}
                                            </p>
                                            <p
                                              className={cn(
                                                "mt-0.5 font-mono text-xs font-bold",
                                                tx.type === "credit"
                                                  ? "text-emerald-600"
                                                  : "text-red-600",
                                              )}
                                            >
                                              {tx.type === "credit" ? "+" : "−"}
                                              {tx.currency === "USD" && "$"}
                                              {tx.currency === "SYP" && "ل.س "}
                                              {tx.currency === "EUR" && "€"}
                                              {Number(tx.amount).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                              <span className="text-muted-foreground/60 ml-1">
                                                {tx.currency}
                                              </span>
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                              {isRtl ? "التاريخ" : "Date"}
                                            </p>
                                            <p className="mt-0.5 text-xs">
                                              {new Date(tx.occurredAt).toLocaleDateString(
                                                isRtl ? "ar" : "en",
                                                {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  second: "2-digit",
                                                },
                                              )}
                                            </p>
                                          </div>
                                          {tx.counterparty && (
                                            <div>
                                              <p className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                                                {isRtl ? "الطرف المقابل" : "Counterparty"}
                                              </p>
                                              <p className="mt-0.5 text-xs font-medium">
                                                {tx.counterparty}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                        {tx.description && (
                                          <div className="border-border/30 mt-3 border-t pt-3">
                                            <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wider uppercase">
                                              {isRtl ? "الوصف" : "Description"}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                              {tx.description}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* end sam expanded */}
    </div>
  );
}
