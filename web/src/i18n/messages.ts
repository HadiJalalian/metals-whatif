import type { AssetKey, AxisName } from "../lib/api";

export type Lang = "en" | "fa";

export interface SummaryArgs {
  asset: string;
  usd: string;
  axisName: string;
  axisValue: string;
  axisUnit: string;
  price: string;
  unit: string;
  compare: string | null;
}

export interface BubbleSummaryArgs {
  asset: string;
  usd: string;
  axisName: string;
  axisValue: string;
  value: string;
  direction: string;
}

const en = {
  brand: {
    title: "MetalCast",
    subtitle: "Metals price foresight — fair value against the board, across USD scenarios",
    tagline:
      "Model 18k gold, mazaneh, silver and copper/zinc deposit certificates over any USD and world-price scenario, then read the bubble the market is carrying.",
    disclaimer: "A computational and educational tool. Not investment advice.",
    madeBy: "by @themohammadm",
  },
  common: {
    language: "Language",
    languageName: "فارسی",
    reset: "Reset",
    base: "Base",
    scenarios: "scenarios",
    cells: "cells",
    loading: "Computing…",
    live: "Recalculating",
    ready: "Up to date",
    retry: "Retry",
    step: "Step",
    stepsUp: "Steps up",
    stepsDown: "Steps down",
    premium: "Premium α (%)",
    includeCosts: "Add VAT & fees",
    vat: "VAT (%)",
    fee: "Trading fee (%)",
    optionalCosts: "Optional cost settings",
    notSet: "not set",
    overpriced: "Above model",
    underpriced: "Below model",
    balanced: "At model",
    noBubble: "No market price",
    toman: "Toman",
    guide: "How to read",
    close: "Close",
    gotIt: "Got it",
    inputs: "Scenario inputs",
    min: "Lowest",
    max: "Highest",
    pin: "Click a cell to pin it",
    pinned: "Pinned",
    unpin: "Unpin",
    copyLink: "Copy scenario link",
    linkCopied: "Link copied",
  },
  axes: {
    usd: { name: "Free-market USD", unit: "Toman", short: "USD" },
    gold: { name: "Gold ounce", unit: "USD", short: "XAU" },
    silver: { name: "Silver ounce", unit: "USD", short: "XAG" },
    copper: { name: "Copper LME", unit: "USD/tonne", short: "CU" },
    zinc: { name: "Zinc LME", unit: "USD/tonne", short: "ZN" },
  } satisfies Record<AxisName, { name: string; unit: string; short: string }>,
  presets: {
    label: "Grid density",
    quick: { name: "Quick", hint: "5 × 5 · fast read" },
    standard: { name: "Standard", hint: "9 × 9 · default" },
    fine: { name: "Fine", hint: "17 × 17 · full sweep" },
  },
  guide: {
    title: "Three steps, one matrix",
    lead: "MetalCast never guesses the market — it computes the fair value implied by your inputs and shows how far the board sits from it.",
    steps: [
      {
        title: "Set the axes",
        body: "Each axis adds one matrix dimension. The USD rate is always the columns; the asset's world price forms the rows.",
      },
      {
        title: "Enter the board price",
        body: "Give the current market price of the asset. That switches on the bubble matrix — red means the market is above fair value, green below it.",
      },
      {
        title: "Click any cell",
        body: "The cell pins and the sentence below the grid spells it out in plain language. Export the CSV when you need the numbers.",
      },
    ],
  },
  sections: {
    scenarios: "Scenario axes",
    scenariosHint:
      "Each axis builds one matrix dimension. The USD axis is always the columns.",
    assumptions: "Assumptions & costs",
    bubble: "Gold & silver bubble",
    bubbleHint:
      "Shifts the modelled fair value of gold and raw silver before comparing with the market.",
    market: "Market prices for bubble",
    marketHint: "Leave a field at zero to hide that asset's bubble matrix.",
    certificateHint:
      "Deposit certificates price off LME/ounce and FX; premium, VAT and fees are optional layers.",
  },
  inputs: {
    bubblePct: "Bubble / commission applied to model value (%)",
    market: {
      gold_18k: "Gold 18k, per gram",
      mazaneh: "Mazaneh",
      silver_999: "Silver 999, per gram",
      silver_cert: "Silver certificate (board)",
      copper: "Copper certificate (board)",
      zinc: "Zinc certificate (board)",
    } satisfies Record<AssetKey, string>,
    rialHelp: "The commodity-board price is in Rials — enter Toman.",
    boardFilled: (done: string, total: string) =>
      `${done} of ${total} board prices entered — each one switches on that asset's bubble matrix.`,
  },
  assets: {
    gold_18k: {
      tab: "Gold 18k",
      sub: "18k gold per gram, Toman",
      caption:
        "Modelled price of one gram of 18k gold across USD and world gold-ounce scenarios.",
      formula: "(ounce × USD) ÷ 31.1034 × 0.75 × (1 + bubble)",
      unitLabel: "Price per gram of 18k gold",
      bubbleLabel: "18k gold, per gram",
    },
    mazaneh: {
      tab: "Mazaneh",
      sub: "Gold market mazaneh, Toman",
      caption: "Modelled mazaneh across USD and world gold-ounce scenarios.",
      formula: "18k per-gram price (no bubble) × 4.3318 × (1 + bubble)",
      unitLabel: "Modelled mazaneh",
      bubbleLabel: "Mazaneh",
    },
    silver_999: {
      tab: "Raw silver 999",
      sub: "Raw 999 silver, Toman per gram",
      caption:
        "Modelled price of one gram of raw 999 silver across USD and world silver-ounce scenarios.",
      formula: "(ounce × USD) ÷ 31.1034 × (1 + bubble)",
      unitLabel: "Price per gram of silver 999",
      bubbleLabel: "silver 999, per gram",
    },
    silver_cert: {
      tab: "Silver certificate",
      sub: "Silver deposit certificate (CD1SIB0001), Toman",
      caption:
        "One certificate is assumed to be 1 g of 999.9 silver. The ounce axis is shared with raw silver, but this premium is independent of the raw-silver bubble.",
      formula: "(silver ounce ÷ 31.1034) × USD × (1 + α)",
      unitLabel: "Value per silver certificate",
      bubbleLabel: "silver certificate",
    },
    copper: {
      tab: "Copper cathode",
      sub: "Copper cathode deposit certificate, Toman",
      caption:
        "One certificate is assumed to be 1 kg of copper cathode. LME is in USD/tonne and FX in Toman/USD.",
      formula: "LME × USD × (1 + α) ÷ 1000",
      unitLabel: "Value per copper certificate",
      bubbleLabel: "copper certificate",
    },
    zinc: {
      tab: "Zinc ingot",
      sub: "Zinc ingot deposit certificate, Toman",
      caption:
        "One certificate is assumed to be 1 kg of 99.97% zinc ingot. LME is in USD/tonne and FX in Toman/USD.",
      formula: "LME × USD × (1 + α) ÷ 1000",
      unitLabel: "Value per zinc certificate",
      bubbleLabel: "zinc certificate",
    },
  } satisfies Record<AssetKey, {
    tab: string;
    sub: string;
    caption: string;
    formula: string;
    unitLabel: string;
    bubbleLabel: string;
  }>,
  certificates: {
    copper: {
      title: "Copper cathode",
      premiumHelp: "Market competition premium on the cathode certificate.",
      caption: "",
    },
    zinc: {
      title: "Zinc ingot",
      premiumHelp:
        "Competition and handling premium, commonly 5–10%. Use 0 for pure fair value.",
      caption:
        "Trading the certificate itself is VAT-exempt. The 10% VAT applies only on physical clearance from the warehouse, with a minimum delivery of 21,000 sheets (21 tonnes).",
    },
    silver_cert: {
      title: "Silver certificate",
      premiumHelp:
        "Minting, assay and supply/demand premium, commonly 3–8%. Use 0 for pure fair value. Independent of the raw-silver bubble.",
      caption:
        "Certificate trading is VAT-exempt and the trading fee is 0.24%. Storage (99 Rials/g/day) and delivery-assessment costs (3.6M Rials per 1 kg ingot) are not modelled. Minimum delivery is 1,000 sheets.",
    },
  } satisfies Record<"copper" | "zinc" | "silver_cert", {
    title: string;
    premiumHelp: string;
    caption: string;
  }>,
  results: {
    priceTitle: "Fair-value matrix",
    bubbleTitle: "Bubble matrix",
    priceSub: "Modelled value, Toman",
    bubbleSub: "Market vs model, percent",
    priceLegend: "Low → high modelled value",
    bubbleLegend: "Underpriced ← balanced → overpriced",
    bubbleHint:
      "Positive (red) means the market sits above the modelled value; negative (green) means below it.",
    marketPrice: "Entered market price",
    fairAtBase: "Fair value at base",
    bubbleAtBase: "Bubble at base",
    range: "Range across scenarios",
    spread: "Spread",
    inspector: "Hover a cell to inspect it",
    row: "Row",
    column: "Column",
    value: "Value",
    showTable: "Data table",
    hideTable: "Hide table",
    exportCsv: "Export CSV",
    profileTitle: "Impact along the USD axis",
    profileHint: "Row held at the base scenario; bars follow the same colour scale.",
    profileEmpty: "Widen the USD axis to see the profile.",
    summary: (a: SummaryArgs) =>
      `At ${a.usd} Toman per USD and ${a.axisName} ${a.axisValue} ${a.axisUnit}, ${a.asset} models to ${a.price} ${a.unit}${
        a.compare ? ` — ${a.compare}` : ""
      }.`,
    bubbleSummary: (a: BubbleSummaryArgs) =>
      `At ${a.usd} Toman per USD and ${a.axisName} ${a.axisValue}, the board trades ${a.value} ${a.direction} the fair value of ${a.asset}.`,
    bubbleEqual: (a: Omit<BubbleSummaryArgs, "value" | "direction">) =>
      `At ${a.usd} Toman per USD and ${a.axisName} ${a.axisValue}, the board price matches the fair value of ${a.asset}.`,
    compareAbove: (v: string) => `${v} above the board price`,
    compareBelow: (v: string) => `${v} below the board price`,
    compareEqual: "in line with the board price",
    directionAbove: "above",
    directionBelow: "below",
    noBoardPrice: "no board price entered",
  },
  errors: {
    emptyAxes: (axes: string[]) =>
      `These axes have no positive values left: ${axes.join(", ")}. Reduce the step or the down-scenarios.`,
    validation: "The server rejected these inputs. Check the ranges.",
    network: "Cannot reach the calculation API. Start it with uvicorn.",
    http: "The calculation failed unexpectedly.",
  },
};

type Messages = typeof en;

const fa: Messages = {
  brand: {
    title: "مِتال‌کست",
    subtitle: "پیش‌نگاری قیمت فلزات — ارزش ذاتی در برابر تابلوی بازار",
    tagline:
      "قیمت هر گرم طلای ۱۸ عیار، مظنه، نقره و گواهی سپرده مس و روی را در هر سناریویی از دلار و قیمت جهانی بساز، بعد ببینید بازار چقدر از مدل فاصله دارد.",
    disclaimer: "این ابزار صرفاً محاسباتی و آموزشی است و توصیه‌ی سرمایه‌گذاری نیست.",
    madeBy: "از @themohammadm",
  },
  common: {
    language: "زبان",
    languageName: "English",
    reset: "بازنشانی",
    base: "پایه",
    scenarios: "سناریو",
    cells: "سلول",
    loading: "در حال محاسبه…",
    live: "در حال به‌روزرسانی",
    ready: "به‌روز",
    retry: "تلاش دوباره",
    step: "گام تغییرات",
    stepsUp: "سناریوی بالا",
    stepsDown: "سناریوی پایین",
    premium: "٪ پریمیوم α",
    includeCosts: "اعمال مالیات و کارمزد",
    vat: "مالیات ارزش افزوده (٪)",
    fee: "کارمزد معاملات (٪)",
    optionalCosts: "تنظیمات اختیاری هزینه‌ها",
    notSet: "وارد نشده",
    overpriced: "بالاتر از مدل",
    underpriced: "پایین‌تر از مدل",
    balanced: "در نقطه مدل",
    noBubble: "بدون قیمت بازار",
    toman: "تومان",
    guide: "راهنمای خواندن",
    close: "بستن",
    gotIt: "فهمیدم",
    inputs: "ورودی‌های سناریو",
    min: "کمترین",
    max: "بیشترین",
    pin: "برای سنجاندن، روی یک خانه بزنید",
    pinned: "سجاند",
    unpin: "برداشتن نشان",
    copyLink: "کپی لینک همین سناریو",
    linkCopied: "لینک کپی شد",
  },
  axes: {
    usd: { name: "دلار آزاد", unit: "تومان", short: "دلار" },
    gold: { name: "انس طلا", unit: "دلار", short: "طلا" },
    silver: { name: "انس نقره", unit: "دلار", short: "نقره" },
    copper: { name: "مس LME", unit: "دلار/تن", short: "مس" },
    zinc: { name: "روی LME", unit: "دلار/تن", short: "روی" },
  },
  presets: {
    label: "دانسیته شبکه",
    quick: { name: "سریع", hint: "۵×۵ · خواندن فوری" },
    standard: { name: "استاندارد", hint: "۹×۹ · پیش‌فرض" },
    fine: { name: "دقیق", hint: "۱۷×۱۷ · پوشش کامل" },
  },
  guide: {
    title: "سه قدم تا خواندن ماتریس",
    lead: "مِتال‌کست قیمت بازار را حدس نمی‌زند؛ ارزش ذاتیِ ضمنِ ورودی‌های شما را حساب می‌کند و نشان می‌دهد تابلو چقدر از آن فاصله دارد.",
    steps: [
      {
        title: "محورها را بچینید",
        body: "هر محور یک بعد به ماتریس اضافه می‌کند. نرخ دلار همیشه ستون‌ها است و قیمت جهانیِ همان دارایی، سطرها.",
      },
      {
        title: "قیمت تابلو را وارد کنید",
        body: "با وارد کردن قیمت روزِ دارایی، ماتریس حباب روشن می‌شود: قرمز یعنی بازار بالاتر از ارزش ذاتی، سبز یعنی پایین‌تر.",
      },
      {
        title: "روی یک خانه بزنید",
        body: "خانه سنجیده می‌شود و جمله‌ی زیر شبکه، همان سناریو را ساده می‌نویسد. برای اعداد خام، CSV بگیرید.",
      },
    ],
  },
  sections: {
    scenarios: "محورهای سناریو",
    scenariosHint: "هر محور یک بعد ماتریس را می‌سازد؛ محور دلار همیشه ستون‌ها است.",
    assumptions: "فرض‌ها و هزینه‌ها",
    bubble: "حباب طلا و نقره",
    bubbleHint:
      "پیش از مقایسه با بازار، ارزش محاسباتی طلا و نقره خام را جابه‌جا می‌کند.",
    market: "قیمت‌های بازار برای حباب",
    marketHint: "اگر فیلدی را صفر بگذارید، ماتریس حباب آن دارایی نمایش داده نمی‌شود.",
    certificateHint:
      "گواهی سپرده از LME/انس و نرخ ارز قیمت‌گذاری می‌شود؛ پریمیوم، مالیات و کارمزد لایه‌های اختیاری‌اند.",
  },
  inputs: {
    bubblePct: "٪ حباب / کارمزد اعمال‌شده روی قیمت محاسباتی",
    market: {
      gold_18k: "طلای ۱۸ عیار، هر گرم",
      mazaneh: "مظنه",
      silver_999: "نقره ۹۹۹، هر گرم",
      silver_cert: "گواهی نقره (تابلو)",
      copper: "گواهی مس (تابلو)",
      zinc: "گواهی روی (تابلو)",
    },
    rialHelp: "قیمت تابلوی بورس کالا به ریال است؛ تومان وارد کنید.",
    boardFilled: (done: string, total: string) =>
      `${done} از ${total} قیمت تابلو وارد شده — هر کدام ماتریس حباب همان دارایی را روشن می‌کند.`,
  },
  assets: {
    gold_18k: {
      tab: "طلای ۱۸ عیار",
      sub: "هر گرم طلای ۱۸ عیار، تومان",
      caption:
        "قیمت محاسباتی هر گرم طلای ۱۸ عیار در سناریوهای دلار و انس جهانی طلا.",
      formula: "(انس × دلار) ÷ ۳۱٫۱۰۳۴ × ۰٫۷۵ × (۱ + حباب)",
      unitLabel: "قیمت هر گرم طلای ۱۸ عیار",
      bubbleLabel: "هر گرم طلای ۱۸ عیار",
    },
    mazaneh: {
      tab: "مظنه بازار",
      sub: "مظنه طلا، تومان",
      caption: "مظنه محاسباتی بازار در سناریوهای دلار و انس جهانی طلا.",
      formula: "قیمت هر گرم ۱۸ عیار (بدون حباب) × ۴٫۳۳۱۸ × (۱ + حباب)",
      unitLabel: "مظنه محاسباتی",
      bubbleLabel: "مظنه طلا",
    },
    silver_999: {
      tab: "نقره خام ۹۹۹",
      sub: "نقره خام عیار ۹۹۹، تومان در گرم",
      caption:
        "قیمت محاسباتی هر گرم نقره خام ۹۹۹ در سناریوهای دلار و انس جهانی نقره.",
      formula: "(انس × دلار) ÷ ۳۱٫۱۰۳۴ × (۱ + حباب)",
      unitLabel: "قیمت هر گرم نقره ۹۹۹",
      bubbleLabel: "هر گرم نقره ۹۹۹",
    },
    silver_cert: {
      tab: "گواهی نقره",
      sub: "گواهی سپرده شمش نقره (CD1SIB0001)، تومان",
      caption:
        "فرض: هر ورقه معادل ۱ گرم شمش نقره با عیار ۹۹۹٫۹ است. محور انس با نقره خام مشترک است، اما این پریمیوم مستقل از حباب نقره خام عمل می‌کند.",
      formula: "(انس نقره ÷ ۳۱٫۱۰۳۴) × دلار × (۱ + α)",
      unitLabel: "ارزش هر گواهی نقره",
      bubbleLabel: "هر گواهی شمش نقره",
    },
    copper: {
      tab: "مس کاتد",
      sub: "گواهی سپرده مس کاتد، تومان",
      caption:
        "فرض: هر ورقه معادل یک کیلوگرم مس کاتد است. قیمت LME بر حسب دلار/تن و نرخ ارز بر حسب تومان/دلار.",
      formula: "LME × دلار × (۱ + α) ÷ ۱۰۰۰",
      unitLabel: "ارزش هر گواهی مس",
      bubbleLabel: "هر گواهی مس کاتد",
    },
    zinc: {
      tab: "شمش روی",
      sub: "گواهی سپرده شمش روی، تومان",
      caption:
        "فرض: هر ورقه معادل یک کیلوگرم شمش روی با عیار ۹۹٫۹۷٪ است. قیمت LME بر حسب دلار/تن و نرخ ارز بر حسب تومان/دلار.",
      formula: "LME × دلار × (۱ + α) ÷ ۱۰۰۰",
      unitLabel: "ارزش هر گواهی روی",
      bubbleLabel: "هر گواهی شمش روی",
    },
  },
  certificates: {
    copper: {
      title: "مس کاتد",
      premiumHelp: "پریمیوم رقابت بازار روی گواهی مس کاتد.",
      caption: "",
    },
    zinc: {
      title: "شمش روی",
      premiumHelp:
        "پریمیوم رقابت و هزینه‌های جانبی؛ معمولاً ۵ تا ۱۰٪. برای ارزش ذاتی خالص عدد ۰ را بگذارید.",
      caption:
        "معامله خود گواهی سپرده از VAT معاف است. مالیات ۱۰٪ فقط در صورت ترخیص و تحویل فیزیکی از انبار اعمال می‌شود. حداقل حجم تحویل ۲۱٬۰۰۰ ورقه (۲۱ تن) است.",
    },
    silver_cert: {
      title: "گواهی سپرده نقره",
      premiumHelp:
        "پریمیوم ضرب شمش، عیارسنجی و تعادل عرضه و تقاضا؛ معمولاً ۳ تا ۸٪. برای ارزش ذاتی خالص عدد ۰ را بگذارید. این پریمیوم مستقل از حباب نقره خام است.",
      caption:
        "معامله گواهی سپرده از VAT معاف است و کارمزد معامله ۰٫۲۴٪ است. هزینه انبارداری (۹۹ ریال/گرم/روز) و هزینه ارزیابی تحویل (۳٫۶ میلیون ریال به ازای هر شمش ۱ کیلوگرمی) در محاسبه لحاظ نشده‌اند. حداقل تحویل ۱٬۰۰۰ ورقه است.",
    },
  },
  results: {
    priceTitle: "ماتریس ارزش ذاتی",
    bubbleTitle: "ماتریس حباب",
    priceSub: "ارزش محاسباتی، تومان",
    bubbleSub: "فاصله بازار از مدل، درصد",
    priceLegend: "کم ← زیاد",
    bubbleLegend: "ارزان‌تر ← متعادل → گران‌تر",
    bubbleHint:
      "حباب مثبت (قرمز) یعنی قیمت بازار بالاتر از مقدار محاسباتی است؛ حباب منفی (سبز) یعنی پایین‌تر.",
    marketPrice: "قیمت بازار واردشده",
    fairAtBase: "ارزش ذاتی در پایه",
    bubbleAtBase: "حباب در سناریوی پایه",
    range: "بازه سناریوها",
    spread: "گسترش",
    inspector: "برای دیدن جزئیات روی یک خانه اشاره کنید",
    row: "سطر",
    column: "ستون",
    value: "مقدار",
    showTable: "جدول داده",
    hideTable: "بستن جدول",
    exportCsv: "خروجی CSV",
    profileTitle: "اثر روی محور دلار",
    profileHint: "سطر پایه ثابت است؛ رنگ ستون‌ها همان مقیاس ماتریس است.",
    profileEmpty: "برای دیدن نمودار، بازه دلار را گسترش دهید.",
    summary: (a: SummaryArgs) =>
      `با دلار ${a.usd} تومان و ${a.axisName} ${a.axisValue} ${a.axisUnit}، ارزش ${a.asset} برابر ${a.price} ${a.unit} است${
        a.compare ? ` — ${a.compare}` : ""
      }.`,
    bubbleSummary: (a: BubbleSummaryArgs) =>
      `در دلار ${a.usd} تومان و ${a.axisName} ${a.axisValue}، قیمت تابلو ${a.value} ${a.direction} ارزش ذاتی ${a.asset} است.`,
    bubbleEqual: (a: Omit<BubbleSummaryArgs, "value" | "direction">) =>
      `در دلار ${a.usd} تومان و ${a.axisName} ${a.axisValue}، قیمت تابلو با ارزش ذاتی ${a.asset} هم‌راستا است.`,
    compareAbove: (v: string) => `${v} بالاتر از قیمت تابلو`,
    compareBelow: (v: string) => `${v} پایین‌تر از قیمت تابلو`,
    compareEqual: "هم‌راستا با قیمت تابلو",
    directionAbove: "بالاتر از",
    directionBelow: "پایین‌تر از",
    noBoardPrice: "قیمت تابلو وارد نشده است",
  },
  errors: {
    emptyAxes: (axes: string[]) =>
      `با تنظیمات فعلی، بازه‌ی این موارد خالی شده است: ${axes.join("، ")}. گام تغییرات یا سناریوهای پایین را کاهش دهید.`,
    validation: "ورودی‌ها از دامنه مجاز خارج هستند. مقادیر را بررسی کنید.",
    network: "ارتباط با سرویس محاسبه برقرار نشد. آن را با uvicorn بالا بیاورید.",
    http: "محاسبه به‌طور غیرمنتظره ناموفق بود.",
  },
};

export const messages: Record<Lang, Messages> = { en, fa };
export type { Messages };
