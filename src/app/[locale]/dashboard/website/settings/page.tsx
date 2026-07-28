"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Globe,
  DollarSign,
  Percent,
  Save,
  CheckCircle2,
  Shield,
  Cable,
  Mail,
  Phone,
  Store,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WebsiteSettingsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale || "ar";
  const isRtl = locale === "ar";

  const [saved, setSaved] = useState(false);
  const [storeName, setStoreName] = useState("GH-Store");
  const [supportEmail, setSupportEmail] = useState("support@gh-store.com");
  const [profitMargin, setProfitMargin] = useState("10");
  const [currency, setCurrency] = useState("USD");
  const [defaultLanguage, setDefaultLanguage] = useState("ar");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isRtl ? "إعدادات الموقع والمتجر" : "Store & Website Settings"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isRtl
              ? "التحكم في الهوية التجارية، نسب الربح، والعملة النقدية للمتجر"
              : "Configure global store settings, profit margins, branding and defaults"}
          </p>
        </div>
        <Button onClick={handleSave} className="shrink-0 gap-2">
          <Save className="size-4" />
          {isRtl ? "حفظ التغييرات" : "Save Settings"}
        </Button>
      </div>

      {saved && (
        <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          <AlertDescription className="font-medium">
            {isRtl ? "تم حفظ الإعدادات بنجاح!" : "Settings saved successfully!"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="text-primary size-5" />
              {isRtl ? "الهوية والإعدادات العامة" : "General Information"}
            </CardTitle>
            <CardDescription>
              {isRtl ? "اسم المتجر ومعلومات التواصل" : "Basic store branding and contact details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isRtl ? "اسم المتجر" : "Store Name"}</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? "بريد الدعم الفني" : "Support Email"}</Label>
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? "الغة الافتراضية" : "Default Language"}</Label>
              <Select
                value={defaultLanguage}
                onValueChange={(val) => val && setDefaultLanguage(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  <SelectItem value="en">English (الإنجليزية)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Profit Margins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Percent className="size-5 text-amber-500" />
              {isRtl ? "الهامش الربحي والعملات" : "Pricing & Profit Margins"}
            </CardTitle>
            <CardDescription>
              {isRtl
                ? "تحديد نسبة الربح التلقائية فوق أسعار G2Bulk"
                : "Set automatic profit margin on top of G2Bulk provider prices"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>
                {isRtl ? "نسبة هامش الربح الافتراضية (%)" : "Default Profit Margin (%)"}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(e.target.value)}
                  className="pr-8"
                />
                <Percent className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
              <p className="text-muted-foreground text-xs">
                {isRtl
                  ? "تضاف هذه النسبة تلقائياً على سعر التكلفة من المزوّد عند الاستيراد"
                  : "Automatically added to base provider cost during product sync"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? "عملة المتجر الرئيسية" : "Store Currency"}</Label>
              <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cable className="size-5 text-emerald-500" />
            {isRtl ? "حالة الربط مع المزوّدين" : "Integration Status"}
          </CardTitle>
          <CardDescription>
            {isRtl
              ? "نظرة عامة على حالة الاتصال بالمزوّدين وبوابات الدفع"
              : "Overview of API connections to G2Bulk and SAM API"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-semibold">G2Bulk API</p>
                <p className="text-muted-foreground text-xs">
                  {isRtl ? "مزوّد المنتجات والألعاب" : "Products & Games Provider"}
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                {isRtl ? "نشط" : "Active"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-sm font-semibold">SAM Payment API</p>
                <p className="text-muted-foreground text-xs">
                  {isRtl ? "بوابة الدفع الإلكتروني" : "Payment Gateway Provider"}
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                {isRtl ? "نشط" : "Active"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
