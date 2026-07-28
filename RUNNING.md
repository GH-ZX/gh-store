# دليل تشغيل مشروع GH-Store | Running Instructions

هذا الملف يحتوي على كافة الخطوات والتعليمات اللازمة لتشغيل وتطوير مشروع **GH-Store** باستخدام **pnpm** و **Next.js 16**.

---

## 🛠 المتطلبات الأساسية (Prerequisites)

- **Node.js**: إصدار 22 أو أعلى (`>=22.0.0`)
- **pnpm**: الإصدار 11 (`pnpm@11.x`)

إذا لم يكن `pnpm` مثبتاً لديك، يمكنك تثبيته بالأمر:

```bash
npm install -g pnpm
```

---

## 🚀 خطوات التشغيل السريعة (Quick Start)

### 1. إعداد المتغيرات البيئية (Environment Variables)

قم بإنشاء ملف `.env.local` بناءً على ملف النموذج `.env.example`:

**على نظام Windows (PowerShell):**

```powershell
cp .env.example .env.local
```

**على نظام Linux / macOS:**

```bash
cp .env.example .env.local
```

قم بفتح ملف `.env.local` وتأكد من إضافة المفاتيح الخاصة بـ **Supabase** وبوابات الدفع والمزودين (`G2Bulk`, `SAM API`) حسب الحاجة.

---

### 2. تثبيت المكتبات وتجهيز الاعتمادات

```bash
pnpm install
```

في حال ظهرت تنبيهات تحذيرية للبناء الأول للمكتبات، قم بالموافقة عليها بالأمر:

```bash
pnpm approve-builds --all
```

---

### 3. تشغيل سيرفر التطوير (Development Server)

```bash
pnpm dev
```

افتح المتصفح وانتقل إلى الرابط:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📜 الأوامر المتاحة (Available Scripts)

| الأمر            | الوصف                                                              |
| :--------------- | :----------------------------------------------------------------- |
| `pnpm dev`       | تشغيل التطبيق في بيئة التطوير (مع التحديث التلقائي)                |
| `pnpm build`     | بناء نسخة الإنتاج الخاصة بالمشروع (Production Build)               |
| `pnpm start`     | تشغيل النسخة المبنّية للتطبيق                                      |
| `pnpm typecheck` | التحقق من صحة أنواع TypeScript بدون بناء (`tsc --noEmit`)          |
| `pnpm lint`      | فحص الأخطاء والتنسيقات باستخدام ESLint                             |
| `pnpm lint:fix`  | الإصلاح التلقائي لأخطاء التنسيق و ESLint                           |
| `pnpm format`    | إعادة تنسيق الكود باستخدام Prettier                                |
| `pnpm check`     | تشغيل كافة الفحوصات الجودة (`lint` + `typecheck` + `format:check`) |

---

## 🔍 الملاحظات والهيكلية المعمارية

- **الإصدارات المثبتة**:
  - Next.js: `16.2.12`
  - React: `19.2.8`
  - TypeScript: `5.9.3`
  - Tailwind CSS: `4.x`
- **التدويل (i18n)**: التطبيق يدعم اللغتين العربية والإلكترونية مع توجيه الاتجاه الآلي RTL/LTR. اللغة الافتراضية هي العربية (`ar`).
