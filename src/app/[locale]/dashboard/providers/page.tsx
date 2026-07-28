"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Zap, RefreshCw, Check, X, Search, Loader2, CheckCircle2, AlertCircle,
  ShoppingBag, Gamepad2, Key, Wallet, Database, Save, Eye, EyeOff,
  Package, Info, LayoutGrid, List, Image,
} from "lucide-react";
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

type ViewMode = "grid" | "list";
type SelectionFilter = "all" | "selected" | "unselected";

// ─── Stat Card ───────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <Card className={cn(accent && "border-primary/30 bg-primary/5")}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
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

  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "failed">("idle");
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
      setConnectionMsg(data.user
        ? `@${data.user.username} · $${Number(data.user.balance).toFixed(2)} · ${data.counts.products} categories`
        : `${data.counts.products} voucher categories, ${data.counts.games} games`);
    } catch (err) {
      setConnectionStatus("failed");
      setConnectionMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setAlert(null);
    try {
      const res = await fetch("/api/g2bulk/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setShowApiKey(false);
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: [...selectedCatIds],
          games: [...selectedGameCodes],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: "success", message: data.message, detail: `Created: ${data.results.productsCreated} · Updated: ${data.results.productsUpdated}` });
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

  const toggleCat = (id: number) => setSelectedCatIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleGame = (code: string) => setSelectedGameCodes((p) => { const n = new Set(p); n.has(code) ? n.delete(code) : n.add(code); return n; });
  const toggleCarousel = (code: string) => {
    setCarouselCodes((p) => { const n = new Set(p); n.has(code) ? n.delete(code) : n.add(code); return n; });
    if (!selectedGameCodes.has(code)) setSelectedGameCodes((p) => new Set(p).add(code));
  };

  // ─── Filters ─────────────────────────────────────
  const q = searchQuery.toLowerCase();
  const matchesCat = (c: G2BulkCategory) => c.title.toLowerCase().includes(q) || String(c.id).includes(q);
  const matchesGame = (g: G2BulkGame) => g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);

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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Zap className="size-7" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">G2Bulk</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {isRtl ? "إدارة مزامنة المنتجات والألعاب من G2Bulk" : "Manage product and game sync from G2Bulk"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === "connected" && (
            <Badge variant="default" className="gap-1.5 bg-emerald-600 hover:bg-emerald-600 text-white px-3 py-1">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-200" />
              </span>
              {isRtl ? "متصل" : "Connected"}
            </Badge>
          )}
          {connectionStatus === "failed" && (
            <Badge variant="destructive" className="gap-1.5 px-3 py-1"><X className="size-3" />{isRtl ? "فشل" : "Failed"}</Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchCatalog} disabled={loading} className="gap-2">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            {isRtl ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {connectionMsg && connectionStatus !== "idle" && (
        <Alert variant={connectionStatus === "connected" ? "default" : "destructive"}
          className={cn(connectionStatus === "connected" && "border-emerald-500/50 text-emerald-700 dark:text-emerald-400", "py-3")}>
          {connectionStatus === "connected" ? <Zap className="size-4" /> : <AlertCircle className="size-4" />}
          <AlertDescription className="font-medium">{connectionMsg}</AlertDescription>
        </Alert>
      )}
      {alert && (
        <Alert variant={alert.type === "success" ? "default" : "destructive"}
          className={cn(alert.type === "success" && "border-emerald-500/50 text-emerald-700 dark:text-emerald-400")}>
          {alert.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <div>
            <AlertDescription className="font-medium">{alert.message}</AlertDescription>
            {alert.detail && <p className="text-xs mt-0.5 opacity-70">{alert.detail}</p>}
          </div>
        </Alert>
      )}

      {/* Stats */}
      {connectionStatus === "connected" && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Wallet} label={isRtl ? "الرصيد" : "Balance"} value={`$${balance.toFixed(2)}`} sub={userInfo ? `@${userInfo.username}` : undefined} accent />
          <StatCard icon={Package} label={isRtl ? "الفئات" : "Categories"} value={String(categories.length)} sub={`${categories.filter((c) => c.count > 0).length} ${isRtl ? "نشطة" : "active"}`} />
          <StatCard icon={Gamepad2} label={isRtl ? "الألعاب" : "Games"} value={String(games.length)} sub={isRtl ? "متاحة للمزامنة" : "available to sync"} />
          <StatCard icon={Database} label={isRtl ? "تمت المزامنة" : "Synced"} value="—" sub={isRtl ? "آخر مزامنة: لم تتم" : "Last sync: never"} />
        </div>
      )}

      {/* API Key editor */}
      {connectionStatus === "connected" && (
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{isRtl ? "مفتاح API" : "API Key"}</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[10px]">{isRtl ? "محفوظ في الخادم" : "Stored server-side"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input type={showApiKey ? "text" : "password"} value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={isRtl ? "أدخل مفتاح API جديد..." : "Enter new API key..."} className="pr-10 font-mono text-sm" />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button size="sm" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim() || savingKey} className="gap-2 shrink-0">
                {savingKey ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {isRtl ? "حفظ" : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <Info className="size-3 inline mr-1" />
              {isRtl ? "يتم تخزين المفتاح في الخادم ولا يتم إرساله إلى المتصفح" : "The key is stored server-side and never sent to the browser"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search + Filters */}
      {connectionStatus === "connected" && (
        <Card className="border-muted">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={isRtl ? "بحث..." : "Search..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedCatIds(new Set(categories.map((c) => c.id)));
                  setSelectedGameCodes(new Set(games.map((g) => g.code)));
                }} disabled={categories.length === 0 && games.length === 0} className="gap-2">
                  <Check className="size-4" />{isRtl ? "تحديد الكل" : "Select All"}
                </Button>
                {totalSelected > 0 && (
                  <Button onClick={handleSync} disabled={syncing} className="gap-2 shrink-0">
                    {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    {isRtl ? `مزامنة (${totalSelected})` : `Sync (${totalSelected})`}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "selected", "unselected"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setSelectionFilter(opt)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    selectionFilter === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
                  {opt === "all" ? (isRtl ? "الكل" : "All") : opt === "selected" ? (isRtl ? "المحدد" : "Selected") : (isRtl ? "غير المحدد" : "Unselected")}
                </button>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-1 rounded-lg border p-0.5">
                <button type="button" onClick={() => setViewMode("grid")}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <LayoutGrid className="size-4" />
                </button>
                <button type="button" onClick={() => setViewMode("list")}
                  className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && <Card><CardContent className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="size-10 animate-spin text-primary mx-auto" />
          <div><p className="font-medium">{isRtl ? "جاري التحميل..." : "Loading G2Bulk catalog..."}</p>
            <p className="text-sm text-muted-foreground mt-1">{isRtl ? "جلب المنتجات والألعاب" : "Fetching products and games"}</p></div>
        </div>
      </CardContent></Card>}

      {connectionStatus === "idle" && !loading && (
        <Card><CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Zap className="size-14 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{isRtl ? "لم يتم التحميل بعد" : "Catalog not loaded"}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">{isRtl ? "اضغط تحديث لتحميل الكتالوج" : "Click Refresh to load"}</p>
          <Button onClick={fetchCatalog} className="gap-2" size="lg"><RefreshCw className="size-4" />{isRtl ? "تحميل" : "Load"}</Button>
        </CardContent></Card>
      )}

      {connectionStatus === "failed" && !loading && (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="size-14 text-destructive/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{isRtl ? "فشل الاتصال" : "Connection failed"}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">{connectionMsg}</p>
          <Button onClick={fetchCatalog} variant="outline" className="gap-2"><RefreshCw className="size-4" />{isRtl ? "إعادة المحاولة" : "Retry"}</Button>
        </CardContent></Card>
      )}

      {/* Tabs */}
      {!loading && connectionStatus === "connected" && (
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="h-auto p-1">
            <TabsTrigger value="categories" className="gap-2 py-2.5 px-4">
              <ShoppingBag className="size-4" />{isRtl ? "الفئات" : "Categories"}
              <Badge variant="secondary" className="ml-1 text-[10px]">{categories.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="games" className="gap-2 py-2.5 px-4">
              <Gamepad2 className="size-4" />{isRtl ? "الألعاب" : "Games"}
              <Badge variant="secondary" className="ml-1 text-[10px]">{games.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Categories tab */}
          <TabsContent value="categories" className="space-y-4">
            {filteredCats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="size-10 mx-auto mb-3 opacity-30" />
                <p>{searchQuery || selectionFilter !== "all" ? (isRtl ? "لا توجد فئات مطابقة" : "No matching categories") : (isRtl ? "لا توجد فئات" : "No categories")}</p>
              </div>
            ) : (
              <div className={cn(viewMode === "grid" ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-1.5")}>
                {filteredCats.map((cat) => {
                  const sel = selectedCatIds.has(cat.id);
                  return viewMode === "grid" ? (
                    <button key={cat.id} onClick={() => toggleCat(cat.id)}
                      className={cn("rounded-xl border p-3.5 transition-all text-sm text-left",
                        sel ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50 hover:border-border")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border mt-0.5 transition-colors",
                          sel && "bg-primary border-primary text-primary-foreground")}>
                          {sel && <Check className="size-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{cat.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {cat.count} {isRtl ? "منتج" : "items"} · ${cat.minPrice.toFixed(2)}–${cat.maxPrice.toFixed(2)}
                          </p>
                          <Badge variant="secondary" className="text-[10px] mt-1">#{cat.id}</Badge>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button key={cat.id} onClick={() => toggleCat(cat.id)}
                      className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all text-sm w-full text-left",
                        sel ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                      <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        sel && "bg-primary border-primary text-primary-foreground")}>
                        {sel && <Check className="size-3" />}
                      </div>
                      <span className="font-medium truncate flex-1">{cat.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{cat.count} {isRtl ? "قطعة" : "items"}</span>
                      <span className="text-xs font-bold text-primary shrink-0">${cat.minPrice.toFixed(2)}–${cat.maxPrice.toFixed(2)}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">#{cat.id}</Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Games tab */}
          <TabsContent value="games" className="space-y-4">
            {filteredGames.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gamepad2 className="size-10 mx-auto mb-3 opacity-30" />
                <p>{searchQuery || selectionFilter !== "all" ? (isRtl ? "لا توجد ألعاب مطابقة" : "No matching games") : (isRtl ? "لا توجد ألعاب" : "No games")}</p>
              </div>
            ) : (
              <div className={cn(viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-1.5")}>
                {filteredGames.map((game) => {
                  const sel = selectedGameCodes.has(game.code);
                  const inCarousel = carouselCodes.has(game.code);
                  return viewMode === "grid" ? (
                    <div key={game.code} className={cn("rounded-xl border overflow-hidden transition-all", sel ? "border-primary ring-1 ring-primary" : "hover:border-border")}>
                      <div className="relative aspect-[2/1] bg-muted/30 overflow-hidden">
                        {game.image_url ? <img src={game.image_url} alt={game.name} className="w-full h-full object-contain p-3" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center"><Image className="size-8 text-muted-foreground/30" /></div>}
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggleCarousel(game.code); }}
                          className={cn("absolute top-2 right-2 p-1.5 rounded-lg border transition-all",
                            inCarousel ? "bg-primary border-primary text-primary-foreground" : "bg-background/80 border-border text-muted-foreground hover:text-foreground")}>
                          <LayoutGrid className="size-3.5" />
                        </button>
                      </div>
                      <button onClick={() => toggleGame(game.code)} className="w-full p-3 text-left">
                        <div className="flex items-start gap-2">
                          <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border mt-0.5 transition-colors",
                            sel && "bg-primary border-primary text-primary-foreground")}>
                            {sel && <Check className="size-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{game.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="secondary" className="text-[10px]">{game.code}</Badge>
                              {game.region && <span className="text-[10px] text-muted-foreground">{game.region}</span>}
                            </div>
                            {inCarousel && <Badge variant="default" className="text-[9px] mt-1.5 bg-primary/10 text-primary border-primary/20"><LayoutGrid className="size-2.5 mr-1" />{isRtl ? "كاروسيل" : "Carousel"}</Badge>}
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div key={game.code} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all text-sm w-full text-left",
                      sel ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                      {game.image_url ? <img src={game.image_url} alt="" className="size-8 rounded-md object-contain bg-muted/30 shrink-0" />
                        : <div className="size-8 rounded-md bg-muted/30 flex items-center justify-center shrink-0"><Image className="size-4 text-muted-foreground/30" /></div>}
                      <button onClick={() => toggleGame(game.code)} className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          sel && "bg-primary border-primary text-primary-foreground")}>
                          {sel && <Check className="size-3" />}
                        </div>
                        <span className="font-medium truncate flex-1">{game.name}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{game.code}</Badge>
                        {game.region && <span className="text-[10px] text-muted-foreground shrink-0">{game.region}</span>}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleCarousel(game.code); }}
                        className={cn("p-1.5 rounded-md border transition-all shrink-0", inCarousel ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                        <LayoutGrid className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
