/**
 * Sofreh Yalda - Items & 15 Handcrafted Classic Saga Levels
 */

const YALDA_TREATS = [
  {
    id: 0,
    name: 'قاچ هندوانه',
    emoji: '🍉',
    color: '#ff2e5b',
    glow: '#fb7185'
  },
  {
    id: 1,
    name: 'انار یاقوتی',
    emoji: '❤️',
    color: '#be123c',
    glow: '#f43f5e'
  },
  {
    id: 2,
    name: 'پسته خندان',
    emoji: '💚',
    color: '#16a34a',
    glow: '#4ade80'
  },
  {
    id: 3,
    name: 'خرمالوی طلایی',
    emoji: '🧡',
    color: '#ea580c',
    glow: '#fb923c'
  },
  {
    id: 4,
    name: 'باسلوق بنفش',
    emoji: '💜',
    color: '#9333ea',
    glow: '#c084fc'
  },
  {
    id: 5,
    name: 'شیرینی نخودچی',
    emoji: '💛',
    color: '#eab308',
    glow: '#facc15'
  }
];

const YALDA_LEVELS = [
  {
    id: 1,
    title: 'آغاز شب چله',
    featureTag: '🍉 چیدن هندوانه و انار',
    description: 'به سفره یلدا خوش آمدید! ۳ یا چند خوراکی هم‌شکل را کنار هم ردیف کنید تا اهداف مرحله کامل شوند.',
    gridSize: 7,
    numTypes: 5,
    moves: 18,
    targets: [
      { type: 'item', itemId: 0, count: 12, label: 'قاچ هندوانه' },
      { type: 'item', itemId: 1, count: 12, label: 'انار یاقوتی' }
    ],
    icePositions: [],
    boxPositions: [],
    starThresholds: [900, 1800, 2800]
  },
  {
    id: 2,
    title: 'ترقه‌ها و آجیل شب یلدا',
    featureTag: '💥 ساخت ترقه ۴تایی',
    description: 'با ردیف کردن ۴ خوراکی یک «ترقه خطی» بسازید تا یک سطر یا ستون کامل از پسته و خرمالو را جمع کنید!',
    gridSize: 7,
    numTypes: 5,
    moves: 18,
    targets: [
      { type: 'item', itemId: 2, count: 15, label: 'پسته خندان' },
      { type: 'item', itemId: 3, count: 15, label: 'خرمالوی طلایی' }
    ],
    icePositions: [],
    boxPositions: [],
    starThresholds: [1100, 2200, 3400]
  },
  {
    id: 3,
    title: 'قندیل‌های زمستانی',
    featureTag: '❄️ مانع جدید: قندیل یخ',
    description: 'سرمای اول زمستان برخی خوراکی‌ها را منجمد کرده! خوراکی‌های داخل یخ را جور کنید تا قندیل‌ها بشکنند.',
    gridSize: 7,
    numTypes: 5,
    moves: 20,
    targets: [
      { type: 'ice', count: 9, label: 'قندیل یخ' },
      { type: 'item', itemId: 0, count: 12, label: 'قاچ هندوانه' }
    ],
    icePositions: [
      [2, 2, 1], [2, 3, 1], [2, 4, 1],
      [3, 2, 1], [3, 3, 1], [3, 4, 1],
      [4, 2, 1], [4, 3, 1], [4, 4, 1]
    ],
    boxPositions: [],
    starThresholds: [1300, 2500, 3800]
  },
  {
    id: 4,
    title: 'جعبه‌های شیرینی یلدا',
    featureTag: '🎁 مانع جدید: جعبه شیرینی',
    description: 'جعبه‌های شیرینی تکان نمی‌خورند! خوراکی‌های کنار جعبه را جور کنید یا با ترقه و بمب انار آن‌ها را باز کنید.',
    gridSize: 7,
    numTypes: 5,
    moves: 20,
    targets: [
      { type: 'box', count: 6, label: 'جعبه شیرینی' },
      { type: 'item', itemId: 1, count: 14, label: 'انار یاقوتی' }
    ],
    icePositions: [],
    boxPositions: [
      [2, 1], [2, 5],
      [3, 2], [3, 4],
      [4, 1], [4, 5]
    ],
    starThresholds: [1400, 2700, 4100]
  },
  {
    id: 5,
    title: 'بمب انار و دیوان حافظ',
    featureTag: '📘 ترکیب ۵تایی و L/T',
    description: 'جور کردن ۵ خوراکی به شکل L یا T «بمب انار» می‌سازد و ۵ خوراکی در یک خط «دیوان حافظ» رنگ‌پاک‌کن به شما می‌دهد!',
    gridSize: 8,
    numTypes: 5,
    moves: 21,
    targets: [
      { type: 'ice', count: 8, label: 'قندیل یخ' },
      { type: 'box', count: 4, label: 'جعبه شیرینی' },
      { type: 'item', itemId: 4, count: 16, label: 'باسلوق بنفش' }
    ],
    icePositions: [
      [1, 2, 1], [1, 5, 1],
      [2, 2, 1], [2, 5, 1],
      [5, 2, 1], [5, 5, 1],
      [6, 2, 1], [6, 5, 1]
    ],
    boxPositions: [
      [3, 3], [3, 4],
      [4, 3], [4, 4]
    ],
    starThresholds: [1600, 3100, 4700]
  },
  {
    id: 6,
    title: 'سفره رنگارنگ نخودچی',
    featureTag: '💛 ۶ نوع خوراکی یلدا',
    description: 'شیرینی نخودچی زعفرانی هم به سفره اضافه شد! جعبه‌های شیرینی را باز کنید و نخودچی جمع کنید.',
    gridSize: 8,
    numTypes: 6,
    moves: 22,
    targets: [
      { type: 'item', itemId: 5, count: 18, label: 'شیرینی نخودچی' },
      { type: 'box', count: 8, label: 'جعبه شیرینی' }
    ],
    icePositions: [],
    boxPositions: [
      [1, 3], [1, 4],
      [3, 1], [3, 6],
      [4, 1], [4, 6],
      [6, 3], [6, 4]
    ],
    starThresholds: [1700, 3300, 5000]
  },
  {
    id: 7,
    title: 'یخبندان دولایه چله',
    featureTag: '❄️❄️ قندیل یخ ضخیم (۲ لایه)',
    description: 'برخی قندیل‌های مرکزی ۲ لایه هستند و برای شکستن کامل به دو بار جور شدن یا انفجار بمب نیاز دارند!',
    gridSize: 8,
    numTypes: 6,
    moves: 23,
    targets: [
      { type: 'ice', count: 12, label: 'قندیل یخ' },
      { type: 'item', itemId: 1, count: 18, label: 'انار یاقوتی' }
    ],
    icePositions: [
      [2, 2, 1], [2, 3, 2], [2, 4, 2], [2, 5, 1],
      [3, 3, 2], [3, 4, 2],
      [4, 3, 2], [4, 4, 2],
      [5, 2, 1], [5, 3, 2], [5, 4, 2], [5, 5, 1]
    ],
    boxPositions: [],
    starThresholds: [1900, 3600, 5400]
  },
  {
    id: 8,
    title: 'قلعه شیرینی و پسته',
    featureTag: '🎁 قلعه جعبه‌ها',
    description: 'جعبه‌های شیرینی در مرکز سفره حلقه زده‌اند! با ساخت ترقه‌های خطی از بیرون به قلب قلعه بزنید.',
    gridSize: 8,
    numTypes: 6,
    moves: 23,
    targets: [
      { type: 'box', count: 10, label: 'جعبه شیرینی' },
      { type: 'item', itemId: 2, count: 20, label: 'پسته خندان' }
    ],
    icePositions: [
      [3, 3, 1], [3, 4, 1], [4, 3, 1], [4, 4, 1]
    ],
    boxPositions: [
      [2, 2], [2, 3], [2, 4], [2, 5],
      [3, 2], [3, 5],
      [4, 2], [4, 5],
      [5, 3], [5, 4]
    ],
    starThresholds: [2000, 3800, 5700]
  },
  {
    id: 9,
    title: 'معجون هندوانه و خرمالو',
    featureTag: '🍉🧡 جشن میوه‌های یلدا',
    description: 'مهمان‌ها منتظر هندوانه و خرمالو هستند! قندیل‌های یخ گوشه سفره را هم پاکسازی کنید.',
    gridSize: 8,
    numTypes: 6,
    moves: 22,
    targets: [
      { type: 'item', itemId: 0, count: 22, label: 'قاچ هندوانه' },
      { type: 'item', itemId: 3, count: 22, label: 'خرمالوی طلایی' },
      { type: 'ice', count: 8, label: 'قندیل یخ' }
    ],
    icePositions: [
      [0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 2],
      [0, 6, 1], [0, 7, 1], [1, 6, 2], [1, 7, 1]
    ],
    boxPositions: [
      [3, 3], [3, 4]
    ],
    starThresholds: [2100, 4000, 6000]
  },
  {
    id: 10,
    title: 'چهارراه گره‌چینی',
    featureTag: '✨ مرحله ۱۰ — چالش میانه',
    description: 'یک چیدمان سنتی گره‌چینی از یخ و جعبه‌های شیرینی! از ابزار کمکی پایین صفحه هم می‌توانید کمک بگیرید.',
    gridSize: 8,
    numTypes: 6,
    moves: 24,
    targets: [
      { type: 'ice', count: 12, label: 'قندیل یخ' },
      { type: 'box', count: 8, label: 'جعبه شیرینی' },
      { type: 'item', itemId: 1, count: 20, label: 'انار یاقوتی' }
    ],
    icePositions: [
      [1, 1, 2], [1, 6, 2],
      [2, 2, 1], [2, 5, 1],
      [3, 3, 2], [3, 4, 2],
      [4, 3, 2], [4, 4, 2],
      [5, 2, 1], [5, 5, 1],
      [6, 1, 2], [6, 6, 2]
    ],
    boxPositions: [
      [1, 3], [1, 4],
      [3, 1], [4, 1],
      [3, 6], [4, 6],
      [6, 3], [6, 4]
    ],
    starThresholds: [2300, 4300, 6500]
  },
  {
    id: 11,
    title: 'طوفان یاقوت و باسلوق',
    featureTag: '💜❤️ کمبوهای زنجیره‌ای',
    description: 'ترکیب دو بمب کنار هم موج انفجاری عظیمی می‌سازد. جعبه‌ها را باز کنید و باسلوق و انار جمع کنید!',
    gridSize: 8,
    numTypes: 6,
    moves: 23,
    targets: [
      { type: 'item', itemId: 4, count: 24, label: 'باسلوق بنفش' },
      { type: 'item', itemId: 1, count: 24, label: 'انار یاقوتی' },
      { type: 'box', count: 8, label: 'جعبه شیرینی' }
    ],
    icePositions: [],
    boxPositions: [
      [2, 1], [2, 2], [2, 5], [2, 6],
      [5, 1], [5, 2], [5, 5], [5, 6]
    ],
    starThresholds: [2400, 4500, 6800]
  },
  {
    id: 12,
    title: 'کرسی گرم شب یلدا',
    featureTag: '🔥 ذوب کردن ۱۶ قندیل یخ',
    description: 'کرسی شب یلدا را روشن کنید و تمام ۱۶ قندیل یخ زمستانی روی سفره را ذوب کنید!',
    gridSize: 8,
    numTypes: 6,
    moves: 24,
    targets: [
      { type: 'ice', count: 16, label: 'قندیل یخ' },
      { type: 'item', itemId: 5, count: 20, label: 'شیرینی نخودچی' }
    ],
    icePositions: [
      [2, 2, 2], [2, 3, 1], [2, 4, 1], [2, 5, 2],
      [3, 2, 1], [3, 3, 2], [3, 4, 2], [3, 5, 1],
      [4, 2, 1], [4, 3, 2], [4, 4, 2], [4, 5, 1],
      [5, 2, 2], [5, 3, 1], [5, 4, 1], [5, 5, 2]
    ],
    boxPositions: [
      [1, 3], [1, 4]
    ],
    starThresholds: [2500, 4700, 7100]
  },
  {
    id: 13,
    title: 'ضیافت شاهانه حافظ',
    featureTag: '🎁 ۱۲ جعبه شیرینی دربسته',
    description: '۱۲ جعبه شیرینی در ستون‌های سفره چیده شده‌اند. ترقه‌های عمودی و افقی کلید پیروزی شما هستند!',
    gridSize: 8,
    numTypes: 6,
    moves: 24,
    targets: [
      { type: 'box', count: 12, label: 'جعبه شیرینی' },
      { type: 'item', itemId: 2, count: 24, label: 'پسته خندان' },
      { type: 'item', itemId: 0, count: 20, label: 'قاچ هندوانه' }
    ],
    icePositions: [
      [3, 3, 2], [3, 4, 2], [4, 3, 2], [4, 4, 2]
    ],
    boxPositions: [
      [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
      [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6]
    ],
    starThresholds: [2600, 4900, 7400]
  },
  {
    id: 14,
    title: 'سحرگاه طولانی‌ترین شب',
    featureTag: '🌙 پیش به سوی فینال',
    description: 'فقط یک قدم تا پایان نقشه سفره یلدا! ترکیب یخ‌های دولایه و جعبه‌های شیرینی را مدیریت کنید.',
    gridSize: 8,
    numTypes: 6,
    moves: 25,
    targets: [
      { type: 'ice', count: 14, label: 'قندیل یخ' },
      { type: 'box', count: 10, label: 'جعبه شیرینی' },
      { type: 'item', itemId: 3, count: 24, label: 'خرمالوی طلایی' }
    ],
    icePositions: [
      [1, 2, 2], [1, 3, 1], [1, 4, 1], [1, 5, 2],
      [2, 2, 1], [2, 5, 1],
      [3, 3, 2], [3, 4, 2],
      [4, 3, 2], [4, 4, 2],
      [5, 2, 1], [5, 5, 1],
      [6, 3, 2], [6, 4, 2]
    ],
    boxPositions: [
      [2, 3], [2, 4],
      [3, 1], [3, 6],
      [4, 1], [4, 6],
      [5, 3], [5, 4],
      [6, 1], [6, 6]
    ],
    starThresholds: [2800, 5200, 7800]
  },
  {
    id: 15,
    title: 'جشن بزرگ شب یلدا (فینال)',
    featureTag: '👑 مرحله ۱۵ — فینال بزرگ چله',
    description: 'طولانی‌ترین شب سال به اوج رسیده است! با تمام مهارت خود سفره بزرگ یلدا را تکمیل کنید و نامتان را در صدر لیدربورد لبه آروان ثبت کنید!',
    gridSize: 8,
    numTypes: 6,
    moves: 26,
    targets: [
      { type: 'ice', count: 16, label: 'قندیل یخ' },
      { type: 'box', count: 10, label: 'جعبه شیرینی' },
      { type: 'item', itemId: 0, count: 25, label: 'قاچ هندوانه' },
      { type: 'item', itemId: 1, count: 25, label: 'انار یاقوتی' }
    ],
    icePositions: [
      [0, 2, 2], [0, 5, 2],
      [1, 1, 2], [1, 3, 1], [1, 4, 1], [1, 6, 2],
      [2, 2, 2], [2, 5, 2],
      [5, 2, 2], [5, 5, 2],
      [6, 1, 2], [6, 3, 1], [6, 4, 1], [6, 6, 2],
      [7, 2, 2], [7, 5, 2]
    ],
    boxPositions: [
      [2, 3], [2, 4],
      [3, 2], [3, 3], [3, 4], [3, 5],
      [4, 2], [4, 3], [4, 4], [4, 5]
    ],
    starThresholds: [3200, 5800, 8600]
  }
];

window.YALDA_TREATS = YALDA_TREATS;
window.YALDA_LEVELS = YALDA_LEVELS;
