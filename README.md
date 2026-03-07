# Tejwal Fingerprint Queue System

نظام تنظيم طابور البصمة للمكاتب بتصميم عصري ودعم كامل للغة العربية.

## التقنيات المستخدمة
- **Next.js 15**: الإطار البرمجي الأساسي للمشروع.
- **Prisma 7 & SQLite**: لإدارة قاعدة البيانات محلياً وبسهولة.
- **Vanilla CSS**: لتصميم واجهة مستخدم متميزة ومرنة.
- **Lucide React**: للأيقونات العصرية.
- **Geolocation API**: للتحقق من وجود المراجع داخل نطاق المكتب.

## بنية المشروع
- `src/app/page.tsx`: صفحة التسجيل (الواجهة الرئيسية للمراجع).
- `src/app/ticket/[id]/page.tsx`: صفحة التذكرة الرقمية للمراجع.
- `src/app/tv/page.tsx`: شاشة العرض للتلفزيون الداخلي.
- `src/app/staff/page.tsx`: لوحة تحكم الموظف.
- `src/app/api/`: المسارات الخاصة بالعمليات البرمجية (Registration, Queue Management).
- `src/lib/`: المكتبات المساعدة (Prisma, Helpers).
- `prisma/`: مخطط قاعدة البيانات.

## كيفية التشغيل
1. تثبيت الحزم: `npm install`
2. تهيئة قاعدة البيانات: `npx prisma db push`
3. تشغيل المشروع: `npm run dev`

## الملاحظات التقنية
- **Geofencing**: الإحداثيات محددة في `src/app/api/register/route.ts`.
- **Audio**: يرجى إضافة `public/bell.mp3`.
- **Polling**: التحديث تلقائي كل 5 ثوانٍ.
