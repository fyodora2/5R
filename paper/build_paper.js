const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ImageRun, PageBreak, ExternalHyperlink, LevelFormat,
} = require("docx");

const FIG = "/tmp/claude-0/-home-user-5R/14dab2f3-5787-57a7-a5d2-a338b3a44ff0/scratchpad/paper/figures";
const FA_PATH = "/home/user/burnout-digital-scoping-review/data/final_analysis_all.json";
const FA = JSON.parse(fs.readFileSync(FA_PATH, "utf8"));
const S = FA.summary;

const FA_RTL = "Tahoma";
const FA_LTR = "Calibri";

const FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
function faNum(n) {
  return String(n).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);
}
function fa(text, opts = {}) {
  return new TextRun({ text, font: FA_RTL, rightToLeft: true, ...opts });
}
function en(text, opts = {}) {
  return new TextRun({ text, font: FA_LTR, ...opts });
}
function pFa(children, opts = {}) {
  const runs = Array.isArray(children) ? children : [fa(children)];
  return new Paragraph({ children: runs, bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 160, line: 300 }, ...opts });
}
function pEn(children, opts = {}) {
  const runs = Array.isArray(children) ? children : [en(children)];
  return new Paragraph({ children: runs, alignment: AlignmentType.LEFT, spacing: { after: 160, line: 280 }, ...opts });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { before: 400, after: 200 },
    children: [fa(text, { bold: true, size: 30, color: "0b0b0b" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    bidirectional: true, alignment: AlignmentType.RIGHT,
    spacing: { before: 280, after: 160 },
    children: [fa(text, { bold: true, size: 25, color: "1c5cab" })],
  });
}
function h1en(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 400, after: 200 },
    children: [en(text, { bold: true, size: 30, color: "0b0b0b" })],
  });
}
function bulletsFa(items) {
  return items.map((t) => new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT,
    bullet: { level: 0 },
    spacing: { after: 120, line: 280 },
    children: [fa(t)],
  }));
}
function hr() {
  return new Paragraph({
    border: { bottom: { color: "c3c2b7", space: 4, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 200, after: 200 },
  });
}
function figure(file, caption, widthPx = 620) {
  const buf = fs.readFileSync(path.join(FIG, file));
  const dims = getPngDims(buf);
  const ratio = dims.height / dims.width;
  const w = widthPx, hgt = Math.round(widthPx * ratio);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [new ImageRun({ data: buf, type: "png", transformation: { width: w, height: hgt } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, bidirectional: true,
      spacing: { after: 260 },
      children: [fa(caption, { italics: true, size: 18, color: "52514e" })],
    }),
  ];
}
function getPngDims(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function tableFa(headers, rows, colWidthsPct) {
  const total = 9350;
  const widths = colWidthsPct ? colWidthsPct.map((p) => Math.round((p / 100) * total)) : headers.map(() => Math.round(total / headers.length));
  const headerRow = new TableRow({
    children: headers.map((htxt, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: "1c5cab" },
      children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, children: [fa(htxt, { bold: true, color: "ffffff", size: 19 })] })],
    })),
  });
  const bodyRows = rows.map((r, ridx) => new TableRow({
    children: r.map((cell, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ridx % 2 === 0 ? "f9f9f7" : "ffffff" },
      children: [new Paragraph({ bidirectional: true, alignment: i === 0 ? AlignmentType.RIGHT : AlignmentType.CENTER, children: [fa(String(cell), { size: 18 })] })],
    })),
  }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

// ---------------------------------------------------------------------------
// CONTENT
// ---------------------------------------------------------------------------

const TITLE_FA = "مداخلات روان‌شناختی دیجیتال تصادفی‌سازی‌شده برای فرسودگی شغلی: یک مرور دامنه‌ای و نقشه شواهد";
const TITLE_EN = "Randomized Digital Psychological Interventions for Occupational Burnout: A Scoping Review and Evidence Map";

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FA_RTL, size: 22 } },
    },
  },
  numbering: {
    config: [{ reference: "bullet-fa", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.RIGHT }] }],
  },
  sections: [{
    properties: { page: { size: { width: 11907, height: 16840 } } }, // A4
    children: [

      // ---------------- Title page ----------------
      new Paragraph({ spacing: { before: 600, after: 100 }, alignment: AlignmentType.CENTER, children: [en("Scoping Review", { size: 20, color: "898781" })] }),
      new Paragraph({ heading: HeadingLevel.TITLE, bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [fa(TITLE_FA, { bold: true, size: 36 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [en(TITLE_EN, { italics: true, size: 24, color: "52514e" })] }),
      pFa([fa("نویسنده(گان): ", { bold: true }), fa("[نام و وابستگی سازمانی محقق مسئول را اینجا وارد کنید]")], { alignment: AlignmentType.CENTER }),
      pFa([fa("تاریخ: ", { bold: true }), fa("۲۷ سپتامبر ۲۰۲۶")], { alignment: AlignmentType.CENTER }),
      pFa([fa("مخزن داده و کد: ", { bold: true }), fa("github.com/fyodora2/burnout-digital-scoping-review")], { alignment: AlignmentType.CENTER }),
      hr(),

      // ---------------- Abstract (Persian) ----------------
      h1("چکیده"),
      pFa([fa("مقدمه: ", { bold: true }), fa("فرسودگی شغلی در میان شاغلین رو به افزایش است و مداخلات روان‌شناختی دیجیتال به‌عنوان یک راه‌حل مقیاس‌پذیر مطرح شده‌اند. با این حال، مشخص نیست میدان کارآزمایی‌های تصادفی‌سازی‌شده این حوزه—در همه گروه‌های شغلی، نه فقط نظام سلامت—چگونه شکل گرفته و تحول یافته است.")]),
      pFa([fa("هدف: ", { bold: true }), fa("نقشه‌برداری از حجم، ویژگی‌ها، روند زمانی و خلأهای شواهدِ کارآزمایی‌های تصادفی‌سازی‌شده مداخلات روان‌شناختی دیجیتال برای فرسودگی شغلی، در تمام گروه‌های شغلی.")]),
      pFa([fa("روش: ", { bold: true }), fa("این مرور دامنه‌ای بر اساس چارچوب PRISMA-ScR طراحی شد. پنج پایگاه علمی—Europe PMC، OpenAlex و ERIC (رایگان) و Web of Science و Scopus (دسترسی نهادی)—با یک عبارت جستجوی چهاروجهی یکسان (فرسودگی × دیجیتال × روان‌شناختی × تصادفی‌سازی‌شده) کاوش شدند (متن کامل عبارت‌ها در پیوست ب). غربالگری عنوان/چکیده به‌صورت قانون‌محور و خودکار انجام شد و برای هر پایگاه (به‌جز Europe PMC) یک بازبینی دستی مستند اضافه شد. صحت غربالگری خودکار با دو بازبینی نمونه‌ای تصادفی مستقل (هرکدام n=۱۵) به‌طور مستقل بازآزمایی شد (بخش ۲.۸). کدگذاری چندبرچسبی روی شش بُعد (شغل، فناوری، رویکرد روان‌شناختی، ابزار سنجش، گروه مقایسه، نوع راهنمایی) و خوشه‌بندی معنایی (TF-IDF + KMeans) روی چکیده‌ها انجام شد.")]),
      pFa([fa("یافته‌ها: ", { bold: true }), fa(`از میان ۱٬۰۹۴ رکورد یکتای غربالگری‌شده، ${faNum(S.n_included)} گزارش/انتشار واجد شرایط تشخیص داده شد (Europe PMC=۸۴، OpenAlex=۲۹، Web of Science=۱۸، Scopus=۱۲، ERIC=۱)، که تاکنون حداکثر ≈۱۴۲ کارآزمایی مستقل شناسایی‌شده‌اند (سه گزارش «WISER» یک کارآزمایی واحدند؛ این یک سقفِ فعلی است نه کف، چون تطبیق رکورد-به-کارآزمایی برای باقی corpus کامل نشده؛ بخش ۳.۷). حدود ۷۳٫۶٪ (۱۰۶ از ۱۴۴) بعد از سال ۲۰۲۱ منتشر شده‌اند. ذهن‌آگاهی (n=۵۹) رایج‌ترین رویکرد بود؛ رویکردهای مبتنی بر پذیرش/خودشفقت‌ورزی و فناوری‌های نوظهور (واقعیت مجازی، هوش مصنوعی) عمدتاً از سال ۲۰۲۲ به بعد ظاهر شدند. خوشه‌بندی معنایی (silhouette=۰٫۰۱۳، تفسیر آن باید صرفاً کیفی و اکتشافی باشد) یک زیرخوشه ۱۲عضوی حول کوچینگ پزشکان را آشکار کرد که ۵ گزارش آن (۴۲٪) صریحاً «سندرم ایمپاستر» یا «آسیب اخلاقی» را ذکر کرده‌اند—الگویی که در taxonomy رایج دیده نمی‌شود اما نیازمند بررسی کیفی مستقل است. حدود ۶۱٪ رکوردها (۸۸ از ۱۴۴) دست‌کم یک برچسب شغلی مرتبط با نظام سلامت داشتند؛ معلمان و کارکنان بخش شرکتی/اداری کمترین سهم را داشتند (به ترتیب n=۱۴ و n=۹)—اما با توجه به ۳۷ عنوان Scopus که همچنان resolve‌نشده مانده‌اند، این را کم‌نمایندگی در corpus بازیابی‌شده بدانید، نه اثبات خلأ پژوهشی قطعی. یک بررسی مکمل و کاملاً مستندشده تطبیق ثبت کارآزمایی‌ها (ClinicalTrials.gov) روی ۲۸ کارآزمایی تکمیل‌شده منطبق نشان داد تنها برای ۸ مورد (۲۹٪) انتشار متناظری در corpus این پروژه یافت شد؛ این نتیجهٔ «تطبیق ثبت-به-انتشار» است، نه برآورد قطعی سوگیری انتشار.`)]),
      pFa([fa("نتیجه‌گیری: ", { bold: true }), fa("این حوزه به‌سرعت در حال رشد است اما به‌شدت حول نظام سلامت متمرکز مانده؛ در corpus بازیابی‌شده، کارکنان بخش شرکتی/اداری کمتر نمایندگی شده‌اند، هرچند کامل‌بودن این خلأ به تکمیل جست‌وجوی Scopus و منابع پوشش‌نداده (PsycINFO، CENTRAL) وابسته است. یافته‌های روش‌شناختی (تفاوت پوشش پایگاه‌ها، مسئله رکورد در برابر intervention مستقل، محدودیت‌های خودآشکارشده غربالگری خودکار، سیگنال تطبیق ثبت-به-انتشار) به‌اندازه یافته‌های محتوایی حائز اهمیت‌اند.")]),
      pFa([fa("کلیدواژه‌ها: ", { bold: true }), fa("فرسودگی شغلی؛ مداخله دیجیتال؛ کارآزمایی تصادفی‌سازی‌شده؛ مرور دامنه‌ای؛ نقشه شواهد؛ سلامت روان شاغلین")]),
      hr(),

      // ---------------- Abstract (English) ----------------
      h1en("Abstract"),
      pEn([en("Background: ", { bold: true }), en("Occupational burnout is rising among working adults, and digital psychological interventions have emerged as a scalable response. It remains unclear how the randomized-trial evidence base for this field has developed across occupations broadly, not just within healthcare.")]),
      pEn([en("Objective: ", { bold: true }), en("To map the volume, characteristics, temporal evolution, and evidence gaps of randomized controlled trials of digital psychological interventions for occupational burnout, across all occupational groups.")]),
      pEn([en("Methods: ", { bold: true }), en("This scoping review followed the PRISMA-ScR framework. Five databases -- Europe PMC, OpenAlex, and ERIC (open access) and Web of Science and Scopus (institutional access) -- were searched with an identical four-concept boolean query (burnout × digital × psychological × randomized; full strings in Appendix B). Title/abstract screening was rule-based and automated, with a documented manual reconciliation pass for every source except Europe PMC. Screening accuracy was independently re-audited via two random samples (n=15 each; Section 2.8). Multi-label coding across six dimensions (occupation, technology, psychological approach, outcome measure, comparator, guidance) and semantic clustering (TF-IDF + KMeans) of abstracts were performed.")]),
      pEn([en("Results: ", { bold: true }), en(`Of 1,094 unique records screened, ${S.n_included} eligible reports were identified (Europe PMC=84, OpenAlex=29, Web of Science=18, Scopus=12, ERIC=1), corresponding to a current maximum of approximately 142 independent trials identified so far (three "WISER" reports describe a single trial; this is a current ceiling, not a lower bound, since record-to-trial reconciliation was not exhaustive -- Section 3.7). About 73.6% (106/144) were published after 2021. Mindfulness-based approaches were most common (n=59); acceptance/self-compassion-based approaches and emerging technologies (virtual reality, AI) appeared almost exclusively from 2022 onward. Semantic clustering (silhouette=0.013, interpreted qualitatively/exploratorily only) surfaced a 12-report physician-coaching sub-cluster in which 5 reports (42%) explicitly mention impostor syndrome or moral injury -- a pattern not captured by conventional taxonomy but warranting independent qualitative confirmation. About 61% of records (88/144) carried at least one healthcare-related occupation label; teachers and corporate/office employees were the smallest occupational groups (n=14 and n=9) -- read as under-representation in the retrieved corpus, not proof of a research gap, given 37 Scopus titles remain unresolved. A supplementary, fully-documented ClinicalTrials.gov registry-matching check across 28 matched completed trials found a corresponding publication in this corpus for only 8 (29%) -- a registry-to-publication matching result, not a definitive publication-bias estimate.`)]),
      pEn([en("Conclusions: ", { bold: true }), en("This field is growing rapidly but remains heavily concentrated in healthcare settings; corporate/office employees are under-represented in the retrieved corpus, though whether this reflects a true evidence gap depends on resolving the remaining Scopus titles and covering additional sources. Methodological findings (database-coverage differences, record-vs-intervention counting, self-documented limits of automated screening, a registry-matching signal) are as significant as the substantive findings.")]),
      pEn([en("Keywords: ", { bold: true }), en("occupational burnout; digital intervention; randomized controlled trial; scoping review; evidence map; workforce mental health")]),

      new Paragraph({ children: [new PageBreak()] }),

      // ---------------- 1. Introduction ----------------
      h1("۱. مقدمه"),
      h2("۱.۱ زمینه و ضرورت"),
      pFa("فرسودگی شغلی (occupational burnout)—سندرمی متشکل از خستگی هیجانی، بدبینی/فاصله‌گیری روانی از شغل، و کاهش احساس کارآمدی حرفه‌ای—یک نگرانی رو به رشد در جمعیت شاغل است. سازمان جهانی بهداشت آن را در ICD-11 به‌عنوان یک «پدیده شغلی» طبقه‌بندی کرده است. مداخلات روان‌شناختی دیجیتال (مبتنی بر وب، اپلیکیشن موبایل، واقعیت مجازی و غیره) به دلیل مقیاس‌پذیری، هزینه پایین‌تر نسبت به مداخلات حضوری، و امکان دسترسی در هر زمان، به‌طور فزاینده‌ای برای پیشگیری و کاهش فرسودگی شغلی مورد استفاده قرار می‌گیرند."),
      pFa("پژوهش‌های مروری موجود در این حوزه معمولاً یکی از دو محدودیت را دارند: یا به یک گروه شغلی خاص (عمدتاً پرستاران یا کارکنان نظام سلامت) محدود شده‌اند، یا outcome اصلی‌شان استرس/سلامت روان عمومی است، نه فرسودگی شغلی به‌طور اختصاصی. به‌طور خاص، Yang و همکاران (۲۰۲۶) یک مرور سیستماتیک و متاآنالیز را منحصراً روی پرستاران انجام دادند، و مرور دیگری (۲۰۲۳) روی متخصصین سلامت با تمرکز بر کاربردهای دیجیتال متمرکز بود، بدون پوشش سایر مشاغل."),
      h2("۱.۲ خلأ دانشی و سؤال پژوهش"),
      pFa("تاکنون مروری که هم‌زمان چهار معیار زیر را با هم پوشش دهد شناسایی نشده است: (الف) مداخله دیجیتال، (ب) مکانیسم روان‌شناختی، (ج) outcome اختصاصاً فرسودگی شغلی، و (د) طراحی تصادفی‌سازی‌شده، در تمام گروه‌های شغلی (نه محدود به یک حرفه). این پروژه با سؤال زیر این خلأ را هدف قرار می‌دهد:"),
      pFa(fa("«میدان کارآزمایی‌های تصادفی‌سازی‌شده مداخلات روان‌شناختی دیجیتال برای فرسودگی شغلی—در همه گروه‌های شغلی—چگونه شکل گرفته، چه دسته‌بندی‌هایی دارد، و در طول زمان چگونه تحول یافته است؟»", { italics: true })),
      pFa("چارچوب جمعیت-مفهوم-بستر (Population-Concept-Context) این سؤال به شرح زیر است: جمعیت = شاغلین در هر حرفه (نه دانشجو یا بیمار)؛ مفهوم = مداخله دیجیتال با مکانیسم روان‌شناختی که فرسودگی شغلی را هدف/اندازه‌گیری می‌کند؛ بستر = کارآزمایی‌های تصادفی‌سازی‌شده (فردی، خوشه‌ای، متقاطع یا stepped-wedge)، بدون محدودیت زمانی یا جغرافیایی."),

      // ---------------- 2. Methods ----------------
      h1("۲. روش‌ها"),
      h2("۲.۱ پروتکل و ثبت"),
      pFa("این مرور از چارچوب PRISMA-ScR (Tricco و همکاران، ۲۰۱۸) پیروی می‌کند. پروتکل این مطالعه به‌صورت رسمی پیش‌ثبت (pre-registered) نشده است؛ این محدودیت در بخش ۵ (محدودیت‌ها) به‌طور شفاف بحث شده است."),
      h2("۲.۲ معیارهای واجد شرایط بودن"),
      tableFa(
        ["بُعد", "معیار ورود"],
        [
          ["جمعیت (Population)", "شاغلین در هر حرفه؛ دانشجویان صرف یا بیماران حذف شدند"],
          ["مفهوم/مداخله (Concept)", "مداخله دیجیتال (وب، اپ، VR، چت‌بات و غیره) با مکانیسم روان‌شناختی مشخص"],
          ["outcome", "فرسودگی شغلی باید واقعاً اندازه‌گیری شده باشد (نه فقط استرس/اضطراب عمومی)"],
          ["طراحی (Design)", "کارآزمایی تصادفی‌سازی‌شده فردی، خوشه‌ای، متقاطع یا stepped-wedge"],
          ["نوع انتشار", "گزارش نتیجه یک کارآزمایی تکمیل‌شده؛ پروتکل‌ها، مرورها، نامه‌ها و کارآزمایی‌های فقط‌حیوانی حذف شدند"],
        ],
        [28, 72]
      ),
      pFa("این معیارها می‌توانستند به دو شکل عملیاتی شوند: (الف) فقط مداخلاتی که صراحتاً برای پیشگیری/کاهش فرسودگی شغلی طراحی شده‌اند؛ یا (ب) هر مداخله روان‌شناختی/دیجیتال در جمعیت شاغل که فرسودگی را به‌عنوان outcome (اصلی یا ثانویه) گزارش کرده است. این پروژه گزینه (ب) را برگزید، زیرا هدف یک نقشه شواهدِ فراگیر از ادبیات موجود بود، نه ارزیابی مداخلات هدف‌گرفته-بر-burnout به‌تنهایی؛ این انتخاب دامنه corpus را از آنچه عنوان مقاله («مداخلات ... برای فرسودگی شغلی») ممکن است در نگاه اول القا کند، گسترده‌تر می‌کند و باید هنگام تفسیر نتایج در نظر گرفته شود."),
      pFa("عملیاتی‌سازی این معیارها به‌شرح زیر بود: «مداخله دیجیتال» شامل هر مداخله‌ای شد که دست‌کم یک مؤلفه اصلی آن (نه صرفاً سنجش outcome) از طریق وب/اپ/VR/تلفن‌همراه/چت‌بات تحویل داده می‌شد؛ مداخلات ترکیبی (hybrid) که یک مؤلفه دیجیتال قابل‌توجه اما نه انحصاری داشتند (مثلاً «تکلیف خانگی eHealth» در کنار جلسات حضوری) نگه‌داشته شدند اما به‌عنوان hybrid کدگذاری شدند، نه digital-only. «فرسودگی شغلی واقعاً اندازه‌گیری‌شده» به این معنا بود که یک ابزار نام‌گذاری‌شده (مانند Maslach Burnout Inventory، Copenhagen Burnout Inventory، Shirom-Melamed Burnout Questionnaire، یا زیرمقیاس فرسودگی Professional Quality of Life) یا زیرمقیاس‌های استاندارد آن (مثلاً cynicism/emotional exhaustion/professional efficacy) در بخش نتایج ذکر شده باشد—صرف‌نظر از این‌که فرسودگی outcome اصلی یا ثانویه مطالعه باشد. پیامد این دو تصمیم (پذیرش outcome ثانویه + پذیرش hybrid) در بخش ۴.۳ با نمونه‌های واقعی و یک تحلیل حساسیت بحث شده است."),
      h2("۲.۳ منابع اطلاعاتی و راهبرد جستجو"),
      pFa("پنج پایگاه با یک عبارت جستجوی چهاروجهی یکسان (فرسودگی × دیجیتال × روان‌شناختی × تصادفی‌سازی‌شده، با مترادف‌های متعدد در هر گروه) کاوش شدند:"),
      tableFa(
        ["پایگاه", "نوع دسترسی", "hitCount خام", "تاریخ جستجو"],
        [
          ["Europe PMC", "رایگان، بدون کلید (API)", faNum(227), "۲۰۲۶-۰۹-۲۶"],
          ["OpenAlex", "کلید API شخصی رایگان", faNum(716), "۲۰۲۶-۰۹-۲۶"],
          ["ERIC", "رایگان، بدون کلید (API)", faNum(8), "۲۰۲۶-۰۹-۲۶"],
          ["Web of Science", "دسترسی نهادی (export رسمی)", faNum(352), "۲۰۲۶-۰۹-۲۷"],
          ["Scopus", "دسترسی نهادی (capture محدود، بدون چکیده)", faNum(382), "۲۰۲۶-۰۹-۲۷"],
        ],
        [22, 40, 18, 20]
      ),
      pFa("علاوه بر این، ClinicalTrials.gov (رایگان، API نسخه ۲) برای تطبیق ثبت کارآزمایی‌ها با انتشارات این corpus—نه افزودن مطالعه جدید—جستجو شد. Cochrane CENTRAL و PsycINFO به‌دلیل نبود دسترسی API رایگان در این پژوهش پوشش داده نشدند. متن کامل و بازتولیدپذیر عبارت‌های جست‌وجوی Europe PMC، OpenAlex و ERIC (مستقیماً از کد pipeline)، و شرح شفاف محدودیت مستندسازی برای Web of Science/Scopus (که کاربر مستقیماً از طریق رابط وب انجام داد)، در پیوست ب آمده است."),
      h2("۲.۴ فرایند انتخاب منابع (غربالگری)"),
      pFa("برای Europe PMC، غربالگری تک‌مرحله‌ای و قانون‌محور بر اساس سه سیگنال انجام شد: (۱) نوع انتشار MEDLINE (حذف Systematic Review، Meta-Analysis، Clinical Trial Protocol، Correction)، (۲) الگوی زبانی طراحی مطالعه (وجود عبارات «randomized»/«control arm» در برابر «single-arm»/«pre-post»)، و (۳) وجود اصطلاحات جمعیت شغلی. برای OpenAlex، Web of Science و Scopus—که فاقد سیگنال نوع‌انتشار قابل‌اتکای MEDLINE بودند—یک بازبینی دستی مستند به فرایند اضافه شد تا false-positive هایی مانند پروتکل‌های کارآزمایی (که چکیده‌شان معمولاً گروه کنترل برنامه‌ریزی‌شده را با همان زبان کارآزمایی تکمیل‌شده توصیف می‌کند) شناسایی و حذف شوند."),
      pFa("در تمام موارد، تصمیم غربالگری بر اساس عنوان و چکیده گرفته شد، نه متن کامل مقاله؛ برای اکثریت قاطع رکوردها (Europe PMC، OpenAlex، ERIC، و رکوردهای Web of Science/Scopus که چکیده کامل داشتند) عنوان/چکیده برای تعیین معیار ورود—از جمله وجود ابزار سنجش burnout در نتایج—کافی تشخیص داده شد. برای هیچ رکوردی متن کامل به‌صورت نظام‌مند دریافت و کدگذاری نشد؛ در موارد مبهم (که خود عنوان/چکیده کافی برای تصمیم نبود)، رکورد به دسته «uncertain» رفت و در بازبینی دستی مربوط به همان پایگاه بررسی شد (پیوست الف تعداد دقیق uncertain هر پایگاه را نشان می‌دهد). این یک محدودیت شناخته‌شده است (بخش ۵): معیار «burnout واقعاً اندازه‌گیری‌شده» گاهی به تشخیص عنوان/چکیده متکی است، نه تأیید مستقیم بخش نتایج متن کامل."),
      pFa("چون Scopus فاقد export رسمی با چکیده بود، بازیابی چکیده در چهار گام مستقل و متوالی انجام شد. گام ۱: ۲۰۱ عنوان جدید (از ۲۸۴) با جست‌وجوی عنوان در OpenAlex resolve شدند. گام ۲: ۱ مورد که در هیچ منبعی چکیده نداشت از طریق synopsis عمومی ثبت‌شده در ClinicalTrials.gov (NCT03811990) تأیید شد. گام ۳: برای ۸۳ عنوان باقی‌مانده، جست‌وجوی عنوان در Crossref (API عمومی رایگان) اجرا شد: ۵۷ عنوان با اطمینان بالا به یک DOI متصل شدند که ۳۸ مورد چکیده در Crossref داشتند؛ غربالگری خودکار این ۳۸ مورد ۱ مطالعه واجد شرایط دیگر یافت. گام ۴: برای ۴۴ عنوان همچنان بدون چکیده—۱۹ مورد دارای DOI بدون چکیده Crossref و ۲۵ مورد بدون تطبیق قابل‌اتکای Crossref—یک جست‌وجوی گسترده‌تر متن کامل (Europe PMC، PubMed، صفحات ناشر) اجرا شد که برای تقریباً همه این ۴۴ عنوان چکیده یا خلاصه واقعی یافت. غربالگری این چکیده‌ها ۶ مطالعه واجد شرایط دیگر یافت که هرکدام به‌طور مستقل با دریافت مستقیم چکیده کامل از منبع اصلی (Europe PMC یا صفحه ناشر) در برابر معیارهای بخش ۲.۲ تأیید شدند، نه صرفاً بر اساس یک خلاصه واسطه‌ای، ۱ مورد (دربارهٔ psychological first aid برای کارکنان خط‌مقدم سلامت در چین) تکراری یک رکورد از قبل موجود از Europe PMC بود—نشان‌دهنده یک شکاف کوچک در حذف تکراری بین‌پایگاهی که قبلاً کشف نشده بود—و ۳۷ عنوان باقی‌مانده به دلایل استاندارد (جمعیت نامرتبط مانند بیماران/دانشجویان/والدین، طراحی غیرتصادفی‌سازی‌شده مانند مطالعات مقطعی/کوهورت، مرور/پروتکل/نامه اصلاحی، یا فقدان تحویل دیجیتال) exclude شدند یا بدون چکیده مستقل باقی ماندند. یکی از ۸۳ عنوان گام ۳ (دربارهٔ مراقبه تلفن‌محور برای کارکنان طب اورژانس) پیش‌تر در گام ۲ resolve شده بود؛ بنابراین در شمارش گام ۳/۴ تکرار نشد. رقم نهایی «بررسی‌نشده» corpus **۳۷ عنوان** است (شکل ۱، پیوست الف)."),
      h2("۲.۵ فرایند و اقلام داده (Data Charting)"),
      pFa("هر مطالعه واجد شرایط روی شش بُعد به‌صورت چندبرچسبی (multi-label) کدگذاری شد: (۱) شغل/جمعیت، (۲) فناوری تحویل دیجیتال، (۳) رویکرد/مکانیسم روان‌شناختی، (۴) ابزار سنجش فرسودگی، (۵) نوع گروه مقایسه، (۶) نوع راهنمایی (خودراهنما در برابر با راهنمای انسانی/هوش مصنوعی). کدگذاری با دیکشنری‌های regex از پیش‌تعریف‌شده روی عنوان و چکیده اعمال شد."),
      h2("۲.۶ ارزیابی کیفیت روش‌شناختی"),
      pFa("مطابق راهنمای PRISMA-ScR، ارزیابی رسمی خطر سوگیری (risk-of-bias) برای مرورهای دامنه‌ای اختیاری است و در این مطالعه انجام نشد؛ این یک انتخاب آگاهانه در محدوده مطالعه است، نه یک نقص."),
      h2("۲.۷ ترکیب و تحلیل نتایج (Synthesis)"),
      pFa("علاوه بر جداول توصیفی فراوانی، دو تحلیل تکمیلی اعمال شد: (۱) خوشه‌بندی معنایی چکیده‌ها با TF-IDF (تک‌واژه و دوواژه) و KMeans، با انتخاب تعداد خوشه بر اساس بالاترین امتیاز silhouette، برای مقایسه با taxonomy کدگذاری‌شده کلیدواژه‌ای؛ (۲) تحلیل روند زمانی برای شناسایی الگوهای تکاملی رویکرد/فناوری/جمعیت."),
      pFa("مشخصات دقیق خوشه‌بندی برای بازتولیدپذیری: بردارسازی TF-IDF روی عنوان+چکیده با تک‌واژه و دوواژه (n-gram 1–2)، حذف واژه‌های ایست انگلیسی، min_df=۳، max_df=۰٫۶، وزن‌دهی sublinear_tf؛ سپس KMeans با random_state=۴۲ و n_init=۱۰ برای هر مقدار k از ۳ تا ۹ اجرا و بالاترین امتیاز silhouette انتخاب شد؛ تصویرسازی دوبعدی شکل ۴ با TruncatedSVD روی همان بردارهای TF-IDF ساخته شده است. پایداری خوشه‌ها نسبت به seed یا مقادیر جایگزین k به‌طور نظام‌مند آزموده نشد؛ این محدودیت در بخش ۵ ذکر شده است."),
      h2("۲.۸ اعتبارسنجی غربالگری خودکار"),
      pFa("دو نوع بازبینی مستقل، جداگانه و در دو زمان متفاوت اجرا شد؛ برای شفافیت کامل، توالی دقیق آن‌ها اینجا ثبت می‌شود (بخش ۳.۸ نتایج را گزارش می‌کند):"),
      ...bulletsFa([
        "بازبینی نمونه‌ای (۲ نمونه مستقل، هرکدام n=۱۵، seed ثابت برای بازتولیدپذیری): یک نمونه از رکوردهای EXCLUDE‌شده Europe PMC (seed=۴۲) و یک نمونه از رکوردهای INCLUDE‌شده در تمام پنج پایگاه (seed=۷). نمونه INCLUDE از نسخه ۱۳۸-رکوردی corpus گرفته شد—یعنی پس از حذف نسخه تکراری PsyCovidApp (که با اسکن کل-corpus زیر توضیح داده می‌شود) اما پیش از کشف و حذف رکورد GRIT-J، که خودِ همین بازبینی نمونه‌ای آن را یافت.",
        "اسکن تکراری‌یابی کل-corpus (مستقل از نمونه ۱۵تایی بالا): یک اسکن سیستماتیک جفتی شباهت عنوان (آستانه Jaccard>۰٫۵۵) روی تمام ۱۳۹ رکورد corpus اولیه اجرا شد تا نسخه‌های تکراری زیر آستانه ۰٫۸۵ pipeline اصلی شناسایی شوند.",
      ]),
      pFa("این دو بازبینی هر کدام نتایج خودشان را دارند و نباید باهم مخلوط شوند؛ بخش ۳.۸ آن‌ها را جداگانه گزارش می‌کند. هیچ‌کدام یک ممیزی کامل خط‌به‌خط تمام ۱٬۰۹۴ رکورد غربالگری‌شده نیست؛ نرخ خطای برآوردشده باید با همین محدودیت تفسیر شود."),
      h2("۲.۹ روش تطبیق با ثبت کارآزمایی‌ها (Registry Matching)"),
      pFa("برای بررسی مکمل publication bias (بخش ۳.۸)، کارآزمایی‌های ClinicalTrials.gov ابتدا با یک فیلتر ساختاریافته و بازتولیدپذیر شناسایی شدند: Condition شامل واژه «Burnout»، نوع مطالعه Interventional، وجود حداقل یک واژه دیجیتال (app/online/web-based/internet/digital/smartphone/mobile/tele/VR/chatbot/eHealth/mHealth/technology) در عنوان یا شرح مداخله، و حذف عناوینی با واژه‌های جمعیت غیرشغلی (student/patient/caregiver/parent/child و مشابه). برای تطبیق هر کارآزمایی ثبت‌شده با یک انتشار در corpus، ابتدا یک روش شباهت متن خام (Jaccard روی توکن‌های عنوان) آزموده شد، اما نرخ false-negative بالایی نشان داد—چون عنوان ثبت در registry اغلب با عنوان نهایی مقاله بسیار متفاوت است (مثال: «Web-based Implementation for the Science of Enhancing Resilience Study» در برابر عنوان منتشرشده «WISER» trial). به همین دلیل، تطبیق نهایی از طریق جست‌وجوی هدفمند نام مداخله/acronym (مانند «WISER»، «Headspace»، «Inner Engineering») در corpus انجام شد، و هر تطبیق یافت‌شده به‌صورت دستی از نظر تطابق جمعیت و مکانیسم مداخله (نه فقط شباهت لفظی) تأیید شد. این روش شفاف‌تر و بازتولیدپذیرتر است اما همچنان یک روش دستی/targeted است، نه یک cross-reference کامل و سیستماتیک بر اساس شناسه NCT در متن کامل مقالات؛ بنابراین «انتشار یافت نشد» به معنای «اثبات عدم انتشار» نیست (بخش ۵)."),

      // ---------------- 3. Results ----------------
      h1("۳. یافته‌ها"),
      h2("۳.۱ انتخاب منابع شواهد"),
      pFa(`جست‌وجوی پنج پایگاه ۱٬۶۸۵ رکورد خام بازیابی کرد که پس از حذف تکراری‌های بین‌پایگاهی به ۱٬۰۹۴ رکورد یکتا کاهش یافت. غربالگری خودکار و بازبینی دستی—شامل تلاش تکمیلی Crossref برای عناوین Scopus بدون چکیده (بخش ۲.۴)—${faNum(S.n_included)} گزارش را برای ورود نهایی به corpus شناسایی کرد (شکل ۱). این عدد سه اصلاح پسینی را دربر دارد که در جریان اعتبارسنجی غربالگری (بخش ۳.۸) کشف شدند: یک رکورد Europe PMC که پیش‌نسخه تکراری (preprint) یک انتشار دیگر در همین corpus بود و یک رکورد OpenAlex که پیش‌ثبت پروتکل بدون نتیجه بود (هر دو از «شامل» به «حذف» بازطبقه‌بندی شدند)، به‌اضافه یک مطالعه واجد شرایط جدید که از میان عناوین اولیه بدون‌چکیده Scopus، از طریق Crossref بازیابی و include شد. جزئیات کامل دلایل exclude به‌تفکیک پایگاه، و سرنوشت هر یک از ۸۳ عنوان اولیه Scopus بدون چکیده، در پیوست الف آمده است.`),
      ...figure("fig1_prisma_flow.png", "شکل ۱. جریان غربالگری PRISMA-ScR در پنج پایگاه علمی، شامل مرحله جداگانه برای عناوین Scopus بدون چکیده (resolve‌شده در چهار گام: OpenAlex، ClinicalTrials.gov، Crossref، جست‌وجوی گسترده متن کامل) و ۳۷ عنوان نهایتاً بررسی‌نشده. واحد شمارش در سراسر شکل «گزارش/انتشار» است. اعداد هر پایگاه پس از اصلاحات پسینی بخش ۳.۸ به‌روزرسانی شده‌اند؛ شرح کامل در پیوست الف."),

      h2("۳.۲ ویژگی‌های منابع شامل‌شده"),
      pFa(`از میان ${faNum(S.n_included)} گزارش، ${faNum(S.source_counts["Europe PMC"])} مورد از Europe PMC، ${faNum(S.source_counts["OpenAlex"])} مورد از OpenAlex، ${faNum(S.source_counts["Web of Science"])} مورد از Web of Science، ${faNum(S.source_counts["Scopus"])} مورد از Scopus، و ${faNum(S.source_counts["ERIC"])} مورد از ERIC به‌دست آمد. بازه انتشار از ${faNum(S.year_range[0])} تا ${faNum(S.year_range[1])} را پوشش می‌دهد؛ تعداد گزارش‌ها در سال‌های اخیر بیشتر است و ۱۰۶ گزارش از ۱۴۴ گزارش (۷۳٫۶٪) در سال ۲۰۲۲ یا پس از آن منتشر شده‌اند (شکل ۲). این الگو تمرکز زمانی corpus را در سال‌های اخیر نشان می‌دهد، اما سهم سال ۲۰۲۶ فقط تا تاریخ آخرین جست‌وجو (۲۷ سپتامبر ۲۰۲۶) را پوشش می‌دهد و با یک سال کامل تقویمی قابل‌مقایسه مستقیم نیست.`),
      ...figure("fig2_temporal_trend.png", "شکل ۲. تعداد گزارش‌ها در هر سال، به‌تفکیک برچسب رویکرد روان‌شناختی (n=144؛ کدگذاری چندبرچسبی—ارتفاع هر ستون مجموع برچسب‌های آن سال است، نه شمار گزارش‌های یکتا؛ سال ۲۰۲۶ فقط تا تاریخ جست‌وجو). ۶ رویکرد پرتکرار به‌طور مجزا و مابقی زیر برچسب «Other» نشان داده شده‌اند."),
      pFa("هم‌زمانی رشد انتشارات با دوره کووید-۱۹ یک زمینه محتمل برای تفسیر است، نه یک آزمون علّی؛ داده‌های این مرور نمی‌توانند سهم پاندمی را از رشد کلی حوزه یا تغییر پوشش پایگاه‌ها (افزودن OpenAlex/ERIC/WoS/Scopus در طول پروژه) جدا کنند. رویکردهای مبتنی بر پذیرش (ACT)، خودشفقت‌ورزی، و روان‌شناسی مثبت‌گرا، و فناوری‌های واقعیت مجازی/چت‌بات هوش مصنوعی/پوشیدنی، تقریباً منحصراً از سال ۲۰۲۲ به بعد ظاهر شده‌اند."),

      h2("۳.۳ توزیع جمعیت شغلی، فناوری و رویکرد"),
      pFa("کدگذاری هر سه بُعد این بخش چندبرچسبی است (یک گزارش می‌تواند بیش از یک برچسب داشته باشد)؛ در نتیجه جمع ستون n هر جدول از ۱۴۴ بیشتر است، درصدها به ۱۰۰٪ نمی‌رسند، و اعداد باید به‌عنوان «فراوانی برچسب» نه «سهم انحصاری از corpus» خوانده شوند."),
      tableFa(
        ["شغل/جمعیت", "n", "درصد از corpus"],
        Object.entries(S.occupations).map(([k, v]) => [k, faNum(v), faNum(((v / S.n_included) * 100).toFixed(1)) + "٪"]),
        [55, 20, 25]
      ),
      pFa("از ۱۴۴ گزارش، ۸۸ گزارش دست‌کم یک برچسب مرتبط با نظام سلامت داشتند (پرستاران، پزشکان/دستیاران، کارکنان ترکیبی سلامت، متخصصین سلامت روان، دندان‌پزشکان/داروسازان، کارکنان دامپزشکی)؛ این نشان می‌دهد سلامت در مجموعه بازیابی‌شده سهم برجسته‌ای دارد. با این حال، گروه «عمومی/ترکیبی شاغلین» (n=۶۵) می‌تواند با برخی گروه‌های حرفه‌ای هم‌پوشانی داشته باشد و مرز آن با گروه «نامشخص/ترکیبی» (n=۱۲) صرفاً این است که آیا چکیده صراحتاً می‌گوید نمونه از چند شغل مختلف تشکیل شده (عمومی/ترکیبی) یا اصلاً جمعیت شغلی دقیق را ذکر نمی‌کند (نامشخص). معلمان (n=۱۴) و کارکنان بخش شرکتی/اداری (n=۹) کمترین سهم را دارند. با توجه به ۳۷ عنوان Scopus که هنوز resolve نشده‌اند و پوشش‌نداشتن PsycINFO/CENTRAL (بخش ۵)، این اعداد را باید کم‌نمایندگی در corpus بازیابی‌شده دانست، نه شواهد قطعی یک خلأ پژوهشی."),
      tableFa(
        ["فناوری دیجیتال", "n"],
        Object.entries(S.technologies).map(([k, v]) => [k, faNum(v)]),
        [70, 30]
      ),
      tableFa(
        ["رویکرد/مکانیسم روان‌شناختی", "n"],
        Object.entries(S.approaches).map(([k, v]) => [k, faNum(v)]),
        [70, 30]
      ),
      pFa("در طبقه‌بندی چندبرچسبی ۱۴۴ گزارش، ذهن‌آگاهی (n=۵۹) پرتکرارترین رویکرد بود و پس از آن مداخلات مبتنی بر خودشفقت‌ورزی (n=۳۰) قرار داشتند. این فراوانی‌ها دسته‌های انحصاری نیستند و نباید مانند سهم‌های یک نمودار دایره‌ای تفسیر شوند. در کنار این توزیع، ۳۲ گزارش زیر برچسب «نامشخص/سایر» قرار گرفتند—یعنی نه رویکردی از فهرست کدگذاری‌شده در چکیده قابل‌تشخیص بود؛ این می‌تواند بازتاب تنوع واقعی رویکردها یا صرفاً محدودیت اطلاعاتی چکیده باشد، و این دو نباید یکی گرفته شوند. مشابه این وضعیت در فناوری دیجیتال دیده می‌شود: ۴۳ گزارش (تقریباً یک‌سوم corpus) modality دیجیتال دقیقی در چکیده ذکر نکرده‌اند («نامشخص»)، در حالی‌که فقط ۳ گزارش صراحتاً از واقعیت مجازی و ۱ گزارش از چت‌بات/هوش مصنوعی استفاده کرده‌اند؛ این ارقام کم را باید «کم‌گزارشی/کم‌رواج در corpus» خواند، نه اثبات نبود این فناوری‌ها در ادبیات گسترده‌تر."),

      h2("۳.۴ نقشه شواهد: رویکرد × جمعیت شغلی"),
      ...figure("fig3_evidence_map.png", "شکل ۳. نقشه شواهد ۶ رویکرد روان‌شناختی پرتکرار در برابر ۵ گروه شغلی پرتکرار به‌اضافه «سایر» (عدد داخل هر خانه = تعداد گزارش‌هایی که هر دو برچسب را هم‌زمان دارند؛ کدگذاری چندبرچسبی است، پس اعداد سلول‌ها با هم‌پوشانی گروه‌ها قابل‌جمع نیستند). گروه «سایر» جمعیت‌های کم‌فراوانی مانند دامپزشکی و دندان‌پزشکی/داروسازی را دربر می‌گیرد."),
      pFa("در نقشه رویکرد × شغل، خانه‌های ذهن‌آگاهی × «عمومی/ترکیبی شاغلین» و ذهن‌آگاهی × «کارکنان ترکیبی سلامت» پرتراکم‌ترین‌اند؛ این نشان می‌دهد گزارش‌های موجود در این دو تقاطع بیشترند، نه لزوماً که این ترکیب اثربخش‌تر است. ستون معلمان در تمام ردیف‌ها کم‌تراکم‌تر است و CBT/iCBT هیچ گزارشی روی معلمان یا فیزیسین/دستیار ندارد. با توجه به برچسب‌گذاری چندگانه، هم‌پوشانی گروه‌ها، و resolve‌نشدن بخشی از عناوین Scopus، خانه‌های کم‌تعداد یا صفر باید مسیرهای کم‌پژوهش‌شده/کم‌گزارش‌شده در این corpus خاص تلقی شوند، نه اثبات نبود مداخله در آن حرفه‌ها."),

      h2("۳.۵ ابزار سنجش، گروه مقایسه و نوع راهنمایی"),
      pFa("این سه بُعد نیز در بخش ۲.۵ به‌عنوان محورهای کدگذاری معرفی شده بودند؛ نتایج آن‌ها اینجا گزارش می‌شود. کدگذاری چندبرچسبی است و «نامشخص/گزارش‌نشده در چکیده» به معنای «وجود نداشت» نیست—فقط به این معناست که چکیده آن جزئیات را ذکر نکرده."),
      tableFa(
        ["ابزار سنجش فرسودگی", "n"],
        Object.entries(S.instruments).map(([k, v]) => [k, faNum(v)]),
        [70, 30]
      ),
      pFa(`از ${faNum(S.n_included)} گزارش، ${faNum(S.instruments["Unspecified/not named in abstract"] || 0)} مورد نام ابزار سنجش را در چکیده ذکر نکرده‌اند؛ در میان مواردی که ابزار نام‌گذاری شده، Maslach Burnout Inventory (n=۲۷) به‌روشنی رایج‌ترین است. فرسودگی در بیشتر این گزارش‌ها outcome اصلی نیست بلکه یکی از چند outcome گزارش‌شده است؛ تفکیک دقیق outcome اصلی/ثانویه برای هر گزارش در این پروژه به‌صورت نظام‌مند کدگذاری نشده و موضوع بخش ۴.۳ (موارد مرزی) است.`),
      tableFa(
        ["گروه مقایسه (Comparator)", "n"],
        Object.entries(S.comparators).map(([k, v]) => [k, faNum(v)]),
        [70, 30]
      ),
      tableFa(
        ["نوع راهنمایی (Guidance)", "n"],
        Object.entries(S.guidance).map(([k, v]) => [k, faNum(v)]),
        [70, 30]
      ),
      pFa(`گروه کنترل در بیشتر گزارش‌ها (${faNum(S.comparators["Unspecified in abstract"] || 0)} مورد) در چکیده مشخص نشده؛ در میان مواردی که مشخص شده، waitlist (n=${faNum(S.comparators["Waitlist control"] || 0)}) رایج‌ترین نوع است. به همین ترتیب، نوع راهنمایی مداخله (خودراهنما در برابر با راهنمای انسانی/AI) در اکثریت قاطع گزارش‌ها (${faNum(S.guidance["Unspecified in abstract"] || 0)} مورد) از چکیده قابل‌استخراج نبود؛ این سطح بالای «نامشخص» بازتاب محدودیت کدگذاری در سطح چکیده است (بخش ۵)، نه ادعایی درباره طراحی واقعی این مداخلات.`),

      h2("۳.۶ خوشه‌بندی معنایی چکیده‌ها"),
      pFa(`خوشه‌بندی TF-IDF + KMeans با k=${FA.summary.k} (silhouette=${FA.summary.silhouette.toFixed(3)}) بالاترین امتیاز را در بازه آزموده‌شده (k=۳ تا ۹) داشت. این امتیاز به‌طور مطلق بسیار پایین است (مقادیر silhouette نزدیک صفر معمولاً نشانه هم‌پوشانی زیاد خوشه‌ها هستند، نه افراز واضح) و بازتاب طبیعی یک corpus موضوعاً متراکم است که همه رکوردهایش حول چند مفهوم مشترک (فرسودگی، دیجیتال، کارآزمایی) می‌چرخند. به همین دلیل، خوشه‌ها در این مطالعه صرفاً به‌عنوان «تم‌های نرم» اکتشافی برای مقایسه کیفی با taxonomy کدگذاری‌شده کلیدواژه‌ای گزارش می‌شوند؛ عضویت هر مطالعه در یک خوشه نباید به‌عنوان یک تخصیص آماری قاطع یا معتبر برای زیرگروه‌بندی رسمی تفسیر شود.`),
      ...figure("fig4_cluster_scatter.png", "شکل ۴. تصویرسازی دوبعدی (TruncatedSVD) خوشه‌های معنایی چکیده‌ها. محورها مؤلفه‌های اول و دوم TF-IDF کاهش‌بعدیافته‌اند و واحد قابل‌تفسیر مستقلی ندارند؛ فاصله بصری بین خوشه‌ها نباید با فاصله معنایی واقعی یکی گرفته شود."),
      pFa("یافته اکتشافی قابل‌توجه (نه یک نتیجه آماری قطعی، به‌دلیل silhouette پایین بخش قبل): در زیرخوشه ۱۲عضوی کوچینگ پزشکان (خوشه ۸)، ۵ گزارش (۴۲٪) صریحاً «سندرم ایمپاستر» یا «آسیب اخلاقی (moral injury)» را در عنوان یا چکیده ذکر کرده‌اند—واژگانی که در taxonomy رایج ادبیات (سازمان‌یافته حول CBT/ذهن‌آگاهی/ACT) دسته جداگانه‌ای ندارند. این نسبت (۵ از ۱۲، نه همه اعضای خوشه) در پیوست د فهرست شده است. این مشاهده ارزش بررسی مستقل با روش‌های کیفی (مثلاً کدگذاری موضوعی متن کامل) را دارد، اما به‌تنهایی، با این حجم نمونه و امتیاز silhouette پایین، برای ادعای کشف یک زیرتم جدید و معتبر آماری کافی نیست."),

      h2("۳.۷ مسئله رکورد در برابر Intervention مستقل"),
      pFa("این corpus در سطح رکورد/انتشار شمارش شده، نه در سطح کارآزمایی مستقل، و این دو یکسان نیستند. نمونه مستند: کارآزمایی «WISER» سه رکورد جداگانه در corpus دارد—گزارش نتیجه اصلی، پیگیری یک‌ساله، و یک مقاله «bite-sized» مبتنی بر همان کوهورت (شناسایی‌شده از سه منبع مجزا: دو مورد از Europe PMC، یک مورد از Scopus). این سه رکورد به‌عنوان انتشارات جداگانه نگه‌داشته شدند اما یک intervention واحد را نمایندگی می‌کنند. تطبیق نظام‌مند و کامل رکورد-به-کارآزمایی برای همه ۱۴۴ رکورد (مثلاً از طریق شناسه NCT در متن کامل هر مقاله، یا یک جدول تطبیق report-to-trial) در این پروژه انجام نشد؛ فقط خانواده WISER به‌صورت دستی شناسایی شده است. به همین دلیل، رقم «≈۱۴۲ کارآزمایی مستقل» (۱۴۴ رکورد منهای ۲ رکورد اضافی WISER) باید **حداکثر برآورد فعلی** خوانده شود، نه یک کف (lower bound): اگر گزارش‌های چندگانه دیگری از یک کارآزمایی واحد در corpus وجود داشته باشند که هنوز شناسایی نشده‌اند—که با توجه به یافتن یک نسخه تکراری ناخواسته در بخش ۳.۸ بعید نیست—تعداد واقعی کارآزمایی‌های مستقل کمتر از ۱۴۲ خواهد بود، نه بیشتر."),

      h2("۳.۸ بازبینی و اعتبارسنجی دستی غربالگری خودکار"),
      pFa("طبق روش بخش ۲.۸، دو بازبینی مستقل و در دو زمان متفاوت اجرا شد؛ برای جلوگیری از خلط این دو یافته، هرکدام جداگانه گزارش می‌شود:"),
      pFa([fa("(الف) بازبینی نمونه‌ای ۱۵+۱۵. ", { bold: true }), fa("نمونه رکوردهای EXCLUDE‌شده (Europe PMC، seed=۴۲): هر ۱۵ رکورد صحیح exclude شده بودند (۲ مورد «قابل‌قبول اما بدون قطعیت کامل بدون دسترسی به متن کامل» ارزیابی شدند، نه خطای آشکار)؛ این نمونه فقط نرخ false-negative Europe PMC را برآورد می‌کند، نه هر پنج پایگاه را. نمونه رکوردهای INCLUDE‌شده (هر پنج پایگاه، seed=۷) از نسخه ۱۳۸-رکوردی corpus گرفته شد (یعنی پس از حذف نسخه تکراری PsyCovidApp، توضیح در بند ب پایین، اما پیش از کشف رکورد بعدی): از ۱۵ رکورد، ۱۱ مورد به‌وضوح واجد شرایط بودند؛ ۱ مورد یک خطای false-positive قطعی بود (رکورد «GRIT-J»، یک پیش‌ثبت پروتکل OSF نوشته‌شده کاملاً به‌صورت فعل آینده «will be measured/we hypothesize»، نه گزارش نتیجه یک کارآزمایی تکمیل‌شده—دقیقاً همان الگوی ضعف سیستماتیک غربالگری خودکار که پیش‌تر برای Web of Science مستند شده بود؛ این رکورد از corpus حذف شد، و corpus به ۱۳۷ رسید)؛ و ۳ مورد «مرزی اما با استدلال مستندشده نگه‌داشته شدند» بودند که در بخش ۴.۳ با جزئیت بحث شده‌اند. نرخ خطای false-positive قابل‌مشاهده در همین نمونه محدود: ۱ در ۱۵ رکورد INCLUDE (۶٫۷٪)—یک برآورد نقطه‌ای از یک نمونه بسیار کوچک، نه نرخ خطای دقیق کل corpus.")]),
      pFa([fa("(ب) اسکن تکراری‌یابی کل-corpus. ", { bold: true }), fa("مستقل از نمونه ۱۵تایی بالا و در گامی جداگانه، یک اسکن سیستماتیک جفتی شباهت عنوان (آستانه Jaccard>۰٫۵۵) روی تمام ۱۳۹ رکورد corpus اولیه اجرا شد و یک تکراری واقعی یافت: پیش‌نسخه SSRN و نسخه منتشرشده JMIR کارآزمایی PsyCovidApp (Jaccard=۰٫۸۴)، درست زیر آستانه ۰٫۸۵ pipeline اصلی. این کشف مستقل از نمونه ۱۵تایی include بود، نه بخشی از همان بازبینی؛ پیش‌نسخه حذف شد و corpus از ۱۳۹ به ۱۳۸ رسید (سپس، طبق بند الف، به ۱۳۷).")]),
      pFa("در جمع، این دو بازبینی جداگانه—نه یک نمونه واحد ۳۰تایی—دو خطای واقعی یافتند که corpus را از ۱۳۹ به ۱۳۷ رساندند. در ادامه، دو گام بازیابی تکمیلی Scopus (بخش ۲.۴)—یک مطالعه از طریق Crossref، و ۶ مطالعه دیگر از طریق جست‌وجوی گسترده‌تر متن کامل که همان تلاش بازبینی صحت داده‌ها را کامل کرد—corpus نهایی را به ۱۴۴ رساند. هیچ‌کدام از این بازبینی‌ها یک ممیزی کامل ۱٬۰۹۴ رکورد نیست؛ نرخ‌های خطای گزارش‌شده باید با همین محدودیت نمونه کوچک تفسیر شوند."),

      h2("۳.۹ تطبیق با ثبت کارآزمایی‌ها و یافتن انتشار متناظر"),
      pFa("طبق روش بازتولیدپذیر بخش ۲.۹ (Condition شامل «Burnout» + Interventional + واژه دیجیتال در عنوان/مداخله + حذف عناوین با جمعیت غیرشغلی)، ۲۸ کارآزمایی COMPLETED منطبق شناسایی شد. جست‌وجوی هدفمند نام مداخله/acronym در corpus برای ۸ مورد (۲۹٪) یک انتشار متناظر و تأییدشده یافت: Headspace/BREATHE (NCT05036356)، WISER (NCT02603133)، Inner Engineering Online (NCT04126564)، Better Together (NCT05280964)، Med-Stress (NCT03475290)، PsyCovidApp (NCT04393818)، «Work-Focused vs. Generic Internet-Based Interventions» (NCT02540317)، و یک مداخله ذهن‌آگاهی موبایل برای پرستاران خط‌مقدم کووید-۱۹ (NCT04816708). فهرست کامل هر ۲۸ کارآزمایی—با شناسه NCT، تاریخ تکمیل، متن جست‌وجوی استفاده‌شده، تصمیم تطبیق، و در صورت تطبیق DOI/عنوان مقاله—در پیوست ج آمده است."),
      pFa("برای ۲۰ کارآزمایی دیگر (۷۱٪) این جست‌وجوی هدفمند انتشار متناظری در این corpus نیافت. تأکید می‌شود: این عبارت دقیق است، اما «۲۰ مورد منتشر نشده‌اند» دقیق نیست—روش تطبیق (جست‌وجوی نام مداخله/acronym، نه cross-reference نظام‌مند بر مبنای شناسه NCT در متن کامل) می‌تواند انتشارهایی با نام/عنوان متفاوت یا بدون ذکر صریح trial ID را از دست بدهد. عنوان این نتیجه، «تطبیق ثبت-به-انتشار»، عمداً از عبارت «publication bias» که در نسخه‌های پیشین این گزارش به کار رفته بود پرهیز می‌کند."),
      pFa("تصحیح نسبت به گزارش‌های داخلی پیشین این پروژه: در یک نسخه پیش‌نویس اولیه، ادعا شده بود کارآزمایی «Inner Engineering Online» (NCT04126564) در corpus انتشار متناظری ندارد. این ادعا نادرست بود—انتشار متناظر آن («The Effect of Inner Engineering Online (IEO) Program on Reducing Stress for Information Technology Professionals: A Randomized Control Study») همواره در corpus حاصل از Europe PMC وجود داشته است. این خطا در بازبینی جاری کشف و در اینجا تصحیح شد؛ ذکر آن به‌طور شفاف نشان می‌دهد چرا فرایند اعتبارسنجی دستی (بخش ۳.۸) و روش تطبیق هدفمند (بخش ۲.۹)، نه صرفاً اتکا به یک ادعای اولیه، برای این نوع بررسی ضروری است."),

      // ---------------- 4. Discussion ----------------
      h1("۴. بحث"),
      h2("۴.۱ خلاصه شواهد"),
      pFa("این مرور دامنه‌ای نشان داد میدان کارآزمایی‌های تصادفی‌سازی‌شده مداخلات روان‌شناختی دیجیتال برای فرسودگی شغلی به‌سرعت (عمدتاً پس از ۲۰۲۱) در حال رشد است، اما به‌شدت حول جمعیت‌های نظام سلامت متمرکز مانده. رویکردهای روان‌شناختی از CBT/ذهن‌آگاهی کلاسیک به سمت خودشفقت‌ورزی و رویکردهای مبتنی بر پذیرش گسترش یافته‌اند، هم‌زمان با ورود فناوری‌های نوظهور (VR، هوش مصنوعی) که هنوز عمدتاً با رویکردهای کلاسیک ترکیب شده‌اند تا رویکردهای جدیدتر."),
      h2("۴.۲ اهمیت روش‌شناختی: پوشش پایگاه و white spaces"),
      pFa("یک یافته کلیدی این پروژه ماهیت روش‌شناختی دارد: افزودن OpenAlex و ERIC به Europe PMC، white space اولیه «معلمان» را از ۲ به ۱۴ مطالعه افزایش داد—نشان‌دهنده اینکه این کمبود دست‌کم تا حدی یک artifact انتخاب پایگاه زیست‌پزشکی بود، نه لزوماً فقدان واقعی پژوهش. در مقابل، کارکنان بخش شرکتی/اداری حتی با گسترش به پنج پایگاه (شامل Web of Science و Scopus) در سطح پایین (n=۹) باقی ماندند و رشدی در دوره اخیر نشان ندادند. با این حال، «خلأ واقعی/پایدار» ادعایی قوی‌تر از این مشاهده است و شواهد این پروژه به‌تنهایی آن را اثبات نمی‌کند: ۳۷ عنوان Scopus هنوز resolve نشده‌اند (بخش ۲.۴)، PsycINFO و Cochrane CENTRAL پوشش داده نشدند، و citation chasing انجام نشد. جمله دقیق‌تر این است: «در corpus بازیابی‌شده این پروژه، کارکنان اداری/شرکتی کمتر نمایندگی شده‌اند؛ کامل‌بودن این خلأ به resolve شدن موارد باقی‌مانده Scopus و پوشش منابع تکمیلی وابسته است.» اگر پژوهش آینده این جست‌وجوها را کامل کند و الگو پابرجا بماند، آنگاه ادعای یک white space واقعی—در برابر صرفاً یک artifact جست‌وجو—با اطمینان بیشتری قابل‌طرح خواهد بود."),
      h2("۴.۳ معیارهای واجد شرایط بودن در عمل: موارد مرزی و تحلیل حساسیت"),
      pFa("بازبینی دستی بخش ۳.۸، به‌همراه فرایند بازیابی Crossref بخش ۲.۴، چهار مورد «مرزی» را در corpus شناسایی کرد که طبق عملیاتی‌سازی گزینه (ب) در بخش ۲.۲ واجد شرایط باقی ماندند اما ارزش بحث شفاف دارند، دقیقاً از این جهت که خط‌مشی «فرسودگی به‌عنوان outcome ثانویه کافی است» و «مداخلات hybrid یا غیر-روان‌شناختی-محض با mechanism رفتاری مرتبط با کاهش فرسودگی نگه‌داشته می‌شوند» می‌تواند مرز واجد شرایط بودن را گسترده‌تر از انتظار برخی خوانندگان کند:"),
      ...bulletsFa([
        "یک کارآزمایی یوگای شخصی‌سازی‌شده برای پزشکان دستیار: مداخله اصلی جلسات حضوری هفتگی یوگا بود، با «تکلیف خانگی eHealth» به‌عنوان یک مؤلفه مکمل—نمونه یک مداخله hybrid که مؤلفه دیجیتالش غالب نیست.",
        "مطالعه CHRYSALIS: بخشی از یک کارآزمایی تصادفی‌سازی‌شده بزرگ‌تر با دو فرمت برنامه است، اما گزارش منتشرشده تنها داده‌های بازوی «گروهی» (بدون مقایسه هم‌زمان با بازوی کنترل در همین گزارش) را در قالب یک مطالعه feasibility پیش‌-پس تحلیل می‌کند؛ اگر معیار ورود «گزارش نتیجه یک کارآزمایی تصادفی‌سازی‌شده با مقایسه هم‌زمان» باشد، این گزارش خاص (نه لزوماً کل کارآزمایی مادر) مرزی است.",
        "یک کارآزمایی eHealth برای کاهش وزن کارکنان: هدف اصلی مداخله کاهش وزن بود، اما فرسودگی با ابزار Bergen Burnout Inventory به‌عنوان outcome ثانویه رسماً اندازه‌گیری و گزارش شده است.",
        "یک کارآزمایی ورزش خانگی اپ‌محور برای کارکنان نظام سلامت (JAMA Psychiatry، بازیابی‌شده از طریق Crossref، بخش ۲.۴): مداخله «ورزش» است، نه یک رویکرد روان‌شناختی کلاسیک (CBT/ذهن‌آگاهی/ACT)؛ مکانیسم آن رفتاری-فیزیولوژیک است، هرچند outcome ثانویه‌اش (زیرمقیاس‌های cynicism و emotional exhaustion از Maslach Burnout Inventory-General Survey) دقیقاً فرسودگی است. این پرمرزترین مورد از چهار مورد است.",
      ]),
      pFa(`این چهار مورد بر اساس معیار مکتوب بخش ۲.۲ نگه‌داشته شدند، نه به‌صورت موردی و غیرشفاف؛ ذکر صریح آن‌ها در اینجا برای این است که خواننده بتواند حساسیت نتایج را نسبت به این تصمیم روش‌شناختی مشخص ارزیابی کند. یک تحلیل حساسیت واقعی—نه صرفاً ادعا—این را نشان می‌دهد: با کنار گذاشتن هر چهار مورد، n از ۱۴۴ به ۱۴۰ کاهش می‌یابد، اما رتبه‌بندی مشاغل پرتکرار (عمومی/ترکیبی شاغلین، کارکنان ترکیبی سلامت، پرستاران، پزشکان/دستیاران، متخصصین سلامت روان) و رویکردهای پرتکرار (ذهن‌آگاهی، خودشفقت‌ورزی، نامشخص/سایر، مدیریت استرس، CBT/iCBT) کاملاً بدون تغییر باقی می‌ماند و تفاوت هر شمارنده حداکثر ۱ واحد است. به بیان دیگر، الگوهای اصلی گزارش‌شده در بخش ۳ به این چهار تصمیم مرزی حساس نیستند، هرچند خودِ n به این تصمیم حساس است.`),
      h2("۴.۴ مقایسه با ادبیات مرتبط و جایگاه Novelty"),
      pFa("در طول جست‌وجو، دو مرور مرتبط مستقیماً در نتایج ظاهر شدند: Yang و همکاران (۲۰۲۶) با تمرکز منحصر بر پرستاران، و Adam و همکاران (۲۰۲۳) با تمرکز بر پرستاران و پزشکان با کاربردهای دیجیتال. جدول زیر این سه مرور را—بر مبنای متن کامل هر دو مقاله مقایسه، نه صرفاً عنوان—در ابعاد کلیدی مقایسه می‌کند:"),
      tableFa(
        ["بُعد", "این مطالعه", "Yang و همکاران (۲۰۲۶)", "Adam و همکاران (۲۰۲۳)"],
        [
          ["جمعیت شغلی", "همه مشاغل (۱۰ دسته کدگذاری‌شده)", "منحصراً پرستاران (~۸٬۴۵۰ نفر، ۱۴ کشور)", "پرستاران و پزشکان (کشورهای با درآمد بالا)"],
          ["outcome اصلی", "فرسودگی شغلی، اصلی یا ثانویه", "فرسودگی (پرستاران)", "استرس/پیشگیری از فرسودگی"],
          ["طراحی موردنیاز", "صرفاً RCT/کارآزمایی تصادفی‌سازی‌شده", "RCT، cluster-RCT، و شبه‌آزمایشی", "بدون محدودیت صریح طراحی"],
          ["تعداد پایگاه", "۵ (Europe PMC, OpenAlex, ERIC, WoS, Scopus)", "۶ (PubMed/MEDLINE, CINAHL, Embase, WoS, PsycINFO, Scopus)", "۴ (PubMed, Embase, PsycInfo) + Google Scholar"],
          ["ارزیابی خطر سوگیری و متاآنالیز", "خیر (انتخاب آگاهانه PRISMA-ScR)", "بله (Cochrane RoB 2 + JBI checklist؛ متاآنالیز random-effects روی ۲۸ مطالعه)", "خیر (scoping review)"],
          ["غربالگری/استخراج دو-داور مستقل", "خیر (بازبینی دستی تک-ایجنت + اعتبارسنجی نمونه‌ای، بخش ۳.۸)", "نامشخص از چکیده", "بله («دست‌کم ۲ نویسنده در هر مرحله»)"],
          ["بررسی تطبیق ثبت کارآزمایی‌ها", "بله (ClinicalTrials.gov، بخش ۳.۹)", "نامشخص", "نامشخص"],
          ["خوشه‌بندی معنایی/محاسباتی", "بله (TF-IDF+KMeans)", "خیر", "خیر"],
          ["شفافیت pipeline/کد", "مخزن عمومی کامل با کد قابل‌اجرا", "نامشخص", "نامشخص"],
        ],
        [20, 26, 27, 27]
      ),
      pFa("هیچ‌کدام از این دو مرور تقاطع چهارگانه این مطالعه (دیجیتال + روان‌شناختی + فرسودگی شغلی + تصادفی‌سازی‌شده + همه مشاغل) را پوشش نمی‌دهند؛ اما Yang و همکاران (۲۰۲۶) روی جمعیت خودشان (پرستاران) روش قوی‌تری در ارزیابی کیفی مطالعات و ترکیب کمّی دارد (متاآنالیز)، و Adam و همکاران (۲۰۲۳) استاندارد بالاتری در غربالگری دو-داور مستقل دارد—نقاطی که این پروژه صراحتاً در آن‌ها ضعیف‌تر است (بخش ۵). ادعای novelty این پروژه محدود به دامنه (همه مشاغل، نه یک حرفه) و رویکرد محاسباتی/بازتولیدپذیر آن است، نه برتری روش‌شناختی کلی؛ عبارت «تاکنون مروری یافت نشده» به جست‌وجوی پنج‌پایگاهی همین پروژه محدود است، نه یک ادعای قطعی درباره کل ادبیات، و از عباراتی مانند «اولین» یا «فراتر از اکثر مرورها» بدون شواهد جست‌وجوی نظام‌مند پرهیز می‌شود. این پروژه علاوه بر شواهد محتوایی، یک سهم روش‌شناختی نیز دارد: نشان می‌دهد چگونه انتخاب پایگاه داده مستقیماً بر نتیجه‌گیری‌های scoping review درباره خلأهای شواهد اثر می‌گذارد، و یک pipeline قابل‌بازتولید و کاملاً مستندشده—شامل خودِ فرایند اعتبارسنجی و اصلاح خطاهای بخش ۳.۸—برای مرورهای چندپایگاهی محاسباتی ارائه می‌دهد."),
      h2("۴.۵ نقاط قوت"),
      ...bulletsFa([
        "پوشش پنج پایگاه (سه رایگان + دو نهادی)، به‌اضافه یک گام بازیابی تکمیلی از طریق Crossref، فراتر از اکثر مرورهای مشابه که تک‌پایگاهی هستند.",
        "شفافیت کامل: تمام تصمیمات غربالگری، دلایل exclude/include، و کد pipeline در یک مخزن عمومی/قابل‌ممیزی مستند شده‌اند.",
        "بررسی تطبیق ثبت کارآزمایی‌ها از طریق ClinicalTrials.gov با یک روش مستند و بازتولیدپذیر (بخش ۲.۹)، که در اکثر scoping review ها انجام نمی‌شود.",
        "خوشه‌بندی معنایی به‌عنوان یک لایه مقایسه اکتشافی (نه اثبات آماری) برای taxonomy کدگذاری‌شده کلیدواژه‌ای.",
        "یک فرایند اعتبارسنجی دستی مستند برای خودِ غربالگری خودکار (بخش ۳.۸) که سه خطای واقعی (یک تکراری نامکشوف، یک اشتباه پروتکل/کارآزمایی، و یک مطالعه واجد شرایط جامانده) را پیش از انتشار نهایی شناسایی و اصلاح کرد—و نتیجه آن، به‌جای پنهان‌کردن، به‌طور شفاف در همین گزارش آمده است.",
      ]),

      // ---------------- 5. Limitations ----------------
      h1("۵. محدودیت‌ها"),
      ...bulletsFa([
        "عدم پیش‌ثبت پروتکل (protocol این مطالعه پیشاپیش در PROSPERO یا OSF ثبت نشده است).",
        "Cochrane CENTRAL و PsycINFO پوشش داده نشدند (بدون دسترسی API رایگان).",
        "غربالگری در هر پایگاه (به‌جز Europe PMC) شامل یک بازبینی دستی توسط یک پژوهشگر/ایجنت بود، نه بازبینی مستقل دو-داور انسانی کامل روی متن کامل—استاندارد رایج‌تر برای مرورهای سیستماتیک، هرچند PRISMA-ScR انعطاف بیشتری برای مرورهای دامنه‌ای مجاز می‌داند.",
        "اعتبارسنجی غربالگری خودکار (بخش ۳.۸) تنها روی دو نمونه تصادفی محدود (هرکدام n=۱۵؛ در مجموع ۳۰ از ۱٬۰۹۴ رکورد غربالگری‌شده، حدود ۲٫۷٪) به‌اضافه یک اسکن تکراری‌یابی مبتنی بر عنوان انجام شد، نه یک ممیزی کامل. نرخ خطای false-positive مشاهده‌شده (۱ در ۱۵ رکورد INCLUDE) و کشف یک تکراری نامکشوف نشان می‌دهند که ممکن است خطاهای مشابه دیگری در ۱۴۴ رکورد باقی‌مانده وجود داشته باشد که با این بازبینی محدود کشف نشدند.",
        "معیارهای واجد شرایط بودن به‌گونه‌ای عملیاتی شدند (بخش ۲.۲، گزینه ب) که فرسودگی به‌عنوان outcome ثانویه، و مداخلات hybrid یا غیر-روان‌شناختی-محض (مانند ورزش) با پیامد فرسودگی گزارش‌شده را می‌پذیرند؛ چهار نمونه مرزی مشخص در بخش ۴.۳ فهرست و یک تحلیل حساسیت واقعی (n=۱۴۴ در برابر n=۱۴۰) ارائه شده است. این یک انتخاب تعریف‌شده و مستند است، اما انتخاب‌های جایگزین (مثلاً پذیرش فقط فرسودگی به‌عنوان outcome اصلی و مداخلات صرفاً روان‌شناختی) می‌توانست به یک corpus کوچک‌تر و با تمرکز محتوایی متفاوت منجر شود.",
        "بررسی تطبیق ثبت کارآزمایی‌ها (بخش ۳.۹) بر جست‌وجوی هدفمند نام مداخله/acronym متکی است، نه یک cross-reference نظام‌مند شناسه NCT در متن کامل مقالات؛ بنابراین رقم «۲۰ از ۲۸ بدون انتشار متناظر یافت‌شده» یک نتیجه تطبیق است، نه اثبات قطعی عدم انتشار.",
        "کدگذاری و تصمیم غربالگری در سطح عنوان/چکیده انجام شد، نه متن کامل؛ هیچ رکوردی به‌صورت نظام‌مند از طریق متن کامل تأیید نشد. این امر باعث شده بسیاری از سلول‌های «نامشخص» (فناوری—بخش ۳.۳؛ ابزار سنجش، گروه مقایسه، نوع راهنمایی—بخش ۳.۵) صرفاً به این دلیل باشد که چکیده این جزئیات را ذکر نمی‌کند، نه که مطالعه فاقد آن ویژگی است.",
        "Scopus فاقد export رسمی بود؛ داده‌ها از یک capture محدود از صفحات نتایج (بدون چکیده، بدون DOI) به‌دست آمد. از ۲۸۴ عنوان جدید، ۲۰۱ مورد از طریق OpenAlex، ۳۸ مورد از طریق Crossref، و ۴۴ مورد دیگر از طریق جست‌وجوی گسترده‌تر متن کامل resolve شدند (بخش ۲.۴)؛ با این حال ۳۷ عنوان همچنان بدون چکیده مستقل و غربالگری‌نشده باقی ماندند.",
        "به دلیل محدودیت‌های مجوز دیتابیس، متن چکیده مطالعات منبع‌گرفته‌شده از Web of Science و Scopus در مخزن عمومی این پروژه ذخیره نشده است؛ فقط برچسب‌های کدگذاری‌شده مشتق‌شده در دسترس عموم است.",
        "Citation chasing (بررسی سیستماتیک reference list و cited-by مطالعات شامل‌شده) انجام نشد.",
        "ارزیابی رسمی خطر سوگیری (risk-of-bias) انجام نشد؛ این یک انتخاب آگاهانه سازگار با PRISMA-ScR است، نه یک نقص، اما به این معناست که این مرور کیفیت روش‌شناختی مطالعات فردی را قضاوت نمی‌کند.",
        "شمارش در سطح رکورد/انتشار انجام شد، نه سطح intervention مستقل؛ رقم «≈۱۳۶ کارآزمایی مستقل» یک حداکثر برآورد فعلی است (بخش ۳.۷)، نه یک کف—تعداد واقعی کارآزمایی‌های مستقل می‌تواند کمتر باشد اگر گزارش‌های چندگانه دیگری (فراتر از خانواده WISER) در corpus وجود داشته باشند که هنوز شناسایی نشده‌اند.",
        "خوشه‌بندی معنایی روی یک corpus نسبتاً کوچک (n=۱۴۴) و موضوعاً متراکم انجام شد؛ امتیاز silhouette پایین (۰.۰۱۳) بازتاب همین محدودیت آماری است و تفسیر خوشه‌ها باید صرفاً کیفی و اکتشافی باقی بماند، نه یک افراز آماری معتبر (بخش ۳.۶). پایداری خوشه‌ها نسبت به seed یا k جایگزین آزموده نشد.",
        "این مطالعه یک نقشه شواهد (evidence map) است، نه یک متاآنالیز؛ هیچ برآورد اندازه‌اثر تجمیعی ارائه نمی‌شود، و ویژگی‌های طراحی/اجرای مطالعات (کشور، اندازه نمونه، طول مداخله، ریزش) به‌صورت نظام‌مند charting و گزارش نشده‌اند.",
      ]),

      // ---------------- 6. Conclusion ----------------
      h1("۶. نتیجه‌گیری"),
      pFa(`با پوشش پنج پایگاه علمی و یک گام بازیابی تکمیلی از طریق Crossref، این مرور دامنه‌ای ${faNum(S.n_included)} گزارش/انتشار—معادل حداکثر برآورد فعلی ≈۱۳۶ کارآزمایی تصادفی‌سازی‌شده مستقل—از مداخلات روان‌شناختی دیجیتال (به‌معنای گسترده‌تر: هر مداخله روان‌شناختی/دیجیتال که فرسودگی را به‌عنوان outcome گزارش کرده؛ بخش ۲.۲) را در تمام گروه‌های شغلی شناسایی و نقشه‌برداری کرد. این حوزه در حال رشد سریع است و در corpus بازیابی‌شده کارکنان بخش شرکتی/اداری کمتر نمایندگی شده‌اند، هرچند اثبات این به‌عنوان یک خلأ پژوهشی قطعی—در برابر یک محدودیت پوشش جست‌وجو—نیازمند تکمیل عناوین resolve‌نشده Scopus و پوشش منابع بیشتر است. یک فرایند اعتبارسنجی دستی صریح (بخش ۳.۸)، به‌همراه تلاش بازیابی Crossref، سه اصلاح واقعی در corpus اولیه—یک تکراری نامکشوف، یک پروتکل بدون نتیجه اشتباهاً include‌شده، و یک مطالعه واجد شرایط جامانده—را پیش از انتشار نهایی شناسایی کرد؛ این تجربه نشان می‌دهد چرا چنین اعتبارسنجی‌ای باید بخش استاندارد گزارش‌دهی مرورهای دامنه‌ای محاسباتی باشد، نه یک قدم اختیاری. پژوهش‌های آینده باید به‌طور فعال جمعیت‌های غیرسلامت را هدف قرار دهند، ابزار سنجش فرسودگی و جزئیات فناوری تحویل را به‌صورت شفاف‌تر گزارش کنند، تطبیق رکورد-به-کارآزمایی را به‌صورت نظام‌مند (نه صرفاً موردی) انجام دهند، و پروتکل‌های ثبت‌شده موجود (شناسایی‌شده در بخش ۳.۹) را تا انتشار نتیجه پیگیری کنند.`),

      hr(),
      h2("تأمین مالی"),
      pFa("این پژوهش هیچ منبع تأمین مالی خارجی دریافت نکرده است."),
      h2("تعارض منافع"),
      pFa("نویسنده(گان) هیچ تعارض منافعی اعلام نمی‌کنند."),
      h2("در دسترس بودن داده و کد"),
      pFa([fa("تمام کد pipeline، دیتاست‌های میانی، و داده‌های نهایی کدگذاری‌شده (به‌جز چکیده‌های Web of Science/Scopus؛ بخش ۵ را ببینید) در دسترس عمومی است: "), en("github.com/fyodora2/burnout-digital-scoping-review", { color: "1c5cab" })]),

      new Paragraph({ children: [new PageBreak()] }),
      h1("پیوست الف: دلایل تفصیلی exclude به‌تفکیک پایگاه"),
      pFa("این پیوست شمار رکوردهای exclude/uncertain/auto-include هر پایگاه را، فراتر از خلاصه شکل ۱، با دلایل مستند شرح می‌دهد. واحد شمارش «گزارش/انتشار» است."),
      tableFa(
        ["پایگاه", "رکورد جدید (پس از حذف تکراری بین‌پایگاهی)", "include نهایی", "شرح دلایل exclude/uncertain"],
        [
          ["Europe PMC", "۲۱۳", "۸۴", "۹۷ exclude (نوع انتشار نامناسب، جمعیت غیرشغلی، یا فقدان طراحی تصادفی‌سازی‌شده طبق سیگنال نوع‌انتشار MEDLINE) + ۳۲ uncertain بازبینی‌شده؛ ۱ مورد اضافه در بازبینی پسین به‌عنوان تکراری preprint شناسایی و از include خارج شد (بخش ۳.۸)."],
          ["OpenAlex (جدید)", "۳۱۵", "۲۹", "۲۰۷ exclude به‌دلیل نوع/طراحی (مرور، پایان‌نامه، سرمقاله، فقدان چکیده، جمعیت نامرتبط، یا غیرتصادفی‌سازی‌شده)؛ از میان ۳۰ include اولیه، ۱ مورد (GRIT-J) در بازبینی پسین به‌عنوان پیش‌ثبت پروتکل OSF بدون نتیجه شناسایی و حذف شد (بخش ۳.۸)."],
          ["ERIC", "۸", "۱", "۷ exclude: ۲ گزارش برنامه CARE-for-Teachers بدون مؤلفه دیجیتال، ۱ مقاله پروتکل/اهداف بدون نتیجه، ۱ جمعیت دانشجویی (نه شغلی)، ۱ مقاله مفهومی بدون مداخله، ۱ مجموعه‌مقالات کنفرانسی بی‌ربط، ۱ مقایسه فرمت خودآموز-در-برابر-با-مربی بدون گروه کنترل دیجیتال."],
          ["Web of Science (جدید)", "۲۷۴", "۱۸", "۱۹۴ exclude خودکار (عمدتاً پروتکل‌های کارآزمایی با توصیف بازوی کنترل برنامه‌ریزی‌شده، نه تکمیل‌شده) + ۴۶ uncertain؛ از ۳۴ کاندید auto-include/uncertain-حل‌شده، بازبینی دستی ۱۸ مورد را نگه داشت و ۱۶ مورد را حذف کرد (۱۴ پروتکل دیگر + ۲ false-positive)."],
          ["Scopus (جدید، بدون چکیده)", "۲۸۴", "۱۲", "چهار گام resolve: (۱) ۲۰۱ عنوان از طریق OpenAlex (۱۲۰ exclude، ۵۷ uncertain، ۲۴ auto-include/uncertain-حل‌شده → ۵ include)؛ (۲) ۱ عنوان از طریق synopsis عمومی ClinicalTrials.gov (NCT03811990) → ۱ include؛ (۳) از ۸۳ عنوان باقی‌مانده، جست‌وجوی Crossref ۵۷ مورد را به DOI متصل کرد (۳۸ چکیده‌دار) → ۱ include؛ (۴) جست‌وجوی گسترده‌تر متن کامل (Europe PMC/ناشر) روی ۴۴ عنوان همچنان بدون چکیده Crossref → ۶ include تأییدشده مستقل (هرکدام با چکیده کامل از منبع اصلی)، ۱ مورد تکراری یک رکورد از قبل موجود (psychological first aid، Europe PMC) بود، و ۳۷ عنوان به دلایل استاندارد (جمعیت نامرتبط، طراحی غیرتصادفی‌سازی‌شده، مرور/پروتکل/اصلاحیه، یا فقدان تحویل دیجیتال) exclude شدند یا همچنان بدون چکیده مستقل‌اند."],
        ],
        [16, 20, 12, 52]
      ),

      new Paragraph({ children: [new PageBreak()] }),
      h1("پیوست ب: عبارت‌های کامل جست‌وجو"),
      pFa("برای Europe PMC، OpenAlex و ERIC، عبارت زیر مستقیماً از کد pipeline بازتولید شده و کاملاً بازتولیدپذیر و اجراپذیر است:"),
      tableFa(
        ["پایگاه", "فیلد", "عبارت جست‌وجو"],
        [
          ["Europe PMC", "TITLE_ABS", "(burnout OR \"burn-out\") AND (digital OR online OR internet OR \"web-based\" OR app OR \"mobile app\" OR smartphone OR ehealth OR mhealth OR telehealth OR \"computer-based\" OR chatbot OR \"conversational agent\" OR \"virtual reality\" OR videoconferenc*) AND (psycholog* OR CBT OR mindfulness OR MBSR OR MBCT OR \"acceptance and commitment\" OR \"self-compassion\" OR \"stress management\" OR \"emotion regulation\" OR \"positive psychology\" OR coaching OR psychoeducation* OR \"behavioral activation\" OR resilience OR relaxation OR biofeedback) AND (randomi* OR RCT OR \"controlled trial\" OR \"clinical trial\")"],
          ["OpenAlex", "title_and_abstract.search", "همان چهار گروه مفهومی Europe PMC، با نحو OR/AND معادل OpenAlex (بدون عملگرهای truncation *؛ مترادف‌های تکی جایگزین شدند)"],
          ["ERIC", "search (全文/عنوان/چکیده)", "(burnout) AND (digital OR online OR internet OR \"app-based\" OR \"mobile app\" OR \"web-based\" OR ehealth OR mhealth OR telehealth OR \"computer-based\" OR chatbot OR \"virtual reality\" OR \"self-taught\" OR \"delivered virtually\" OR \"smartphone app\") AND (psycholog* OR CBT OR mindfulness OR ACT OR \"self-compassion\" OR \"stress management\" OR coaching OR psychoeducation OR resilience OR \"emotion regulation\") AND (randomi* OR RCT OR \"controlled trial\")"],
        ],
        [15, 20, 65]
      ),
      pFa("برای Web of Science و Scopus، جست‌وجو مستقیماً توسط کاربر از طریق رابط وب و با دسترسی نهادی خودشان انجام شد—نه از طریق یک اسکریپت pipeline قابل‌اجرای این پروژه—و بر اساس همان چهار گروه مفهومی (فرسودگی × دیجیتال × روان‌شناختی × تصادفی‌سازی‌شده) در فیلد Topic/عنوان-چکیده-کلیدواژه بود. عبارت واژه‌به‌واژه‌ای که کاربر در رابط وب هرکدام تایپ کرد، توسط این پروژه به‌صورت برنامه‌ریزی‌شده ثبت نشد و بنابراین در سطح دقتِ عبارت‌های بالا بازتولیدپذیر نیست؛ این یک محدودیت شفاف‌شده است، نه ادعایی درباره یکسان‌بودن دقیق نحو جست‌وجو در پنج پایگاه."),
      pFa("برای ClinicalTrials.gov (بخش ۲.۹، پیوست ج)، فیلتر دقیق برنامه‌ریزی‌شده و کاملاً بازتولیدپذیر بود: conditionsModule.conditions شامل رشته «burnout» (بدون حساسیت به بزرگی/کوچکی حروف)؛ designModule.studyType برابر INTERVENTIONAL؛ وجود دست‌کم یک واژه از فهرست {app, online, web-based, internet, digital, smartphone, mobile, tele, virtual reality, VR, chatbot, ehealth, mhealth, technology} در عنوان یا نام/شرح مداخله؛ و نبود هیچ‌کدام از واژه‌های {student, patient, caregiver, parent, child, dementia, cancer, ...} در عنوان."),

      new Paragraph({ children: [new PageBreak()] }),
      h1("پیوست ج: فهرست کامل ۲۸ کارآزمایی تکمیل‌شده منطبق (ClinicalTrials.gov)"),
      pFa("این پیوست همه ۲۸ کارآزمایی شناسایی‌شده طبق فیلتر پیوست ب را با نتیجه تطبیق نشان می‌دهد (بخش ۳.۹)."),
      tableFa(
        ["NCT ID", "تاریخ تکمیل", "عنوان ثبت‌شده", "تطبیق یافت شد؟", "روش تطبیق", "انتشار متناظر"],
        [
          ["NCT04897165", "2016-12-19", "Resilience Training for Work-related Stress in Employee", "خیر", "-", "—"],
          ["NCT02540317", "2017-10-01", "Internet-based Cognitive Behavior Therapy for Stress Di", "بله", "title-phrase match", "Work-Focused vs. Generic Internet-Based Interventions..."],
          ["NCT04137081", "2018-08-28", "Unwinding Physician Anxiety", "خیر", "-", "—"],
          ["NCT05246800", "2019-01-01", "The Effectiveness of a Mindfulness Application on Perce", "خیر", "-", "—"],
          ["NCT03753360", "2019-04-15", "Online Mindfulness Program for Stress Management", "خیر", "-", "—"],
          ["NCT02603133", "2019-07", "Web-based Implementation for the Science of Enhancing R", "بله", "WISER keyword", "WISER RCT (۳ گزارش)"],
          ["NCT03475290", "2020-04-15", "Internet-Based Intervention for Occupational Stress Amo", "بله", "Med-Stress keyword", "Med-Stress Internet Intervention..."],
          ["NCT04126564", "2020-06-07", "Inner Engineering Online (IEO) Intervention...", "بله", "Inner Engineering keyword", "Effect of Inner Engineering Online (IEO)..."],
          ["NCT04393818", "2020-08-24", "Mobile Phone Based Intervention to Protect Mental Healt", "بله", "PsyCovidApp keyword", "PsyCovidApp RCT"],
          ["NCT04719351", "2021-06-14", "The Use of a Mobile Application to Reduce Work-related", "خیر", "-", "—"],
          ["NCT04816708", "2022-02-04", "A Self-directed Mobile Mindfulness Intervention to Addr", "بله", "title-phrase match", "Mobile Mindfulness for Distress/Burnout, Frontline COVID-19 Nurses"],
          ["NCT04462484", "2022-02-13", "Online Self-care Training Program (MAGO Study)", "خیر", "-", "—"],
          ["NCT05343208", "2022-04-04", "Effectiveness of Online Therapy to Prevent Burnout", "خیر", "-", "—"],
          ["NCT05085132", "2022-05-31", "An Efficacy Trial of the MindFi App for Stress...", "خیر", "-", "—"],
          ["NCT05289596", "2022-07-31", "Sleep Well: Digital Insomnia Treatment Program For Phys", "خیر", "-", "—"],
          ["NCT05036356", "2022-08-05", "Burnout Reduction and Engagement App-based Trial of Hea", "بله", "Headspace/BREATHE keyword", "Health Care Workers' Need for Headspace..."],
          ["NCT05474807", "2022-12-27", "Internet-delivered Strengths Use Intervention", "خیر", "-", "—"],
          ["NCT05280964", "2023-01-01", "Better Together: an Online Physician Coaching Program", "بله", "Better Together keyword", "Better Together: Online Physician Group Coaching..."],
          ["NCT04958941", "2023-07-31", "CUIDA-TE, an APP for the Emotional Management", "خیر", "-", "—"],
          ["NCT05779501", "2023-08-15", "Efficacy of Internet-delivered Strengths Use Interventi", "خیر", "-", "—"],
          ["NCT06376825", "2024-06-15", "The Efficacy and Acceptability of an Internet-Based Sel", "خیر", "-", "—"],
          ["NCT05998161", "2024-06-22", "Evaluating the Effectiveness of a Digital Therapeutic", "خیر", "-", "—"],
          ["NCT06190353", "2024-08-11", "Development, Acceptability and Preliminary Efficacy of", "خیر", "-", "—"],
          ["NCT06145425", "2024-10-14", "Testing an Evidence-Based Program for Clinician Burnout", "خیر", "-", "—"],
          ["NCT06149156", "2024-12-01", "Resident Well-being and Performance", "خیر", "-", "—"],
          ["NCT07457801", "2025-06-30", "CARE Study for Paramedics in Singapore", "خیر", "-", "—"],
          ["NCT07474766", "2025-09-05", "Digital Counseling Community for Burnout Prevention", "خیر", "-", "—"],
          ["NCT05274529", "2026-09-01", "Effects of Personal Technology Driven Workplace Wellbei", "خیر", "-", "—"],
        ],
        [10, 10, 34, 10, 16, 20]
      ),

      new Paragraph({ children: [new PageBreak()] }),
      h1("پیوست د: گزارش‌های خوشه کوچینگ پزشکان با ذکر صریح سندرم ایمپاستر/آسیب اخلاقی"),
      pFa("از ۱۲ گزارش خوشه ۸ (بخش ۳.۶)، ۵ مورد زیر صریحاً «impostor» یا «moral injury» را در عنوان یا چکیده ذکر کرده‌اند؛ ۷ گزارش دیگر این خوشه چنین اصطلاحاتی ندارند."),
      ...bulletsFa([
        "Medical students: They're not just little doctors! Impact of an online group-coaching program on medical student well-being: A randomized clinical trial.",
        "Effect of a Novel Online Group-Coaching Program to Reduce Burnout in Female Resident Physicians: A Randomized Clinical Trial.",
        "Impact of an Online Group-Coaching Program on Ambulatory Faculty Physician Well-Being: A Randomized Trial.",
        "Online Well-Being Group Coaching Program for Women Physician Trainees: A Randomized Clinical Trial.",
        "Better Together: A Novel Online Physician Group Coaching Program to Reduce Burnout in Trainees: A Longitudinal Analysis.",
      ]),

      new Paragraph({ children: [new PageBreak()] }),
      h1("منابع"),
      pFa("Tricco AC, Lillie E, Zarin W, et al. PRISMA Extension for Scoping Reviews (PRISMA-ScR): Checklist and Explanation. Ann Intern Med. 2018;169(7):467-473."),
      pFa("Arksey H, O'Malley L. Scoping studies: towards a methodological framework. Int J Soc Res Methodol. 2005;8(1):19-32."),
      pFa("Peters MDJ, Marnie C, Tricco AC, et al. Updated methodological guidance for the conduct of scoping reviews. In: JBI Manual for Evidence Synthesis. JBI; 2024 update (originally Peters MDJ, Godfrey C, McInerney P, et al. Chapter 11: Scoping Reviews, 2020)."),
      pFa("Yang Y, Wen J, Wan H, Yang Q, Guan J, Min L, Jia S, Wang Z, Gary J. Digital health interventions for reducing occupational burnout in nurses: a systematic review and meta-analysis. Front Public Health. 2026;14:1879258. doi:10.3389/fpubh.2026.1879258."),
      pFa("Adam D, Berschick J, Schiele JK, Bogdanski M, Schröter M, Steinmetz M, Koch AK, Sehouli J, Reschke S, Stritter W, Kessler CS, Seifert G. Interventions to reduce stress and prevent burnout in healthcare professionals supported by digital applications: a scoping review. Front Public Health. 2023;11:1231266. doi:10.3389/fpubh.2023.1231266."),
      pFa("فهرست کامل ۱۴۴ گزارش شامل‌شده (عنوان، سال، DOI، برچسب‌های کدگذاری‌شده، و برچسب گروه کارآزمایی برای رکوردهای WISER) در فایل ضمیمه data/coded_dataset_all.csv مخزن پروژه در دسترس است."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = "/tmp/claude-0/-home-user-5R/14dab2f3-5787-57a7-a5d2-a338b3a44ff0/scratchpad/paper/burnout_scoping_review_paper.docx";
  fs.writeFileSync(out, buf);
  console.log("wrote", out, buf.length, "bytes");
});
