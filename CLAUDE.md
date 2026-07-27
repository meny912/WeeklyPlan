# CLAUDE.md — WeeklyPlan (onspace-app)

מדריך לעבודה על הפרויקט. נוצר במקור ב-OnSpace.AI (no-code), יוצא ל-GitHub
(`meny912/WeeklyPlan`), וכעת מפותח ישירות. האפליקציה כבר ב-App Store.

## מה זה
אפליקציית מובייל **תורנית/יהודית** לתכנון לימוד שבועי: לוח עברי, זמנים הלכתיים,
תניא יומי, "היום יום", טקסטים מספריא, לימוד יומי, ותוכנית שבועית עם התראות.
רב-לשוני (i18n) עם תמיכת RTL.

## סטאק טכנולוגי
- **Expo SDK ~53** (Managed Workflow), **React Native 0.79.3**, **React 19**
- **TypeScript** (strict), alias נתיבים `@/*` → שורש הפרויקט (ראה `tsconfig.json`)
- **ניווט:** `expo-router ~5` (file-based, `app/`), typed routes, tabs
- **New Architecture מופעל** (`newArchEnabled: true` ב-app.json)
- **מנהל חבילות:** **pnpm** (יש `pnpm-lock.yaml`) — השתמש ב-pnpm, לא npm/yarn
- ספריות בולטות: react-native-paper, nativewind, zustand, react-native-calendars,
  react-native-reanimated, lottie, @shopify/flash-list, date-fns, expo-notifications
- **הערה:** רשימת התלויות ענקית — OnSpace מכניס הרבה חבילות כברירת מחדל; לא כולן
  בשימוש בפועל.

## מבנה הפרויקט
```
app/                    מסכים (expo-router)
  _layout.tsx           root layout: AlertProvider > SafeArea > Settings > WeeklyPlan
  (tabs)/               טאבים: today, calendar, manage, summary, index, _layout
  reader.tsx            מסך קורא (מודאלי)
  +not-found.tsx
components/ui/          DayCard, ProgressRing, TaskItem  (+ components/index.ts barrel)
contexts/               SettingsContext, WeeklyPlanContext  (React Context + AsyncStorage)
hooks/                  useColorScheme(.web), useThemeColor, useWeeklyPlan
services/               לוגיקה עסקית (ראה למטה)
constants/
  hayomyom/             נתוני "היום יום" לפי חודשים עבריים + index
  tanya/                parser + נתוני תניא + types
  Colors.ts, theme.ts
template/               תשתית OnSpace (auth/ui/core) — ראה "תבנית OnSpace" למטה
assets/                 fonts (SpaceMono), images (logo, hero, favicon)
scripts/reset-project.js
```

### services/ (כל הלוגיקה — client-side, ללא שרת)
- `weeklyPlanService.ts` — ניהול המשימות/תוכנית; **שומר ב-AsyncStorage**
- `hebrewCalendarService.ts` — לוח עברי
- `zmanimService.ts` — זמנים הלכתיים
- `tanyaScheduleService.ts` — לוח תניא יומי
- `dailyLearningService.ts` — לימוד יומי
- `sefariaService.ts` — משיכת טקסטים מ-Sefaria API
- `notificationService.ts` — התראות (expo-notifications)
- `i18n.ts` — רב-לשוניות

## תבנית OnSpace (`template/`)
OnSpace מזריק תשתית מובנית:
- `template/core/` — `client.ts` (יוצר Supabase client), `config.ts` (ConfigManager),
  `types.ts`
- `template/auth/` — שתי מערכות auth: `supabase/` (אמיתי) ו-`mock/` (פרוטוטייפ)
- `template/ui/` — `AlertProvider` / `useAlert` (דיאלוגים)
- מיוצא דרך `@/template`

**חשוב:** האפליקציה משתמשת מ-`@/template` **רק** ב-`AlertProvider` ו-`useAlert`.
היא **לא** משתמשת ב-auth או ב-Supabase בכלל.

## Supabase ומשתני סביבה
- **Supabase אינו בשימוש כרגע** — כל הנתונים נשמרים מקומית ב-AsyncStorage.
- הקוד ב-`template/core/{client,config}.ts` קורא, אם/כאשר יופעל:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- אם בעתיד תוסיף backend/auth: צור קובץ **`.env`** בשורש עם שני המשתנים
  (קידומת `EXPO_PUBLIC_` הכרחית). הערכים מ-Supabase Dashboard → Project Settings → API.
- **להרצה מקומית של המצב הנוכחי — לא צריך `.env`.**

## איך מריצים לוקאלית
דרישות: **Node 18+** ו-**pnpm** (התקן: `npm i -g pnpm` או corepack).
```bash
pnpm install
pnpm start           # Metro; לחץ i לסימולטור iOS, a לאנדרואיד, w לוב
# או ישירות:
pnpm ios             # expo start --ios
```
- כדי לפתוח על מכשיר פיזי: התקן **Expo Go** וסרוק את ה-QR (חלק מהפיצ'רים
  הנייטיביים לא יעבדו ב-Expo Go — לאלה צריך dev build).

## בנייה ל-iOS
- זה **Managed Expo** — אין תיקיית `ios/` ואין פרויקט Xcode ב-repo.
- ל-build מקומי שמייצר את `ios/`:
  ```bash
  npx expo prebuild -p ios     # מייצר ios/
  npx expo run:ios             # בונה ומריץ בסימולטור/מכשיר
  ```
- ל-App Store: **EAS Build** (`npm i -g eas-cli` → `eas build -p ios`). כרגע אין
  `eas.json` ואין `ios.bundleIdentifier` ב-`app.json` — צריך להוסיף אותם לפני build
  ל-store (OnSpace טיפל בפרסום המקורי, אז ה-config הזה לא נמצא ב-repo).

## קונבנציות קוד (דפוסי OnSpace — לשמור עליהם)
- ייבוא עם alias `@/` (למשל `@/template`, `@/contexts/...`, `@/services/...`).
- קומפוננטות דרך barrel `components/index.ts`.
- State גלובלי דרך React Context (`SettingsContext`, `WeeklyPlanContext`) +
  התמדה ב-AsyncStorage (מפתחות STORAGE_KEY בכל service).
- כמה קבצי template מסומנים `// @ts-nocheck` וכוללים כותרת "Powered by OnSpace.AI" —
  אלו קבצי תשתית; שנה בזהירות.
- TypeScript strict — שמור על טיפוסים.

## Git / סנכרון
- Remote: `github.com/meny912/WeeklyPlan` (repo **פרטי**).
- מסונכרן דו-כיוונית עם OnSpace (GitHub sync). שים לב: שינויים ב-OnSpace ידחפו ל-repo,
  ולהיפך — היזהר מקונפליקטים אם עובדים בשני המקומות.
- שוכפל במקור כ-shallow clone (`--depth 1`). ל-history מלא: `git fetch --unshallow`.

## מוסכמות פנימיות (צוות הסוכנים)
- דוד (backend) אחראי על services/API/מסד נתונים; נועה (frontend) על app/components;
  אבי על תשתית/אבטחה. ראה `agentai/CLAUDE.md`.
