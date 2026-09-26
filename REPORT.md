# Randomized Digital Psychological Interventions for Occupational Burnout: A Scoping Review and Evidence Map

**نوع کار:** Scoping Review خودکار (computational first-pass) با استفاده از سه زیرساخت علمی رایگان (Europe PMC + OpenAlex + ERIC)
**تاریخ اجرا:** 2026-09-26 (به‌روزرسانی: افزودن OpenAlex و ERIC)
**Corpus نهایی:** **116** کارآزمایی تصادفی‌سازی‌شده (از میان ۵۳۶ رکورد یکتا در سه پایگاه)

---

## ۱. هدف و سؤال تحقیق

> میدان کارآزمایی‌های تصادفی مداخلات روان‌شناختی دیجیتال برای burnout شغلی (در همه گروه‌های شغلی) چگونه شکل گرفته، چه دسته‌بندی‌هایی دارد، و در طول زمان چگونه تحول یافته است؟

معیارهای Scope (باید هر چهار شرط هم‌زمان برقرار باشد):

| بعد | معیار |
|---|---|
| Population | شاغلین (هر حرفه)، نه صرفاً دانشجو یا بیمار |
| Intervention | مداخله **دیجیتال** و **روان‌شناختی** توأمان |
| Outcome | Burnout باید واقعاً اندازه‌گیری‌شده باشد (نه فقط استرس/اضطراب) |
| Design | RCT / cluster-RCT / crossover / stepped-wedge |

---

## ۲. روش و زیرساخت علمی استفاده‌شده — سه پایگاه رایگان

نسخه اول این پروژه فقط از Europe PMC استفاده می‌کرد. در ادامه کار، این سؤال مطرح شد: *«آیا پایگاه‌های دیگر مثل OpenAlex کافی نیستند؟»* برای پاسخ، سه منبع دیگر واقعاً آزمایش و اضافه شدند:

| پایگاه | وضعیت دسترسی | نقش در این پروژه |
|---|---|---|
| **Europe PMC** | رایگان، بدون کلید، بدون rate-limit | ستون فقرات corpus (MEDLINE + PMC + Agricola + preprints) |
| **OpenAlex** | نیاز به API key شخصی رایگان (کلید کاربر استفاده شد) — بدون کلید، سهمیه رایگان مشترک IP در این محیط تمام‌شده بود | منبع دوم؛ پوشش چندرشته‌ای وسیع‌تر (ژورنال‌های غیرزیست‌پزشکی) |
| **ERIC** | رایگان، بدون کلید | تست مستقیم white space «معلمان»؛ پایگاه تخصصی آموزش |
| **ClinicalTrials.gov** | رایگان، بدون کلید (API v2) | صرفاً برای بررسی publication bias (بخش ۸)، نه برای افزودن مطالعه به corpus |
| OpenAlex بدون کلید / Semantic Scholar | rate-limit مشترک IP این محیط تمام شده بود («$0 remaining, resets at midnight UTC») | غیرقابل استفاده تا زمانی که کاربر کلید شخصی داد |
| Cochrane CENTRAL / PsycINFO / Scopus / WoS | بدون API عمومی رایگان از این محیط | **همچنان پوشش داده نشده‌اند** — محدودیت باقی‌مانده |

### ۲.۱ Europe PMC (منبع اصلی)

Query چهارگانه روی فیلد `TITLE_ABS` (burnout × digital × psychological × randomized). hitCount خام: **227**.

### ۲.۲ OpenAlex (منبع دوم، با کلید کاربر)

همان query چهارگانه روی `title_and_abstract.search`. hitCount خام: **716** (به‌طور قابل‌توجهی وسیع‌تر از Europe PMC، چون OpenAlex full-text-style matching انجام می‌دهد و ژورنال‌های خارج از MEDLINE را هم می‌پوشاند).

مراحل پالایش:
- **۲۵۹ رکورد** از قبل در Europe PMC بودند (تکراری) → حذف
- **۱۱۶ رکورد** با `type` نامناسب (review/dissertation/editorial/conference-abstract/...) → حذف
- **۲۶ رکورد** بدون چکیده در دسترس (closed-access) → قابل غربالگری نبودند → حذف
- **۳۱۵ رکورد جدید واقعی** باقی ماند و غربالگری شد
- غربالگری خودکار: ۴۶ include
- **بازبینی دستی** (چون OpenAlex's full-text search نویز بیشتری دارد): حذف ۷ false-positive واقعی (مثلاً یک مطالعه درباره «Psilocybin Therapy» که کلمه digital را به‌صورت اتفاقی match کرده بود؛ یک ثبت پروتکل PROSPERO که به‌اشتباه به‌عنوان RCT تشخیص داده شده بود؛ دو خلاصه کنفرانس AUA که در واقع گزارش‌های مقدماتی همان کارآزمایی‌هایی بودند که قبلاً include شده بودند) + حذف ۴ رکورد تکراری داخلی (OpenAlex یک deposit را دوبار index کرده بود: نسخه Zenodo، نسخه OSF بدون DOI resolve شده، و غیره) + ۳ مورد «Uncertain» (نیاز به بررسی متن کامل)
- نتیجه نهایی: **۳۰ مطالعه جدید واقعی** که در Europe PMC نبودند.

### ۲.۳ ERIC (منبع سوم، تست مستقیم white space)

برای پاسخ دقیق به این سؤال که آیا کمبود مطالعات معلمان یک artifact انتخاب Europe PMC است، همان query روی ERIC (پایگاه رسمی و رایگان تحقیقات آموزشی، `api.ies.ed.gov/eric`) اجرا شد.

- ۸ رکورد کاندید پیدا شد
- ۷ مورد حذف شد: برنامه‌های حضوری/کتاب‌محور (مثل CARE for Teachers که یک برنامه mindfulness کلاسی است، نه دیجیتال)، یک مطالعه با جمعیت فقط دانشجویی (نه شاغل)، یک مقاله مفهومی بدون RCT
- **۱ مطالعه واقعاً جدید** ماند: *"Improving Teacher Wellbeing: A Randomized Pilot Study of an Online Self-Guided Single Session Consultation Intervention"* (۲۰۲۴) — معلمان، آنلاین، wait-list control، سنجش emotional exhaustion.

### ۲.۴ جدول Pipeline

| مرحله | اسکریپت |
|---|---|
| Fetch هر پایگاه | `scripts/01_fetch_europepmc.py`, fetch_openalex.py, fetch_eric.py (در `data/` سه raw جداگانه) |
| Dedupe + Screen (Europe PMC) | `scripts/02_dedupe_screen.py` |
| Cross-database dedup + screen (OpenAlex) | `openalex_new.py` → `screen_openalex.py` → `openalex_reconcile.py` (بازبینی دستی مستند) |
| ادغام همه منابع + کدگذاری یکپارچه | `merge_all.py` (دیکشنری‌های regex یکسان با `03_code_categories.py`) |
| Clustering روی corpus کامل | `cluster_all.py` |
| Analysis نهایی | `analysis_all.py` → `data/final_analysis_all.json`, `data/coded_dataset_all.csv` |

---

## ۳. جریان غربالگری چندپایگاهی (PRISMA-ScR-style flow)

```
Europe PMC:  227 raw → 213 unique → 85 include / 32 uncertain / 96 exclude
OpenAlex:    716 raw → 315 genuinely new (after cross-db dedup + type/abstract filters)
                     → 46 automated include → manual reconciliation → 30 final include
ERIC:          8 raw → 1 include (7 excluded: non-digital delivery or student-only)
                                    ──────────────────────────
Total unique records screened across 3 databases:      n = 536
                                    ──────────────────────────
Included in final scoping corpus:                       n = 116
  (Europe PMC = 85, OpenAlex = 30, ERIC = 1)
```

⚠️ **محدودیت روش‌شناختی:** غربالگری Europe PMC و ERIC تک‌مرحله‌ای و خودکار است. غربالگری OpenAlex یک بازبینی دستی اضافه هم داشت (چون full-text search آن نویز بیشتری تولید می‌کند) اما هنوز معادل بازبینی مستقل دو-داور انسانی روی متن کامل نیست. Cochrane CENTRAL، PsycINFO و Scopus/Web of Science هنوز پوشش داده نشده‌اند (بدون API رایگان در این محیط).

---

## ۴. توزیع کدگذاری‌شده (n=116)

### شغل/جمعیت
| دسته | n | تغییر نسبت به نسخه تک‌پایگاهی (n=85) |
|---|---:|---|
| عمومی/ترکیبی از شاغلین | 54 | +12 |
| کارکنان نظام سلامت (ترکیبی) | 35 | +4 |
| پرستاران | 20 | +4 |
| پزشکان/دستیاران تخصصی | 20 | +5 |
| متخصصین سلامت روان | 14 | +5 |
| نامشخص/ترکیبی | 12 | +4 |
| **معلمان/آموزگاران** | **10** | **+8 (از ۲ به ۱۰ — ۵ برابر)** |
| **کارکنان شرکتی/اداری** | **7** | **+3** |
| کادر دامپزشکی | 1 | ۰ |

→ افزودن OpenAlex و ERIC مستقیماً white space «معلمان» را با ۸ مطالعه جدید (۷ از OpenAlex + ۱ از ERIC) پر کرد. این تأیید می‌کند که کمبود قبلی واقعاً **artifact انتخاب پایگاه** بود، نه فقدان واقعی literature.

### فناوری دیجیتال (n=116)
| فناوری | n |
|---|---:|
| نامشخص در چکیده | 42 |
| وب‌محور/آنلاین | 42 |
| اپلیکیشن موبایل/هوشمند | 15 |
| mHealth/eHealth | 8 |
| ویدئوکنفرانس/تله‌هلث | 5 |
| واقعیت مجازی (VR) | 3 |
| پوشیدنی/بیوفیدبک | 3 |
| صوتی | 2 |
| کامپیوتری | 2 |
| ترکیبی/Hybrid | 1 |
| چت‌بات/AI | 1 |

### رویکرد/مکانیسم روان‌شناختی (n=116)
| رویکرد | n |
|---|---:|
| ذهن‌آگاهی/MBSR/MBCT | 46 |
| خودشفقت‌ورزی | 24 |
| نامشخص/سایر | 23 |
| مدیریت استرس (عمومی) | 14 |
| تنظیم هیجان | 12 |
| کوچینگ | 12 |
| CBT/iCBT | 11 |
| روان‌شناسی مثبت‌گرا | 8 |
| روان‌آموزی | 7 |
| آرام‌سازی/تنفس/بیوفیدبک | 6 |
| تاب‌آوری | 6 |
| ACT | 5 |

### ابزار سنجش Burnout (n=116)
| ابزار | n |
|---|---:|
| نامشخص در چکیده | 80 |
| Maslach (MBI) | 24 |
| Oldenburg (OLBI) | 5 |
| ProQOL | 4 |
| Copenhagen (CBI) | 3 |
| BAT | 1 |
| Shirom-Melamed (SMBM) | 1 |

---

## ۵. تحلیل روند زمانی (n=116، ۲۰۰۹–۲۰۲۶)

```
2009 ▏1    2019 ▍4     2023 ████17
2012 ▏1    2020 █▉7    2024 ███▌14
2014 ▎2    2021 ██▎9   2025 █████▊23
2015 ▏1    2022 ██▊11  2026 █████20  (تا سپتامبر)
2016 ▎3
2018 ▎3
```

### مقایسه دوره اولیه (۲۰۰۹–۲۰۲۱) در برابر دوره اخیر (۲۰۲۲–۲۰۲۶)

| بُعد | یافته |
|---|---|
| رویکرد | ACT از ۱ مطالعه (دوره اول) به ۴ رسید؛ خودشفقت‌ورزی از ۱ به ۲۳؛ روان‌شناسی مثبت‌گرا از ۲ به ۶ — رشد قوی رویکردهای acceptance/strengths-based |
| فناوری | VR، چت‌بات/AI، پوشیدنی+بیوفیدبک، Hybrid delivery همچنان فقط از ۲۰۲۲ به بعد ظاهر می‌شوند |
| جمعیت | معلمان از ۱ مطالعه (دوره اول) به ۹ مطالعه (دوره اخیر) رسیدند — تقریباً تمام رشد این جمعیت محصول افزودن OpenAlex/ERIC است، نه رشد طبیعی در Europe PMC |
| کارکنان شرکتی | از ۴ (دوره اول) به ۳ (دوره اخیر) — این تنها دسته‌ای است که رشد نکرده؛ همچنان white space واقعی |

---

## ۶. خوشه‌بندی معنایی (n=116، k=7، silhouette=0.012)

| خوشه | n | واژگان کلیدی | تفسیر |
|---|---:|---|---|
| 2 | 29 | mindfulness, program, compassion, online mindfulness | بزرگ‌ترین خوشه: مداخلات ذهن‌آگاهی/خودشفقت آنلاین، ترکیبی از جمعیت‌ها |
| 3 | 20 | related, work, employees, web, internet | مداخلات وب‌محور عمومی work-related stress، شامل بسیاری از مطالعات جدید OpenAlex (کارکنان شرکتی/عمومی) |
| 1 | 19 | coaching, physician, points, meditation | کوچینگ پزشکان + یوگا/مدیتیشن؛ شامل خوشه قبلی «impostor syndrome / moral injury» |
| 0 | 16 | mindfulness, professionals, virtual, compassion | ذهن‌آگاهی/VR در متخصصین سلامت |
| 5 | 16 | covid, pandemic, mental health | موج مداخلات دوران کووید |
| 4 | 14 | nurses, nursing, job, coping | خوشه مشخص پرستاران |
| 6 | 2 | hcw, cohort | جفت انتشار تکراری از یک کارآزمایی واحد (WISER) |

**نکته:** با افزودن مطالعات OpenAlex، خوشه‌ی سابق «کوچینگ + impostor syndrome + moral injury» با خوشه بزرگ‌تر کوچینگ ادغام شد (اکنون خوشه ۱، n=19) — نشان می‌دهد با افزایش حجم داده، آن زیرتم به‌جای یک outlier کوچک، بخشی از یک جریان اصلی‌تر (کوچینگ پزشکان) است.

---

## ۷. نقشه‌های شواهد (Evidence Maps) — به‌روزرسانی‌شده

- **Mindfulness × عمومی/ترکیبی شاغلین** و **Mindfulness × کارکنان سلامت** پرتراکم‌ترین سلول‌ها هستند.
- **ACT** و **Positive Psychology** دیگر «منحصراً پزشکی/پرستاری» نیستند: هر دو اکنون حداقل یک مطالعه در جمعیت‌های غیرسلامت دارند (Positive Psychology یک مطالعه روی معلمان، ACT یک مطالعه روی کادر دامپزشکی) — اما همچنان بسیار کم (۱ مطالعه هرکدام) در مقایسه با ۱۰-۱۲ مطالعه در جمعیت‌های سلامت.
- فناوری‌های نوظهور (VR، چت‌بات) هنوز به‌ندرت با رویکردهای غیر-mindfulness/CBT ترکیب شده‌اند.

### White Spaces (خلأهای شواهد) — نسخه به‌روزشده

1. **کارکنان شرکتی/اداری همچنان white space واقعی است** (۷ مطالعه از ۱۱۶، و رشدی در دوره اخیر نداشته) — برخلاف معلمان، این یکی artifact پایگاه‌داده نبود؛ حتی با ۳ پایگاه هنوز کم است.
2. معلمان دیگر white space شدید نیستند (۱۰ مطالعه)، اما همچنان کوچک‌تر از جمعیت‌های سلامت.
3. ابزار استاندارد سنجش burnout در اکثر چکیده‌ها (۸۰ از ۱۱۶) ذکر نشده.
4. گروه مقایسه فعال (active control) فقط در ۱۳ از ۱۱۶ مطالعه.
5. مداخلات چت‌بات/AI-adaptive تنها ۱ مطالعه از ۱۱۶ — عملاً هنوز وارد این ادبیات نشده.

---

## ۸. بررسی ثبت کارآزمایی‌ها (ClinicalTrials.gov) — سیگنال Publication Bias

برای پاسخ کامل به سؤال «آیا پایگاه‌های دیگر کافی هستند»، یک بررسی مکمل روی **ClinicalTrials.gov API v2** (رایگان، بدون کلید) انجام شد — نه برای افزودن مطالعه به corpus (چون رکوردهای registry نتیجه منتشرشده ندارند)، بلکه برای سنجش publication bias، همان‌طور که PRISMA-ScR توصیه می‌کند.

با معیار دقیق (Condition شامل «Burnout» + جمعیت شغلی + واژه دیجیتال در عنوان): **۲۴ کارآزمایی ثبت‌شده** پیدا شد که:
- ۱۶ مورد **COMPLETED** هستند
- تنها **۲ مورد** نتیجه را مستقیماً در خود registry ثبت کرده‌اند
- **۱۴ کارآزمایی تکمیل‌شده هیچ نتیجه‌ای در registry ندارند** — این‌ها یا هنوز منتشر نشده‌اند، یا در یک ژورنال منتشر شده‌اند ولی نتیجه در ClinicalTrials.gov آپلود نشده است

دو ثبت جالب:
- `NCT05036356` (Headspace BREATHE trial) — همان کارآزمایی‌ای که در corpus ما (از Europe PMC) وجود دارد؛ تأیید تطبیق cross-database.
- `NCT04126564` («Inner Engineering Online... Specific Company Employee Program») — یک کارآزمایی **شرکتی** تکمیل‌شده که در جست‌وجوی Europe PMC/OpenAlex/ERIC ما هیچ انتشار متناظری برایش پیدا نشد؛ نمونه‌ای مستقیم از publication gap در بخش کارکنان شرکتی.

⚠️ این عدد (۲۴) از یک جست‌وجوی متن‌کامل و گسترده‌تر روی کل registry به دست آمده، نه همان معیار دقیق غربالگری corpus اصلی — باید صرفاً illustrative در نظر گرفته شود، نه یک denominator قابل‌مقایسه مستقیم.

---

## ۹. جایگاه Novelty

با پوشش سه پایگاه، corpus به ۱۱۶ مطالعه رسید — بازهم هیچ مرور موجود (Yang 2026 محدود به پرستاران؛ Stratton 2025 با outcome عمومی؛ Carolan 2017 با outcome عمومی wellbeing) دقیقاً همین تقاطع چهارگانه را با scope همه‌مشاغل پوشش نداده است. ادعای novelty قوی‌تر شده، چون اکنون محدودیت «فقط زیست‌پزشکی» رفع شده و پوشش چندرشته‌ای واقعی (از جمله آموزش) به‌کار رفته است.

---

## ۱۰. محدودیت‌های باقی‌مانده (شفاف و صریح)

1. **پایگاه‌های همچنان پوشش‌نداده:** PsycINFO، Cochrane CENTRAL، Scopus، Web of Science — هیچ‌کدام API رایگان مستقیم در این محیط نداشتند.
2. **غربالگری OpenAlex نیمه‌خودکار:** بازبینی دستی روی ۴۶ کاندید انجام شد (مستند در `openalex_reconcile.py`)، اما این معادل دو-داور مستقل کامل نیست.
3. **Citation chasing انجام نشد:** بررسی سیستماتیک reference list و cited-by مطالعات include‌شده (یک روش رایگان جایگزین برای عدم دسترسی به Scopus/WoS) در این نسخه اجرا نشد؛ توصیه می‌شود در پروتکل نهایی اضافه شود.
4. **ClinicalTrials.gov فقط illustrative:** استفاده‌شده برای سنجش publication bias، نه به‌عنوان منبع inclusion.
5. **کدگذاری مبتنی بر چکیده:** بسیاری از سلول‌های «نامشخص» به این دلیل است که چکیده‌ها جزئیات فناوری/ابزار/گروه مقایسه را ذکر نمی‌کنند.
6. **خوشه‌بندی روی corpus نسبتاً کوچک و متراکم:** silhouette پایین (۰.۰۱۲)؛ تفسیر خوشه‌ها کیفی است.
7. **بدون meta-analysis:** این خروجی نقشه شواهد است، نه برآورد اندازه‌اثر تجمیعی.

---

## ۱۱. فایل‌های ضمیمه

- `data/raw_europepmc.json`, `data/screened.json`, `data/coded.json`, `data/clustered.json`, `data/final_analysis.json`, `data/coded_dataset.csv` — pipeline اولیه تک‌پایگاهی (n=85)
- `data/coded_all.json`, `data/clustered_all.json` — corpus ادغام‌شده سه‌پایگاهی (n=116)
- `data/final_analysis_all.json`, `data/coded_dataset_all.csv` — خروجی نهایی تحلیل (منبع dashboard فعلی)
- `data/dashboard_data_all.json` — دیتای embed‌شده در dashboard
- `scripts/01`–`06` — pipeline اولیه Europe PMC
- `openalex_new.py`, `screen_openalex.py`, `openalex_reconcile.py`, `merge_all.py`, `cluster_all.py`, `analysis_all.py`, `prep_dashboard_all.py` — افزونه چندپایگاهی (این فایل‌ها هنوز باید به `scripts/` منتقل شوند؛ به بخش README مراجعه کنید)
