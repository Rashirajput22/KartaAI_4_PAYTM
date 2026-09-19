/* KartaAI prototype — small, modular in-browser data layer */
const $ = (selector) => document.querySelector(selector);
const getApp = () => $('#app');

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);

const dateText = (date = new Date()) => {
  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(value);
};
const escapeHTML = (value = '') =>
  String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));

const productBlueprint = [
  ['Mustard Oil 1L', 'Cooking Oil', 180, 38, 12, 136, 24480, 18],
  ['Sunflower Oil 1L', 'Cooking Oil', 178, 24, 10, 101, 17978, 8],
  ['Soybean Oil 1L', 'Cooking Oil', 170, 19, 10, 73, 12410, -3],
  ['Basmati Rice 5kg', 'Rice', 360, 4, 10, 49, 17640, 10],
  ['Aashirvaad Flour 5kg', 'Flour', 270, 31, 12, 57, 15390, 6],
  ['Premium Tea 500g', 'Beverages', 245, 2, 9, 22, 5390, -14],
  ['Cola Cold Drink 750ml', 'Beverages', 45, 17, 15, 18, 810, -21],
  ['Marie Biscuits', 'Snacks', 35, 65, 20, 61, 2135, 24],
  ['Toor Dal 1kg', 'Pulses', 155, 28, 12, 36, 5580, 4],
  ['Fine Sugar 1kg', 'Grocery', 48, 36, 15, 42, 2016, 3],
  ['Fresh Soap Pack', 'Personal Care', 110, 12, 10, 26, 2860, 9],
  ['Dishwash Liquid', 'Household', 99, 8, 10, 19, 1881, -6]
];

const merchantSeed = [
  {
    id: 'merchant_001',
    name: 'Rahul Sharma',
    businessName: 'Sharma General Store',
    businessType: 'Grocery & Daily Essentials',
    location: 'Greater Noida',
    mobile: '98765 43210',
    email: 'rahul@sharmastore.demo',
    categories: 'Grocery, Cooking Oil, Snacks',
    created: '12 Feb 2026',
    initials: 'RS',
    multiplier: 1,
    today: {
      sales: 18450,
      orders: 126,
      customers: 94,
      growth: 12.4
    },
    weeklyGrowth: 8,
    regularCustomers: 47,
    offerName: 'Evening Refresh Offer',
    insight:
      'Mustard oil sales are up 18%. A small promotion can help clear your slow beverage stock.'
  },
  {
    id: 'merchant_002',
    name: 'Priya Verma',
    businessName: 'Priya Daily Needs',
    businessType: 'Grocery & Household',
    location: 'Indirapuram',
    mobile: '98910 22334',
    email: 'priya@dailyneeds.demo',
    categories: 'Grocery, Household, Personal Care',
    created: '18 Mar 2026',
    initials: 'PV',
    multiplier: 0.82,
    today: {
      sales: 15280,
      orders: 101,
      customers: 79,
      growth: 7.6
    },
    weeklyGrowth: 5,
    regularCustomers: 39,
    offerName: 'Home Essentials Saver',
    insight:
      'Your household essentials are doing well. Two tea products need a little attention.'
  },
  {
    id: 'merchant_003',
    name: 'Amit Gupta',
    businessName: 'Amit Fresh Mart',
    businessType: 'Food & Grocery',
    location: 'Noida Sector 76',
    mobile: '98188 66770',
    email: 'amit@freshmart.demo',
    categories: 'Fresh Food, Grocery, Beverages',
    created: '04 Jan 2026',
    initials: 'AG',
    multiplier: 1.16,
    today: {
      sales: 22890,
      orders: 148,
      customers: 117,
      growth: 15.2
    },
    weeklyGrowth: 11,
    regularCustomers: 63,
    offerName: 'Weekend Kitchen Offer',
    insight:
      'Rice and cooking oil are your strongest categories this week. Keep tea stock replenished.'
  }
];

function seededMerchant(seed) {
  const m = structuredClone(seed);

  m.products = productBlueprint.map(
    (
      [
        name,
        category,
        price,
        stock,
        reorderLevel,
        units,
        revenue,
        growth
      ],
      index
    ) => {
      const multiplier = m.multiplier;

      const adjustedStock = Math.max(
        1,
        Math.round(
          stock *
            (seed.id === 'merchant_002' && index === 5 ? 2 : 1)
        )
      );

      const adjustedUnits = Math.round(units * multiplier);

      return {
        id: `prod_${seed.id.slice(-3)}_${index + 1}`,
        name,
        category,
        price,
        stock: adjustedStock,
        reorderLevel,
        units: adjustedUnits,
        revenue: Math.round(revenue * multiplier),
        previousSales: Math.round(
          (revenue * multiplier) / (1 + growth / 100)
        ),
        growth,
        supplier:
          index < 3
            ? 'North India Foods'
            : index < 7
              ? 'Daily Goods Supply'
              : 'Metro Distributors',
        lastRestocked:
          index % 3 === 0 ? '8 Sep 2026' : '4 Sep 2026'
      };
    }
  );

  m.orders = Array.from({ length: 8 }, (_, index) => ({
    id: `ORD-${seed.id.slice(-3)}-${120 + index}`,
    customer: [
      'Anita',
      'Rohit',
      'Sanjay',
      'Meena',
      'Kavita',
      'Arun',
      'Pooja',
      'Vikram'
    ][index],
    products: [
      'Mustard Oil, Rice',
      'Biscuits, Tea',
      'Flour, Sugar',
      'Sunflower Oil',
      'Cold Drinks',
      'Pulses, Rice',
      'Soap Pack',
      'Mustard Oil'
    ][index],
    amount: Math.round((220 + index * 135) * m.multiplier),
    date: index < 4 ? 'Today' : `${11 - index} Sep`,
    status: index === 2 ? 'Pending' : 'Completed'
  }));

  m.customers = [
    'Anita Gupta',
    'Rohit Singh',
    'Meena Kumari',
    'Sanjay Patel',
    'Kavita Jain'
  ].map((name, index) => ({
    id: `CUST-${seed.id.slice(-3)}-${index + 1}`,
    name,
    frequency: 8 - index,
    orders: 17 - index * 2,
    spending: Math.round(
      (6840 - index * 780) * m.multiplier
    ),
    favourite: [
      'Cooking Oil',
      'Grocery',
      'Snacks',
      'Rice',
      'Personal Care'
    ][index],
    lastPurchase:
      index < 2 ? 'Today' : `${index + 1} days ago`,
    type: index < 4 ? 'Returning' : 'New'
  }));

  m.offers = [
    {
      id: `offer_${seed.id.slice(-3)}_01`,
      name: 'Festival Grocery Value Pack',
      products: 'Rice, Flour & Pulses',
      discount: '8% OFF',
      start: '8 Sep 2026',
      end: '15 Sep 2026',
      status: 'Active',
      createdBy: 'You'
    },
    {
      id: `offer_${seed.id.slice(-3)}_02`,
      name: 'Tea Time Special',
      products: 'Tea & Biscuits',
      discount: '10% OFF',
      start: '15 Sep 2026',
      end: '22 Sep 2026',
      status: 'Scheduled',
      createdBy: 'KartaAI'
    }
  ];

  m.activity = [
    {
      text: 'Checked today’s sales',
      time: 'Today, 10:42 AM',
      status: 'Done'
    },
    {
      text: 'Found 3 products with low stock',
      time: 'Today, 9:15 AM',
      status: 'Done'
    },
    {
      text: 'Created Tea Time Special',
      time: 'Yesterday, 5:20 PM',
      status: 'Done'
    }
  ];

  m.momentum = {
    status: 'Ready',
    offerId: null,
    verifiedAt: null
  };

  m.salesHistory = Array.from(
    { length: 30 },
    (_, index) => {
      const date = new Date(
        2026,
        8,
        index === 29 ? 12 : index + 1
      );

      const wave =
        0.85 +
        ((index * 7) % 13) / 30 +
        (index > 22 ? 0.08 : 0);

      const revenue = Math.round(
        m.today.sales * wave
      );

      return {
        date,
        revenue,
        orders: Math.max(
          6,
          Math.round(m.today.orders * wave)
        ),
        product:
          m.products[index % m.products.length].name,
        category:
          m.products[index % m.products.length].category,
        units: Math.max(
          4,
          Math.round(
            m.products[index % m.products.length].units / 6
          )
        )
      };
    }
  );

  return m;
}

function loadMerchants() {
  try {
    const saved =
      localStorage.getItem('kartaai-demo-v1');

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
    }
  } catch (_) {
    // Use fresh demo data.
  }

  return merchantSeed.map(seededMerchant);
}

let merchants = loadMerchants();

/* =====================================================
   MULTILINGUAL I18N DICTIONARY (HINDI, ENGLISH, HINGLISH)
===================================================== */

const I18N = {
  english: {
    lang_name: 'English',
    lang_badge: 'EN',
    lang_modal_title: 'Choose your language / अपनी भाषा चुनें',
    lang_modal_sub: 'KartaAI will adapt all screens, insights, and voice responses to your preferred language.',
    lang_opt_en_title: 'English',
    lang_opt_en_sub: 'Professional business English',
    lang_opt_en_tag: 'Standard',
    lang_opt_hi_title: 'हिंदी (Hindi)',
    lang_opt_hi_sub: 'शुद्ध और सरल हिंदी',
    lang_opt_hi_tag: 'व्यापारिक',
    lang_opt_hng_title: 'Hinglish',
    lang_opt_hng_sub: 'Daily spoken business mix (Hindi in English)',
    lang_opt_hng_tag: 'Popular',

    // Navigation
    nav_home: 'Home',
    nav_business: 'Business',
    nav_karta: 'Ask Karta',
    nav_offers: 'Offers',
    nav_profile: 'Profile',
    nav_chat_history: 'Chat History',
    nav_chat_history: 'Chat History',

    // Welcome Screen
    welcome_eyebrow: '✦ Your teammate for everyday business',
    welcome_h1_1: 'You ask.',
    welcome_h1_2: 'KartaAI handles it.',
    welcome_copy: 'A simple place to understand your sales, check stock, and take the next step for your business — in English, Hindi, or Hinglish.',
    welcome_create_acc: 'Create Account',
    welcome_login: 'Login',
    welcome_demo: 'Explore demo',
    welcome_trust: 'Built for busy merchants. Simple from the first question.',
    welcome_sales_pill: '↗ Sales up by 12.4%',
    welcome_offer_pill: '✓ Offer published',
    welcome_preview_sales: 'Today’s sales',
    welcome_preview_growth: '↑ 12.4% vs yesterday',
    welcome_preview_q: '“My sales are down. Help me.”',
    welcome_preview_a: 'I found an opportunity. Let’s create an offer.',

    // Auth Screen
    auth_step_business: 'Step 2 of 2 · Your business',
    auth_onboard_title: 'Tell us the basics',
    auth_onboard_sub: 'That’s all we need to personalize KartaAI for you.',
    auth_label_name: 'Your name',
    auth_placeholder_name: 'e.g. Asha Singh',
    auth_label_bname: 'Business name',
    auth_placeholder_bname: 'e.g. Asha General Store',
    auth_label_btype: 'Business type',
    auth_label_loc: 'City / location',
    auth_placeholder_loc: 'e.g. Greater Noida',
    auth_label_email: 'Email (optional)',
    auth_start_btn: 'Start with KartaAI',
    auth_login_btn: 'Login',
    auth_welcome_back: 'Welcome back',
    auth_create_acc_title: 'Create your account',
    auth_enter_otp: 'Enter your OTP',
    auth_otp_sent_to: 'We sent a 4-digit code to',
    auth_signup_sub: 'Start with your mobile number. You can add the business basics next.',
    auth_login_sub: 'Use your mobile number to continue.',
    auth_otp_label: 'One-time password',
    auth_otp_placeholder: 'Enter 4-digit OTP',
    auth_verify_continue: 'Verify & continue',
    auth_resend_otp: 'Resend OTP',
    auth_otp_real_note: 'OTP is sent to your real mobile number through MSG91.',
    auth_mobile_label: 'Mobile number',
    auth_mobile_placeholder: 'Enter 10-digit mobile number',
    auth_send_otp_btn: 'Send OTP',
    auth_sms_note: 'We’ll send a real OTP to your Indian mobile number.',

    // Home Screen
    home_good_morning: 'Good morning',
    home_demo_badge: '● Demo Business',
    home_ask_title: 'Ask KartaAI',
    home_ask_sub: 'What do you want to know or do?',
    home_ask_placeholder: 'Ask about sales, stock, offers, or click mic...',
    home_ask_btn: 'Ask',
    home_try_asking: 'Try asking',
    home_tap_question: 'Tap a question to get started',
    home_kicker_focus: 'Today’s Focus',
    home_momentum_sub: 'A smart action ready to boost your revenue today.',
    home_view_plan: '✦ View today’s small plan',
    home_todays_sales: 'Today’s sales',
    home_orders: 'Orders',
    home_customers: 'Customers',
    home_growth: 'Growth',
    home_recent_activity: 'Recent activity',
    home_low_stock_notice: 'products have low stock',

    // Business Screen
    biz_sales_trend: '30-Day Revenue Trend',
    biz_sales_trend_sub: 'Daily performance wave',
    biz_inventory_title: 'Inventory & Stock Status',
    biz_inventory_sub: 'Live items in store',
    biz_healthy: 'Healthy',
    biz_low_stock: 'Low Stock',
    biz_critical: 'Critical',
    biz_reorder_level: 'Reorder Level',
    biz_in_stock: 'In Stock',

    // Assistant / Karta Screen
    assistant_page_title: 'Ask KartaAI',
    assistant_page_sub: 'Tell me what you need, or speak with microphone.',
    assistant_here_to_help: 'Here to help with',
    assistant_input_placeholder: 'Ask about your business or speak with mic...',
    assistant_quick_title: 'Quick questions',
    assistant_source_note: 'Your real business data is checked first. Market questions are kept separate.',
    assistant_speech_listening: 'Listening... speak now',
    assistant_speech_unsupported: 'Speech recognition is not supported in this browser.',
    assistant_voice_readout: 'Listen',
    assistant_voice_stop: 'Stop',
    assistant_voice_on: 'Voice: ON',
    assistant_voice_off: 'Voice: MUTE',

    // Offers Screen
    offers_page_title: 'Special Offers',
    offers_page_sub: 'Engage customers and clear slow-moving inventory.',
    offers_create_btn: '+ Create New Offer',
    offers_tab_all: 'All',
    offers_tab_active: 'Active',
    offers_tab_scheduled: 'Scheduled',
    offers_tab_expired: 'Expired',
    offers_publish_btn: 'Publish Offer',

    // Profile Screen
    profile_page_title: 'Merchant Profile',
    profile_page_sub: 'Store settings & account information.',
    profile_bdetails: 'Store Details',
    profile_owner: 'Owner Name',
    profile_store: 'Store Name',
    profile_category: 'Category',
    profile_city: 'City / Location',
    profile_phone: 'Registered Mobile',
    profile_language: 'Interface Language',
    profile_change_lang: '🌐 Change Language',
    profile_logout: 'Log Out',

    // Modals
    modal_offer_title: 'Approve New Offer',
    modal_offer_sub: 'Review the promotional campaign details before making it live.',
    modal_reorder_title: 'Approve Reorder Request',
    modal_reorder_sub: 'Review low-stock items before submitting replenishment.',
    modal_approve_btn: 'Approve & Confirm',
    modal_cancel_btn: 'Cancel',
    modal_plan_title: 'Today’s Small Action Plan',
    modal_plan_sub: 'KartaAI found clear high-margin opportunities for your store.'
  },

  hindi: {
    lang_name: 'हिंदी',
    lang_badge: 'हिं',
    lang_modal_title: 'अपनी पसंदीदा भाषा चुनें',
    lang_modal_sub: 'कर्ता (KartaAI) आपकी चुनी हुई भाषा में सभी स्क्रीन, विश्लेषण और बोलकर उत्तर देगा।',
    lang_opt_en_title: 'English',
    lang_opt_en_sub: 'Professional business English',
    lang_opt_en_tag: 'स्टैंडर्ड',
    lang_opt_hi_title: 'हिंदी (Hindi)',
    lang_opt_hi_sub: 'शुद्ध, सरल और आसान हिंदी भाषा',
    lang_opt_hi_tag: 'व्यापारिक',
    lang_opt_hng_title: 'Hinglish',
    lang_opt_hng_sub: 'दैनिक बोलचाल की भाषा (हिंदी शब्दों की रोमन लिपि)',
    lang_opt_hng_tag: 'लोकप्रिय',

    // Navigation
    nav_home: 'होम',
    nav_business: 'व्यापार',
    nav_karta: 'कर्ता से पूछें',
    nav_offers: 'ऑफ़र्स',
    nav_profile: 'प्रोफ़ाइल',
    nav_chat_history: 'चैट इतिहास',

    // Welcome Screen
    welcome_eyebrow: '✦ रोज़ाना व्यापार के लिए आपका स्मार्ट साथी',
    welcome_h1_1: 'आप पूछें।',
    welcome_h1_2: 'KartaAI संभालेगा।',
    welcome_copy: 'अपनी बिक्री समझने, स्टॉक जांचने और दुकान को आगे बढ़ाने का सबसे आसान साधन — हिंदी, इंग्लिश या हिंग्लिश में।',
    welcome_create_acc: 'खाता बनाएं',
    welcome_login: 'लॉगिन करें',
    welcome_demo: 'डेमो देखें',
    welcome_trust: 'व्यस्त दुकानदारों के लिए बना। पहले ही सवाल से बेहद आसान।',
    welcome_sales_pill: '↗ बिक्री में 12.4% की बढ़त',
    welcome_offer_pill: '✓ ऑफ़र जारी हुआ',
    welcome_preview_sales: 'आज की कुल बिक्री',
    welcome_preview_growth: '↑ कल से 12.4% ज़्यादा',
    welcome_preview_q: '“मेरी बिक्री कम है। मदद करें।”',
    welcome_preview_a: 'मुझे एक अवसर मिला है। चलिए एक ऑफ़र बनाते हैं।',

    // Auth Screen
    auth_step_business: 'चरण 2 / 2 · आपकी दुकान',
    auth_onboard_title: 'दुकान की बुनियादी जानकारी दें',
    auth_onboard_sub: 'KartaAI को आपके व्यापार के अनुसार तैयार करने के लिए बस इतना ही चाहिए।',
    auth_label_name: 'आपका नाम',
    auth_placeholder_name: 'उदा. आशा सिंह',
    auth_label_bname: 'दुकान / व्यापार का नाम',
    auth_placeholder_bname: 'उदा. आशा जनरल स्टोर',
    auth_label_btype: 'व्यापार का प्रकार',
    auth_label_loc: 'शहर / इलाका',
    auth_placeholder_loc: 'उदा. ग्रेटर नोएडा',
    auth_label_email: 'ईमेल (वैकल्पिक)',
    auth_start_btn: 'KartaAI शुरू करें',
    auth_login_btn: 'लॉगिन',
    auth_welcome_back: 'पुनः स्वागत है',
    auth_create_acc_title: 'अपना खाता बनाएं',
    auth_enter_otp: 'अपना OTP दर्ज करें',
    auth_otp_sent_to: 'हमने 4 अंकों का कोड भेजा है:',
    auth_signup_sub: 'अपने मोबाइल नंबर से शुरू करें। दुकान की जानकारी इसके बाद जोड़ें।',
    auth_login_sub: 'आगे बढ़ने के लिए अपना मोबाइल नंबर दर्ज करें।',
    auth_otp_label: 'वन-टाइम पासवर्ड (OTP)',
    auth_otp_placeholder: '4 अंकों का OTP दर्ज करें',
    auth_verify_continue: 'सत्यापित करें और आगे बढ़ें',
    auth_resend_otp: 'दोबारा OTP भेजें',
    auth_otp_real_note: 'OTP आपके असली मोबाइल नंबर पर MSG91 द्वारा भेजा जाता है।',
    auth_mobile_label: 'मोबाइल नंबर',
    auth_mobile_placeholder: '10 अंकों का मोबाइल नंबर डालें',
    auth_send_otp_btn: 'OTP भेजें',
    auth_sms_note: 'हम आपके भारतीय मोबाइल नंबर पर एक असली OTP भेजेंगे।',

    // Home Screen
    home_good_morning: 'सुप्रभात',
    home_demo_badge: '● डेमो स्टोर',
    home_ask_title: 'KartaAI से पूछें',
    home_ask_sub: 'आप क्या जानना या करना चाहते हैं?',
    home_ask_placeholder: 'बिक्री, स्टॉक या ऑफ़र के बारे में पूछें या माइक दबाएं...',
    home_ask_btn: 'पूछें',
    home_try_asking: 'यह पूछकर देखें',
    home_tap_question: 'सवाल पर टैप करें या माइक से बोलें',
    home_kicker_focus: 'आज का मुख्य लक्ष्य',
    home_momentum_sub: 'आज आपकी कमाई बढ़ाने के लिए एक तैयार स्मार्ट एक्शन।',
    home_view_plan: '✦ आज की छोटी कार्य योजना देखें',
    home_todays_sales: 'आज की बिक्री',
    home_orders: 'कुल ऑर्डर',
    home_customers: 'ग्राहक',
    home_growth: 'बढ़ोतरी',
    home_recent_activity: 'ताज़ा हलचल',
    home_low_stock_notice: 'सामानों का स्टॉक कम है',

    // Business Screen
    biz_sales_trend: '30 दिनों की बिक्री का रुझान',
    biz_sales_trend_sub: 'दैनिक प्रदर्शन का लेखा-जोखा',
    biz_inventory_title: 'स्टॉक और इन्वेंट्री की स्थिति',
    biz_inventory_sub: 'दुकान में उपलब्ध सामान',
    biz_healthy: 'सही स्टॉक',
    biz_low_stock: 'कम स्टॉक',
    biz_critical: 'गंभीर',
    biz_reorder_level: 'रीऑर्डर स्तर',
    biz_in_stock: 'स्टॉक में',

    // Assistant / Karta Screen
    assistant_page_title: 'KartaAI से पूछें',
    assistant_page_sub: 'अपनी ज़रूरत बताएं, या माइक से बोलकर पूछें।',
    assistant_here_to_help: 'सहायता के लिए तैयार:',
    assistant_input_placeholder: 'अपनी दुकान के बारे में पूछें या माइक से बोलें...',
    assistant_quick_title: 'त्वरित सवाल',
    assistant_source_note: 'आपकी असली दुकान का डेटा पहले जाँचा जाता है। बाज़ार की जानकारी अलग रखी जाती है।',
    assistant_speech_listening: 'सुन रहे हैं... कृपया बोलिए',
    assistant_speech_unsupported: 'आपके ब्राउज़र में माइक वॉयस रिकॉग्निशन समर्थित नहीं है।',
    assistant_voice_readout: 'बोलकर सुनें',
    assistant_voice_stop: 'रोकें',
    assistant_voice_on: 'आवाज़: चालू',
    assistant_voice_off: 'आवाज़: बंद',

    // Offers Screen
    offers_page_title: 'विशेष ऑफ़र्स',
    offers_page_sub: 'ग्राहकों को आकर्षित करें और धीमा स्टॉक तेज़ी से निकालें।',
    offers_create_btn: '+ नया ऑफ़र बनाएं',
    offers_tab_all: 'सभी',
    offers_tab_active: 'सक्रिय',
    offers_tab_scheduled: 'निर्धारित',
    offers_tab_expired: 'समाप्त',
    offers_publish_btn: 'ऑफ़र चालू करें',

    // Profile Screen
    profile_page_title: 'दुकानदार प्रोफ़ाइल',
    profile_page_sub: 'दुकान की सेटिंग और खाता विवरण।',
    profile_bdetails: 'दुकान का विवरण',
    profile_owner: 'दुकानदार का नाम',
    profile_store: 'दुकान का नाम',
    profile_category: 'श्रेणी',
    profile_city: 'शहर / इलाका',
    profile_phone: 'पंजीकृत मोबाइल',
    profile_language: 'वेबसाइट की भाषा',
    profile_change_lang: '🌐 भाषा बदलें',
    profile_logout: 'लॉग आउट',

    // Modals
    modal_offer_title: 'नए ऑफ़र को मंज़ूरी दें',
    modal_offer_sub: 'ऑफ़र लाइव करने से पहले विवरण की पुष्टि करें।',
    modal_reorder_title: 'सामान मंगाने (रीऑर्डर) को मंज़ूरी दें',
    modal_reorder_sub: 'कम स्टॉक वाले सामान सप्लायर को भेजने से पहले जाँच लें।',
    modal_approve_btn: 'मंज़ूर करें और पुष्टि करें',
    modal_cancel_btn: 'रद्द करें',
    modal_plan_title: 'आज की स्मार्ट कार्य योजना',
    modal_plan_sub: 'KartaAI ने आपकी दुकान में मुनाफ़ा बढ़ाने के स्पष्ट अवसर ढूँढे हैं।'
  },

  hinglish: {
    lang_name: 'Hinglish',
    lang_badge: 'Hing',
    lang_modal_title: 'Apni preferred language choose karein',
    lang_modal_sub: 'KartaAI aapki selected language mein screens, insights aur voice output provide karega.',
    lang_opt_en_title: 'English',
    lang_opt_en_sub: 'Professional business English',
    lang_opt_en_tag: 'Standard',
    lang_opt_hi_title: 'हिंदी (Hindi)',
    lang_opt_hi_sub: 'Shuddh aur aasan Hindi bhasha',
    lang_opt_hi_tag: 'Vyaparik',
    lang_opt_hng_title: 'Hinglish',
    lang_opt_hng_sub: 'Daily bolchal ki business language (Hindi in English)',
    lang_opt_hng_tag: 'Top Pick',

    // Navigation
    nav_home: 'Home',
    nav_business: 'Business',
    nav_karta: 'Ask Karta',
    nav_offers: 'Offers',
    nav_profile: 'Profile',

    // Welcome Screen
    welcome_eyebrow: '✦ Daily business ke liye aapka smart teammate',
    welcome_h1_1: 'Aap pucho.',
    welcome_h1_2: 'KartaAI sambhal lega.',
    welcome_copy: 'Apni sales samajhne, stock check karne aur business grow karne ka sabse simple platform — English, Hindi ya Hinglish mein.',
    welcome_create_acc: 'Account Banayein',
    welcome_login: 'Login Karein',
    welcome_demo: 'Demo Dekhein',
    welcome_trust: 'Busy dukaandaron ke liye banaya gaya. Pehle sawal se simple.',
    welcome_sales_pill: '↗ Sales 12.4% up hai',
    welcome_offer_pill: '✓ Offer publish ho gaya',
    welcome_preview_sales: 'Aaj ki sales',
    welcome_preview_growth: '↑ 12.4% kal ke mukable',
    welcome_preview_q: '“Meri sales down hain. Help me.”',
    welcome_preview_a: 'Mujhe ek opportunity mili hai. Chaliye ek offer banate hain.',

    // Auth Screen
    auth_step_business: 'Step 2 of 2 · Aapka Business',
    auth_onboard_title: 'Dukaan ki basic details dein',
    auth_onboard_sub: 'KartaAI ko personalize karne ke liye bas itna hi chahiye.',
    auth_label_name: 'Aapka Naam',
    auth_placeholder_name: 'e.g. Asha Singh',
    auth_label_bname: 'Business ka Naam',
    auth_placeholder_bname: 'e.g. Asha General Store',
    auth_label_btype: 'Business Type',
    auth_label_loc: 'City / Location',
    auth_placeholder_loc: 'e.g. Greater Noida',
    auth_label_email: 'Email (optional)',
    auth_start_btn: 'KartaAI ke saath shuru karein',
    auth_login_btn: 'Login',
    auth_welcome_back: 'Welcome back',
    auth_create_acc_title: 'Apna account banayein',
    auth_enter_otp: 'Apna OTP dalein',
    auth_otp_sent_to: 'Humne 4-digit code is number par bheja hai:',
    auth_signup_sub: 'Apne mobile number se start karein. Business details aage add karein.',
    auth_login_sub: 'Continue karne ke liye mobile number enter karein.',
    auth_otp_label: 'One-Time Password (OTP)',
    auth_otp_placeholder: '4-digit OTP enter karein',
    auth_verify_continue: 'Verify & continue karein',
    auth_resend_otp: 'Resend OTP',
    auth_otp_real_note: 'OTP aapke real mobile number par MSG91 ke through bheja jaata hai.',
    auth_mobile_label: 'Mobile Number',
    auth_mobile_placeholder: '10-digit mobile number dalein',
    auth_send_otp_btn: 'OTP Bhejo',
    auth_sms_note: 'Hum aapke Indian mobile number par real OTP bhejenge.',

    // Home Screen
    home_good_morning: 'Good morning',
    home_demo_badge: '● Demo Store',
    home_ask_title: 'KartaAI se pucho',
    home_ask_sub: 'Aap kya check ya manage karna chahte hain?',
    home_ask_placeholder: 'Sales, stock, offers ke baare mein pucho ya mic dabao...',
    home_ask_btn: 'Pucho',
    home_try_asking: 'Yeh puch kar dekhein',
    home_tap_question: 'Question par tap karein ya mic se bolen',
    home_kicker_focus: 'Aaj ka Main Focus',
    home_momentum_sub: 'Aaj ki revenue boost karne ke liye smart plan ready hai.',
    home_view_plan: '✦ Aaj ka chhota action plan dekhein',
    home_todays_sales: 'Aaj ki sales',
    home_orders: 'Orders',
    home_customers: 'Customers',
    home_growth: 'Growth',
    home_recent_activity: 'Recent activity',
    home_low_stock_notice: 'products ka stock low hai',

    // Business Screen
    biz_sales_trend: '30-Day Revenue Trend',
    biz_sales_trend_sub: 'Daily performance tracking',
    biz_inventory_title: 'Inventory & Stock Status',
    biz_inventory_sub: 'Dukaan mein available items',
    biz_healthy: 'Healthy Stock',
    biz_low_stock: 'Low Stock',
    biz_critical: 'Critical',
    biz_reorder_level: 'Reorder Level',
    biz_in_stock: 'In Stock',

    // Assistant / Karta Screen
    assistant_page_title: 'Ask KartaAI',
    assistant_page_sub: 'Jo chahiye batayein, ya mic se bolkar pucho.',
    assistant_here_to_help: 'Help karne ke liye ready:',
    assistant_input_placeholder: 'Business ke baare mein pucho ya mic use karein...',
    assistant_quick_title: 'Quick questions',
    assistant_source_note: 'Aapka real store data pehle check hota hai. Market questions separate rehte hain.',
    assistant_speech_listening: 'Listening... abhi boliye',
    assistant_speech_unsupported: 'Aapke browser mein microphone speech recognition available nahi hai.',
    assistant_voice_readout: 'Sunein',
    assistant_voice_stop: 'Roko',
    assistant_voice_on: 'Voice: ON',
    assistant_voice_off: 'Voice: MUTE',

    // Offers Screen
    offers_page_title: 'Special Offers',
    offers_page_sub: 'Customers attract karein aur slow inventory clear karein.',
    offers_create_btn: '+ Naya Offer Banayein',
    offers_tab_all: 'All',
    offers_tab_active: 'Active',
    offers_tab_scheduled: 'Scheduled',
    offers_tab_expired: 'Expired',
    offers_publish_btn: 'Publish Offer',

    // Profile Screen
    profile_page_title: 'Merchant Profile',
    profile_page_sub: 'Store settings aur account details.',
    profile_bdetails: 'Store Details',
    profile_owner: 'Owner Name',
    profile_store: 'Store Name',
    profile_category: 'Category',
    profile_city: 'City / Location',
    profile_phone: 'Registered Mobile',
    profile_language: 'Website Language',
    profile_change_lang: '🌐 Language Badlein',
    profile_logout: 'Log Out',

    // Modals
    modal_offer_title: 'Naye Offer ko Approve Karein',
    modal_offer_sub: 'Campaign ko live karne se pehle details confirm karein.',
    modal_reorder_title: 'Reorder Request Approve Karein',
    modal_reorder_sub: 'Low-stock items distributor ko send karne se pehle check karein.',
    modal_approve_btn: 'Approve & Confirm',
    modal_cancel_btn: 'Cancel',
    modal_plan_title: 'Aaj ka Smart Action Plan',
    modal_plan_sub: 'KartaAI ne aapki dukaan ke liye high-margin growth plan banaya hai.'
  }
};

const savedLang = localStorage.getItem('kartaai-lang');

const state = {
  screen: 'welcome',
  page: 'home',
  merchantId: null,
  language: savedLang || 'english',
  showLanguageModal: !savedLang, // Popup on startup if language is not set
  voiceEnabled: true,
  isListening: false,
  currentlySpeaking: null,
  authStep: 'mobile',
  authMode: 'login',
  loginNumber: '',
  verificationId: '',
  msg91AccessToken: '',
  messages: [],
  currentChatId: null,
  chatList: [],
  chatHistoryLoading: false,
  paymentPage: 1,
  paymentSearch: '',
  paymentStatus: 'All',
  paymentFrom: '',
  paymentTo: '',
  paymentData: null,
  paymentLoading: false,
  modal: null,
  toast: '',
  offerFilter: 'All'
};

const t = (key) =>
  I18N[state.language]?.[key] || I18N.english[key] || key;

/* =====================================================
   VOICE: SPEECH RECOGNITION (STT) & SYNTHESIS (TTS)
===================================================== */

let activeRecognition = null;

function toggleSpeechRecognition(targetInputId) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    state.toast = t('assistant_speech_unsupported');
    render();
    return;
  }

  if (state.isListening && activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (_) {}
    state.isListening = false;
    render();
    return;
  }

  try {
    const recognition = new SpeechRecognition();
    activeRecognition = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;

    // Set recognition language
    recognition.lang =
      state.language === 'hindi'
        ? 'hi-IN'
        : state.language === 'hinglish'
        ? 'hi-IN'
        : 'en-IN';

    recognition.onstart = () => {
      state.isListening = true;
      render();
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const input = document.getElementById(targetInputId);
      if (input && transcript) {
        input.value = transcript;
      }
      if (event.results[0].isFinal) {
        state.isListening = false;
        render();
        if (transcript.trim().length > 1) {
          ask(transcript.trim());
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      state.isListening = false;
      if (event.error !== 'no-speech') {
        state.toast = `Voice error: ${event.error}`;
      }
      render();
    };

    recognition.onend = () => {
      state.isListening = false;
      activeRecognition = null;
      render();
    };

    recognition.start();
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    state.isListening = false;
    state.toast = t('assistant_speech_unsupported');
    render();
  }
}

function cleanTextForSpeech(htmlOrText) {
  return String(htmlOrText || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/₹/g, 'Rupees ')
    .replace(/[#*✦]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function speakText(text) {
  if (!window.speechSynthesis || !state.voiceEnabled) return;

  try {
    window.speechSynthesis.cancel();
    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);

    const isHindi = state.language === 'hindi' || state.language === 'hinglish';
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';

    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(
      (v) =>
        (isHindi && (v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india'))) ||
        (!isHindi && (v.lang.includes('en-IN') || v.name.toLowerCase().includes('india') || v.lang.includes('en')))
    );
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    state.currentlySpeaking = clean.slice(0, 40);

    utterance.onend = () => {
      state.currentlySpeaking = null;
      render();
    };
    utterance.onerror = () => {
      state.currentlySpeaking = null;
      render();
    };

    window.speechSynthesis.speak(utterance);
    render();
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  state.currentlySpeaking = null;
  render();
}

/* =====================================================
   LANGUAGE MODAL & SELECTOR HTML
===================================================== */

function languageModalHTML() {
  if (!state.showLanguageModal) return '';

  return `
  <div class="lang-modal-overlay" data-action="close-lang-backdrop">
    <div class="lang-modal" onclick="event.stopPropagation()">
      <div style="display:flex;justify-content:flex-end;margin-top:-10px;margin-bottom:6px;">
        <button type="button" class="close-lang-btn" data-action="close-lang-modal" style="background:none;border:none;font-size:22px;cursor:pointer;color:#788ea6;padding:4px 8px;line-height:1;" title="Close / बंद करें">✕</button>
      </div>
      <div class="lang-modal-icon">🌐</div>
      <h2>${escapeHTML(t('lang_modal_title'))}</h2>
      <p>${escapeHTML(t('lang_modal_sub'))}</p>
      <div class="lang-card-grid">
        <div class="lang-card ${state.language === 'english' ? 'active' : ''}" data-action="select-lang" data-lang="english">
          <div class="lang-glyph">Aa</div>
          <div class="lang-details">
            <strong>${escapeHTML(t('lang_opt_en_title'))}</strong>
            <small>${escapeHTML(t('lang_opt_en_sub'))}</small>
          </div>
          <span class="lang-tag">${escapeHTML(t('lang_opt_en_tag'))}</span>
        </div>

        <div class="lang-card ${state.language === 'hindi' ? 'active' : ''}" data-action="select-lang" data-lang="hindi">
          <div class="lang-glyph">अ</div>
          <div class="lang-details">
            <strong>${escapeHTML(t('lang_opt_hi_title'))}</strong>
            <small>${escapeHTML(t('lang_opt_hi_sub'))}</small>
          </div>
          <span class="lang-tag">${escapeHTML(t('lang_opt_hi_tag'))}</span>
        </div>

        <div class="lang-card ${state.language === 'hinglish' ? 'active' : ''}" data-action="select-lang" data-lang="hinglish">
          <div class="lang-glyph">H+E</div>
          <div class="lang-details">
            <strong>${escapeHTML(t('lang_opt_hng_title'))}</strong>
            <small>${escapeHTML(t('lang_opt_hng_sub'))}</small>
          </div>
          <span class="lang-tag">${escapeHTML(t('lang_opt_hng_tag'))}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function languageButtonHTML() {
  const current =
    state.language === 'hindi'
      ? '🇮🇳 हिंदी'
      : state.language === 'hinglish'
      ? '🇮🇳 Hinglish'
      : '🌐 English';

  return `
    <button class="lang-selector-btn" data-action="open-lang-modal" title="Change Language / भाषा बदलें">
      <span>${current}</span>
      <small style="opacity:0.7">▾</small>
    </button>
  `;
}

const persist = () =>
  localStorage.setItem(
    'kartaai-demo-v1',
    JSON.stringify(merchants)
  );

const merchant = () =>
  merchants.find(
    (item) => item.id === state.merchantId
  );

const momentumFor = (m = merchant()) => {
  if (!m) return null;

  if (!m.momentum) {
    m.momentum = {
      status: 'Ready',
      offerId: null,
      verifiedAt: null
    };
  }

  return m.momentum;
};

/* API-backed services. Secrets stay on the server. */
const API_BASE =
  window.KARTA_API_BASE || '/api';

async function api(path, options = {}) {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options,
      body:
        options.body &&
        typeof options.body !== 'string'
          ? JSON.stringify(options.body)
          : options.body
    }
  );

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        `API request failed (${response.status})`
    );
  }

  return data;
}

/* =========================
   MSG91 OTP
========================= */

let msg91ConfigPromise = null;
let msg91WidgetReady = false;
let msg91ReqId = null;

async function getMsg91Config() {
  if (!msg91ConfigPromise) {
    msg91ConfigPromise = api('/config');
  }

  return msg91ConfigPromise;
}

function extractAccessToken(value) {
  const looksLikeToken = (candidate) =>
    typeof candidate === 'string' &&
    candidate.trim().length > 20;

  if (looksLikeToken(value)) {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  /*
    MSG91 currently returns the JWT in the
    "message" field.
  */
  if (looksLikeToken(value.message)) {
    return value.message.trim();
  }

  const wanted = new Set([
    'access_token',
    'access-token',
    'accessToken',
    'token',
    'jwt',
    'message'
  ]);

  const walk = (node, depth = 0) => {
    if (
      !node ||
      typeof node !== 'object' ||
      depth > 8
    ) {
      return '';
    }

    for (const [key, val] of Object.entries(node)) {
      if (
        wanted.has(key) &&
        looksLikeToken(val)
      ) {
        return val.trim();
      }

      if (
        val &&
        typeof val === 'object'
      ) {
        const nested = walk(
          val,
          depth + 1
        );

        if (nested) {
          return nested;
        }
      }
    }

    return '';
  };

  return walk(value);
}

async function ensureMsg91Widget() {
  if (
    msg91WidgetReady &&
    typeof window.sendOtp === 'function' &&
    typeof window.verifyOtp === 'function'
  ) {
    return true;
  }

  const config =
    await getMsg91Config();

  if (
    !config?.msg91?.widgetId ||
    !config?.msg91?.tokenAuth
  ) {
    throw new Error(
      'MSG91 Widget ID/Token is missing.'
    );
  }

  if (!window.__kartaMsg91ScriptPromise) {
    window.__kartaMsg91ScriptPromise =
      new Promise((resolve, reject) => {
        const script =
          document.createElement('script');

        script.src =
          'https://verify.msg91.com/otp-provider.js';

        script.async = true;

        script.onload = () => {
          try {
            if (
              typeof window.initSendOTP !==
              'function'
            ) {
              throw new Error(
                'MSG91 initSendOTP function was not found.'
              );
            }

            window.initSendOTP({
              widgetId:
                config.msg91.widgetId,

              tokenAuth:
                config.msg91.tokenAuth,

              exposeMethods: true,

              success: (data) => {
                console.log(
                  'MSG91 widget success:',
                  data
                );
              },

              failure: (error) => {
                console.error(
                  'MSG91 widget failure:',
                  error
                );
              }
            });

            resolve();
          } catch (error) {
            reject(error);
          }
        };

        script.onerror = () => {
          reject(
            new Error(
              'Could not load MSG91 OTP service.'
            )
          );
        };

        document.head.appendChild(script);
      });
  }

  await window.__kartaMsg91ScriptPromise;

  /*
    MSG91 exposes the functions asynchronously.
    Wait up to 5 seconds.
  */
  for (let i = 0; i < 50; i++) {
    if (
      typeof window.sendOtp ===
        'function' &&
      typeof window.verifyOtp ===
        'function'
    ) {
      msg91WidgetReady = true;
      return true;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 100)
    );
  }

  throw new Error(
    'MSG91 loaded, but OTP methods were not exposed.'
  );
}

async function sendMsg91Otp(mobile) {
  await ensureMsg91Widget();

  if (
    typeof window.sendOtp !==
    'function'
  ) {
    throw new Error(
      'MSG91 sendOtp is not available.'
    );
  }

  return new Promise(
    (resolve, reject) => {
      window.sendOtp(
        `91${mobile}`,

        (data) => {
          msg91ReqId =
            data?.reqId ||
            data?.reqID ||
            data?.requestId ||
            data?.requestID ||
            data?.data?.reqId ||
            data?.data?.reqID ||
            data?.data?.requestId ||
            null;

          console.log(
            'MSG91 OTP SENT:',
            {
              hasReqId:
                !!msg91ReqId
            }
          );

          resolve(data);
        },

        (error) => {
          console.error(
            'MSG91 OTP ERROR:',
            error
          );

          reject(
            new Error(
              typeof error === 'string'
                ? error
                : error?.message ||
                    'MSG91 could not send OTP.'
            )
          );
        }
      );
    }
  );
}

async function verifyMsg91Otp(otp) {
  await ensureMsg91Widget();

  if (
    typeof window.verifyOtp !==
    'function'
  ) {
    throw new Error(
      'MSG91 loaded, but verifyOtp was not exposed.'
    );
  }

  return new Promise(
    (resolve, reject) => {
      let settled = false;

      const finishSuccess = (data) => {
        if (settled) return;

        settled = true;

        console.log(
          'MSG91 VERIFY SUCCESS:',
          {
            type: typeof data,
            keys:
              data &&
              typeof data === 'object'
                ? Object.keys(data)
                : []
          }
        );

        resolve(data);
      };

      const finishFailure = (error) => {
        if (settled) return;

        settled = true;

        console.error(
          'MSG91 VERIFY ERROR:',
          error
        );

        reject(
          new Error(
            typeof error === 'string'
              ? error
              : error?.message ||
                  'MSG91 OTP verification failed.'
          )
        );
      };

      window.verifyOtp(
        otp,
        finishSuccess,
        finishFailure,
        msg91ReqId || undefined
      );

      /*
        MSG91 normally returns the JWT quickly.
        Give it 5 seconds before failing.
      */
      setTimeout(() => {
        if (!settled) {
          finishFailure(
            new Error(
              'MSG91 OTP was verified, but no access token was returned.'
            )
          );
        }
      }, 5000);
    }
  );
}

/* =========================
   SERVICES
========================= */

const merchantService = {
  getCurrentMerchant: () =>
    merchant(),

  verifyMsg91: (
    accessToken,
    mobile,
    purpose
  ) =>
    api('/auth/verify-msg91', {
      method: 'POST',
      body: {
        accessToken,
        mobile,
        purpose
      }
    }),

  createMerchant: (payload) =>
    api('/merchants', {
      method: 'POST',
      body: payload
    })
};

const salesService = {
  getTodaySales: () =>
    merchant()?.today || {
      sales: 0,
      orders: 0,
      customers: 0,
      growth: 0
    },

  getSalesHistory: () =>
    merchant()?.salesHistory || []
};

const inventoryService = {
  getLowStockProducts: () =>
    merchant()?.products?.filter(
      (item) =>
        item.stock <= item.reorderLevel
    ) || [],

  createReorderRequest: async (
    items
  ) => {
    const m = merchant();

    if (!m) {
      throw new Error(
        'No merchant is signed in.'
      );
    }

    return api('/reorders', {
      method: 'POST',
      body: {
        merchantId: m.id,
        productIds: items.map(
          (item) => item.id
        )
      }
    });
  }
};

const productService = {
  getProducts: () =>
    merchant()?.products || [],

  getBestSellingProducts: () =>
    [
      ...(merchant()?.products || [])
    ].sort(
      (a, b) => b.units - a.units
    ),

  getSlowMovingProducts: () =>
    (
      merchant()?.products || []
    ).filter(
      (item) => item.growth < 0
    )
};

const orderService = {
  getOrders: () =>
    merchant()?.orders || []
};

const customerService = {
  getCustomers: () =>
    merchant()?.customers || []
};

const offerService = {
  getOffers: () =>
    merchant()?.offers || [],

  createOffer: async (offer) => {
    const m = merchant();

    if (!m) {
      throw new Error(
        'No merchant is signed in.'
      );
    }

    const created =
      await api('/offers', {
        method: 'POST',
        body: {
          merchantId: m.id,
          ...offer
        }
      });

    if (!Array.isArray(m.offers)) {
      m.offers = [];
    }

    m.offers.unshift(created);

    addActivity(
      `Created ${created.name}`
    );

    persist();

    return created;
  },

  publishOffer: async (id) => {
    const m = merchant();

    if (!m) {
      throw new Error(
        'No merchant is signed in.'
      );
    }

    const offer =
      await api(
        `/offers/${encodeURIComponent(id)}/publish`,
        {
          method: 'POST',
          body: {
            merchantId: m.id
          }
        }
      );

    const local =
      m.offers?.find(
        (item) => item.id === id
      );

    if (local) {
      Object.assign(
        local,
        offer
      );
    }

    addActivity(
      `Published ${offer.name}`
    );

    persist();

    return local || offer;
  }
};

const analyticsService = {
  getBusinessInsights: () =>
    merchant()?.insight ||
    'Your strongest opportunity is to move slow beverage stock before evening.'
};

const marketSearchService = {
  searchMarketInformation:
    async () => {
      const m = merchant();

      if (!m) {
        throw new Error(
          'No merchant is currently signed in.'
        );
      }

      return api(
        `/market/edible-oils?merchantId=${encodeURIComponent(
          m.id
        )}`
      );
    }
};

async function refreshMerchantFromAPI() {
  if (!state.merchantId) {
    return;
  }

  try {
    const data =
      await api(
        `/merchants/${encodeURIComponent(
          state.merchantId
        )}`
      );

    const index =
      merchants.findIndex(
        (item) =>
          item.id ===
          state.merchantId
      );

    if (index >= 0) {
      merchants[index] = {
        ...merchants[index],
        ...data
      };
    } else {
      merchants.push(data);
    }

    persist();
  } catch (error) {
    console.warn(
      'API refresh failed; using local fallback:',
      error.message
    );
  }
}

function addActivity(text) {
  const m = merchant();

  if (!m) return;

  if (!Array.isArray(m.activity)) {
    m.activity = [];
  }

  m.activity.unshift({
    text,
    time: 'Just now',
    status: 'Done'
  });

  persist();

  api('/activity', {
    method: 'POST',
    body: {
      merchantId: m.id,
      text
    }
  }).catch((error) =>
    console.warn(
      'Activity API failed:',
      error.message
    )
  );
}

function productStatus(item) {
  if (item.stock === 0) {
    return 'Out of Stock';
  }

  if (
    item.stock <=
    Math.ceil(
      item.reorderLevel * 0.55
    )
  ) {
    return 'Critical';
  }

  if (
    item.stock <=
    item.reorderLevel
  ) {
    return 'Low';
  }

  return 'Healthy';
}

function statusClass(status) {
  return String(status)
    .toLowerCase()
    .replace(/\s+/g, '');
}
function assistantHTMLFromText(text) {
  const safe = escapeHTML(String(text || '').trim());
  return safe ? `<p>${safe.replace(/\n/g, '</p><p>')}</p>` : '';
}

async function createNewChat(options = {}) {
  const m = merchant();

  if (!m) {
    state.toast = 'Please sign in first.';
    render();
    return null;
  }

  try {
    const chat = await api('/chats', {
      method: 'POST',
      body: {
        merchantId: m.id,
        title: options.title || 'New Chat'
      }
    });

    state.currentChatId = chat.id;
    state.messages = [initialMessage()];
    state.page = 'karta';
    state.chatList = [
      chat,
      ...state.chatList.filter((item) => item.id !== chat.id)
    ];

    render();

    requestAnimationFrame(() => {
      const box = $('#messages');
      if (box) box.scrollTop = box.scrollHeight;
    });

    return chat;
  } catch (error) {
    console.warn('New chat failed:', error);
    state.toast = error.message || 'Could not create a new chat.';
    render();
    return null;
  }
}

async function loadChatHistory(options = {}) {
  const m = merchant();

  if (!m) return [];

  state.chatHistoryLoading = true;

  try {
    const result = await api(
      `/chats?merchantId=${encodeURIComponent(m.id)}`
    );

    state.chatList = Array.isArray(result?.chats)
      ? result.chats
      : [];

    return state.chatList;
  } catch (error) {
    console.warn('Chat history load failed:', error);
    state.toast = error.message || 'Could not load chat history.';
    return [];
  } finally {
    state.chatHistoryLoading = false;
    if (options.render !== false) render();
  }
}

async function openChat(chatId) {
  const m = merchant();
  if (!m || !chatId) return;

  try {
    const result = await api(
      `/chats/${encodeURIComponent(chatId)}/messages?merchantId=${encodeURIComponent(m.id)}`
    );

    state.currentChatId = result.chat?.id || chatId;
    state.messages = (result.messages || []).map((message) => ({
      who: message.role === 'user' ? 'user' : 'bot',
      html:
        message.role === 'user'
          ? escapeHTML(message.content || '')
          : assistantHTMLFromText(message.content || '')
    }));

    if (!state.messages.length) {
      state.messages = [initialMessage()];
    }

    state.page = 'karta';
    render();

    requestAnimationFrame(() => {
      const box = $('#messages');
      if (box) box.scrollTop = box.scrollHeight;
    });
  } catch (error) {
    console.warn('Chat open failed:', error);
    state.toast = error.message || 'Could not open this chat.';
    render();
  }
}

async function deleteChat(chatId) {
  const m = merchant();
  if (!m || !chatId) return;

  try {
    await api(
      `/chats/${encodeURIComponent(chatId)}?merchantId=${encodeURIComponent(m.id)}`,
      { method: 'DELETE' }
    );

    state.chatList = state.chatList.filter((item) => item.id !== chatId);

    if (state.currentChatId === chatId) {
      state.currentChatId = null;
      state.messages = [];
    }

    state.toast = 'Chat deleted.';
    await loadChatHistory({ render: false });
    render();
  } catch (error) {
    console.warn('Chat delete failed:', error);
    state.toast = error.message || 'Could not delete this chat.';
    render();
  }
}

async function clearChatHistory() {
  const m = merchant();
  if (!m) return;

  try {
    await api(
      `/chats?merchantId=${encodeURIComponent(m.id)}`,
      { method: 'DELETE' }
    );

    state.chatList = [];
    state.currentChatId = null;
    state.messages = [];
    state.toast = 'Chat history cleared.';
    render();
  } catch (error) {
    console.warn('Chat history clear failed:', error);
    state.toast = error.message || 'Could not clear chat history.';
    render();
  }
}

function chatHistoryPage() {
  const history = state.chatList || [];

  return shell(`
    <section class="page-heading">
      <div>
        <h1>Chat History</h1>
        <p>Your saved conversations with KartaAI.</p>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="secondary" data-action="new-chat">
          ＋ New Chat
        </button>
        ${
          history.length
            ? `<button class="secondary" data-action="clear-chat-history">
                Clear History
              </button>`
            : ''
        }
      </div>
    </section>

    <section class="section">
      ${
        state.chatHistoryLoading
          ? `<article class="card empty-state-card">
              <div style="font-size:36px;">⏳</div>
              <h2>Loading chats...</h2>
            </article>`
          : history.length
          ? `<div class="chat-history-grid">
              ${history.map((item) => `
                <article class="card chat-history-card">
                  <button class="chat-history-open" data-action="open-chat" data-id="${escapeHTML(item.id)}">
                    <div class="chat-history-icon">💬</div>
                    <div class="chat-history-copy">
                      <strong>${escapeHTML(item.title || 'New Chat')}</strong>
                      <span>${escapeHTML(item.preview || 'No messages yet')}</span>
                      <small>
                        ${item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}
                        · ${Number(item.messageCount || 0)} messages
                      </small>
                    </div>
                  </button>
                  <button
                    class="chat-delete-btn"
                    data-action="delete-chat"
                    data-id="${escapeHTML(item.id)}"
                    title="Delete chat"
                    aria-label="Delete chat"
                  >🗑</button>
                </article>
              `).join('')}
            </div>`
          : `
            <article class="card empty-state-card">
              <div style="font-size:44px;">💬</div>
              <h2>No chat history yet</h2>
              <p>Start a new conversation with KartaAI.</p>
              <button class="primary" data-action="new-chat">
                ＋ Start New Chat
              </button>
            </article>
          `
      }
    </section>
  `);
}

function navItems() {
  return [
    ['home', '⌂', 'Home'],
    ['business', '▣', 'Business'],
    ['karta', '✦', 'Ask KartaAI'],
    ['history', '💬', 'Chat History'],
    ['payments', '💳', 'Payment History'],
    ['offers', '🏷', 'Offers'],
    ['profile', '◉', 'Profile']
  ];
}
function navHTML(mobile = false) {
  return navItems()
    .map(
      ([page, icon, title]) =>
        `<button class="${
          mobile
            ? ''
            : 'nav-item '
        }${
          state.page === page
            ? 'active'
            : ''
        }" data-nav="${page}">
          <span class="nav-symbol">${icon}</span>
          <span>${title}</span>
        </button>`
    )
    .join('');
}

function avatarHTML(
  m,
  big = false
) {
  if (!m) return '';

  return `<span class="avatar ${
    big ? 'big' : ''
  }" aria-label="${escapeHTML(
    m.name
  )}">${escapeHTML(
    m.initials || '?'
  )}</span>`;
}

function shell(content) {
  const m = merchant();

  if (!m) {
    state.screen = 'welcome';
    return welcomeScreen();
  }

  return `<div class="screen app-shell">

    <aside class="sidebar" aria-label="Main navigation">

      <button
        class="brand"
        data-nav="home"
        aria-label="KartaAI home"
      >
        <span class="brand-mark">✦</span>
        KartaAI
      </button>

      <nav class="nav-list">
        ${navHTML()}
      </nav>

      <div class="sidebar-chat-actions">
        <button class="sidebar-new-chat" data-action="new-chat" type="button">
          <span class="sidebar-new-chat-icon">＋</span>
          <span>New Chat</span>
        </button>
      </div>

      <div class="sidebar-bottom">
        <div style="padding: 10px 12px; margin-bottom: 8px;">
          ${languageButtonHTML()}
        </div>
        <div class="merchant-tile">
          ${avatarHTML(m)}
          <div>
            <b>${escapeHTML(
              m.name
            )}</b>
            <small>${escapeHTML(
              m.businessName
            )}</small>
          </div>
        </div>
      </div>

    </aside>

    <main class="page-wrap">

      <div class="mobile-topbar">
        <button
          class="brand"
          data-nav="home"
        >
          <span class="brand-mark">✦</span>
          KartaAI
        </button>
        <div style="display:flex;align-items:center;gap:8px;">
          ${languageButtonHTML()}
          ${avatarHTML(m)}
        </div>
      </div>

      <div class="topbar">
        <span class="crumb">
          ${
            state.page === 'karta'
              ? escapeHTML(t('assistant_here_to_help')) + ' ' + escapeHTML(m.businessName)
              : escapeHTML(m.businessName)
          }
        </span>

        <div style="display:flex;align-items:center;gap:10px;">
          ${languageButtonHTML()}
        </div>
      </div>

      ${content}

    </main>

    <nav
      class="mobile-nav"
      aria-label="Main navigation"
    >
      ${navHTML(true)}
    </nav>

  </div>
  ${modalHTML()}
  ${toastHTML()}`;
}

function welcomeScreen() {
  return `<div class="screen welcome">

    <header class="welcome-nav">

      <button
        class="brand"
        data-action="start"
      >
        <span class="brand-mark">✦</span>
        KartaAI
      </button>

      <div style="display:flex;align-items:center;gap:12px;">
        ${languageButtonHTML()}
        <button
          class="text-button"
          data-action="login"
        >
          ${escapeHTML(t('welcome_login'))}
        </button>
      </div>

    </header>

    <main class="welcome-hero">

      <section>

        <span class="eyebrow">
          ${escapeHTML(t('welcome_eyebrow'))}
        </span>

        <h1>
          ${escapeHTML(t('welcome_h1_1'))}<br>
          <span>${escapeHTML(t('welcome_h1_2'))}</span>
        </h1>

        <p class="welcome-copy">
          ${escapeHTML(t('welcome_copy'))}
        </p>

        <div class="welcome-actions">

          <button
            class="primary"
            data-action="start"
          >
            ${escapeHTML(t('welcome_create_acc'))}
          </button>

          <button
            class="secondary"
            data-action="demo"
          >
            ${escapeHTML(t('welcome_demo'))}
          </button>

        </div>

        <div class="trust-row">
          <span>●</span>
          ${escapeHTML(t('welcome_trust'))}
        </div>

      </section>

      <section
        class="welcome-visual"
        aria-label="A preview of KartaAI"
      >

        <div class="dot-grid"></div>

        <div class="floating-pill top">
          ${escapeHTML(t('welcome_sales_pill'))}
        </div>

        <div class="floating-pill bottom">
          ${escapeHTML(t('welcome_offer_pill'))}
        </div>

        <div class="hero-window">

          <div class="hero-window-top">
            <i></i>
            <i></i>
            <i></i>
          </div>

          <div class="hero-card">
            <small>${escapeHTML(t('welcome_preview_sales'))}</small>
            <strong>₹18,450</strong>
            <span class="mini-change">
              ${escapeHTML(t('welcome_preview_growth'))}
            </span>
          </div>

          <div class="hero-question">
            ${escapeHTML(t('welcome_preview_q'))}
          </div>

          <div class="answer-chip">
            <span>✦</span>
            <span>
              ${escapeHTML(t('welcome_preview_a'))}
            </span>
          </div>

        </div>

      </section>

    </main>
  </div>`;
}

function authScreen() {
  const otp =
    state.authStep === 'otp';

  const onboarding =
    state.authStep === 'onboard';

  if (onboarding) {
    return `<div class="auth-wrap">

      <section class="auth-card">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <button
            class="brand"
            data-action="back-welcome"
          >
            <span class="brand-mark">✦</span>
            KartaAI
          </button>
          ${languageButtonHTML()}
        </div>

        <span class="eyebrow">
          ${escapeHTML(t('auth_step_business'))}
        </span>

        <h1 style="margin-top:14px">
          ${escapeHTML(t('auth_onboard_title'))}
        </h1>

        <p>
          ${escapeHTML(t('auth_onboard_sub'))}
        </p>

        <label
          class="field-label"
          for="merchant-name"
        >
          ${escapeHTML(t('auth_label_name'))}
        </label>

        <input
          class="field"
          id="merchant-name"
          placeholder="${escapeHTML(t('auth_placeholder_name'))}"
          autocomplete="name"
          autofocus
        />

        <label
          class="field-label"
          for="business-name"
        >
          ${escapeHTML(t('auth_label_bname'))}
        </label>

        <input
          class="field"
          id="business-name"
          placeholder="${escapeHTML(t('auth_placeholder_bname'))}"
          autocomplete="organization"
        />

        <label
          class="field-label"
          for="business-type"
        >
          ${escapeHTML(t('auth_label_btype'))}
        </label>

        <select
          class="field"
          id="business-type"
        >
          <option>
            Grocery & Daily Essentials
          </option>
          <option>
            Grocery & Household
          </option>
          <option>
            Food & Grocery
          </option>
          <option>
            Retail Store
          </option>
        </select>

        <label
          class="field-label"
          for="location"
        >
          ${escapeHTML(t('auth_label_loc'))}
        </label>

        <input
          class="field"
          id="location"
          placeholder="${escapeHTML(t('auth_placeholder_loc'))}"
          autocomplete="address-level2"
        />

        <label
          class="field-label"
          for="onboard-email"
        >
          ${escapeHTML(t('auth_label_email'))}
        </label>

        <input
          class="field"
          id="onboard-email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
        />

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button class="primary" data-action="create-account">
            ${escapeHTML(t('auth_start_btn'))}
          </button>

          <button class="secondary" data-action="login">
            ${escapeHTML(t('auth_login_btn'))}
          </button>
        </div>

      </section>

    </div>`;
  }

  return `<div class="auth-wrap">

    <section class="auth-card">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <button
          class="brand"
          data-action="back-welcome"
        >
          <span class="brand-mark">✦</span>
          KartaAI
        </button>
        ${languageButtonHTML()}
      </div>

      <h1>
        ${
          otp
            ? escapeHTML(t('auth_enter_otp'))
            : state.authMode === 'signup'
              ? escapeHTML(t('auth_create_acc_title'))
              : escapeHTML(t('auth_welcome_back'))
        }
      </h1>

      <p>
        ${
          otp
            ? `${escapeHTML(t('auth_otp_sent_to'))} ${escapeHTML(
                state.loginNumber ||
                  'your mobile'
              )}.`
            : state.authMode === 'signup'
              ? escapeHTML(t('auth_signup_sub'))
              : escapeHTML(t('auth_login_sub'))
        }
      </p>

      ${
        otp
          ? `
            <label
              class="field-label"
              for="otp"
            >
              ${escapeHTML(t('auth_otp_label'))}
            </label>

            <input
              class="field"
              id="otp"
              inputmode="numeric"
              maxlength="4"
              pattern="[0-9]*"
              placeholder="${escapeHTML(t('auth_otp_placeholder'))}"
              autocomplete="one-time-code"
              autofocus
            />

            <button
              class="primary"
              data-action="verify"
            >
              ${escapeHTML(t('auth_verify_continue'))}
            </button>

            <button
              class="secondary"
              data-action="resend-otp"
            >
              ${escapeHTML(t('auth_resend_otp'))}
            </button>

            <div class="demo-note">
              ${escapeHTML(t('auth_otp_real_note'))}
            </div>
          `
          : `
            <label
              class="field-label"
              for="mobile"
            >
              ${escapeHTML(t('auth_mobile_label'))}
            </label>

            <input
              class="field"
              id="mobile"
              inputmode="numeric"
              maxlength="10"
              pattern="[0-9]*"
              placeholder="${escapeHTML(t('auth_mobile_placeholder'))}"
              autocomplete="tel"
              autofocus
            />

            <div
              id="msg91-captcha"
              style="margin:12px 0"
            ></div>

            <button
              class="primary"
              data-action="continue-login"
            >
              ${escapeHTML(t('auth_send_otp_btn'))}
            </button>

            <div class="demo-note">
              ${escapeHTML(t('auth_sms_note'))}
            </div>
          `
      }

    </section>

  </div>${toastHTML()}`;
}

function statCard(
  label,
  value,
  sub,
  mood = ''
) {
  return `<article class="metric-card">

    <div class="metric-label">
      ${label}
    </div>

    <div class="metric-value">
      ${value}
    </div>

    <div class="metric-sub ${mood}">
      ${sub}
    </div>

  </article>`;
}

function askBanner() {
  return `<section class="ask-banner">

    <div>

      <h2>${escapeHTML(t('home_ask_title'))}</h2>

      <p>
        ${escapeHTML(t('home_ask_sub'))}
      </p>

      <form
        class="ask-form"
        data-form="home-ask"
      >

        <input
          id="home-question"
          aria-label="Ask KartaAI"
          placeholder="${escapeHTML(t('home_ask_placeholder'))}"
        />

        <button
          type="button"
          class="mic-btn ${state.isListening ? 'listening' : ''}"
          data-action="voice-mic"
          data-target="home-question"
          title="Speak your question / बोलकर पूछें"
        >
          🎤
        </button>

        <button
          class="primary"
          type="submit"
        >
          ${escapeHTML(t('home_ask_btn'))}
        </button>

      </form>

      ${
        state.isListening
          ? `<div class="voice-status-pill">
              <span class="voice-dot"></span>
              <span>${escapeHTML(t('assistant_speech_listening'))}</span>
            </div>`
          : ''
      }

    </div>

    <div
      class="ask-art"
      aria-hidden="true"
    >
      ✦
    </div>

  </section>`;
}

function momentumCard(
  compact = false
) {
  const plan = momentumFor();

  if (!plan) {
    return '';
  }

  const mStrings = {
    english: {
      readyLabel: 'One small win for today',
      readyTitle: 'Help beverages sell before evening',
      readyCopy: 'Cold Drinks and Premium Tea are slower, but you have enough stock to run a short offer.',
      readyBtn: 'See my plan',
      readyStatus: 'Ready to review',
      why1: '↓ Beverage sales need attention',
      why2: '✓ Stock is ready',
      why3: '◷ Best before evening'
    },
    hindi: {
      readyLabel: 'आज का एक छोटा फ़ायदा',
      readyTitle: 'शाम से पहले पेय पदार्थों की बिक्री बढ़ाएं',
      readyCopy: 'कोल्ड ड्रिंक्स और प्रीमियम चाय की बिक्री धीमी है, छोटा ऑफ़र चलाकर स्टॉक निकालें।',
      readyBtn: 'योजना देखें',
      readyStatus: 'समीक्षा के लिए तैयार',
      why1: '↓ पेय बिक्री पर ध्यान दें',
      why2: '✓ स्टॉक पर्याप्त है',
      why3: '◷ शाम तक उत्तम'
    },
    hinglish: {
      readyLabel: 'Aaj ka ek smart win',
      readyTitle: 'Shaam se pehle beverages clear karein',
      readyCopy: 'Cold Drinks aur Tea slow chal rahe hain, chhota offer run karke stock nikalein.',
      readyBtn: 'Plan dekhein',
      readyStatus: 'Review ke liye ready',
      why1: '↓ Beverages par dhyan dein',
      why2: '✓ Stock ready hai',
      why3: '◷ Evening tak best'
    }
  }[state.language] || {
    readyLabel: 'One small win for today',
    readyTitle: 'Help beverages sell before evening',
    readyCopy: 'Cold Drinks and Premium Tea are slower, but you have enough stock to run a short offer.',
    readyBtn: 'See my plan',
    readyStatus: 'Ready to review',
    why1: '↓ Beverage sales need attention',
    why2: '✓ Stock is ready',
    why3: '◷ Best before evening'
  };

  const stage = {
    Ready: {
      label: mStrings.readyLabel,
      title: mStrings.readyTitle,
      copy: mStrings.readyCopy,
      action: 'view-plan',
      actionLabel: mStrings.readyBtn,
      progress: 25,
      status: mStrings.readyStatus
    },

    Draft: {
      label: 'Your plan is ready',
      title:
        'Your 10% offer is waiting for you',
      copy:
        'Review the offer once more, then publish it when you are happy with it.',
      action: 'publish',
      actionLabel: 'Publish offer',
      progress: 55,
      status: 'Waiting for you'
    },

    Active: {
      label: 'Your plan is in motion',
      title: 'Your offer is live',
      copy:
        'KartaAI will check that the offer is active and visible in your business.',
      action: 'verify-plan',
      actionLabel: 'Verify it’s live',
      progress: 78,
      status: 'Checking'
    },

    Verified: {
      label: 'Plan complete',
      title:
        'Your offer is live and verified',
      copy:
        'The offer exists in your business and the action has been recorded. Sales results will appear when live order data is connected.',
      action: 'offers',
      actionLabel: 'View offers',
      progress: 100,
      status: 'Done'
    }
  }[plan.status];

  if (!stage) {
    return '';
  }

  const extra = compact
    ? ''
    : `<div class="plan-why">
        <span>${escapeHTML(mStrings.why1)}</span>
        <span>${escapeHTML(mStrings.why2)}</span>
        <span>${escapeHTML(mStrings.why3)}</span>
      </div>`;

  const target =
    stage.action === 'publish'
      ? `data-action="publish" data-id="${escapeHTML(
          plan.offerId || ''
        )}"`
      : stage.action === 'offers'
        ? 'data-nav="offers"'
        : `data-action="${stage.action}"`;

  return `<article
    class="plan-card ${
      compact ? 'compact' : ''
    }"
  >

    <div
      class="plan-icon"
      aria-hidden="true"
    >
      ✦
    </div>

    <div class="plan-content">

      <span class="plan-kicker">
        ${stage.label}
      </span>

      <h2>${stage.title}</h2>

      <p>${stage.copy}</p>

      ${extra}

    </div>

    <div class="plan-action">

      <span class="status ${statusClass(
        plan.status
      )}">
        ${stage.status}
      </span>

      <div
        class="plan-progress"
        aria-label="Plan progress"
      >
        <i
          style="width:${stage.progress}%"
        ></i>
      </div>

      <button
        class="primary"
        ${target}
      >
        ${stage.actionLabel}
      </button>

    </div>

  </article>`;
}

function activityHTML(limit = 3) {
  const m = merchant();

  if (!m) return '';

  const activity =
    Array.isArray(m.activity)
      ? m.activity
      : [];

  return activity
    .slice(0, limit)
    .map(
      (a) =>
        `<div class="activity-row">

          <span class="activity-icon">
            ✓
          </span>

          <div>
            <b>${escapeHTML(
              a.text
            )}</b>
            <small>${escapeHTML(
              a.time
            )}</small>
          </div>

          <span class="activity-status">
            ${escapeHTML(
              a.status
            )}
          </span>

        </div>`
    )
    .join('');
}

function homePage() {
  const m = merchant();

  if (!m) {
    state.screen = 'welcome';
    return welcomeScreen();
  }

  const todaySales =
    salesService.getTodaySales();

  const low =
    inventoryService.getLowStockProducts();

  return shell(`
    <section class="page-heading">

      <div>

        <h1>
          ${escapeHTML(t('home_good_morning'))},
          ${escapeHTML(
            (m.name || 'Merchant').split(' ')[0]
          )}
          <span aria-hidden="true">
            👋
          </span>
        </h1>

        <p>
          ${escapeHTML(
            m.businessName || ''
          )}
          ·
          ${escapeHTML(
            m.businessType || ''
          )}
          ·
          ${escapeHTML(
            m.location || ''
          )}
        </p>

      </div>

    </section>

    ${askBanner()}

    <section class="section">
      ${momentumCard()}
    </section>

    <section class="section">

      <div class="section-top">
        <h2>${escapeHTML(t('home_try_asking'))}</h2>
        <p>${escapeHTML(t('home_tap_question'))}</p>
      </div>

      <div class="quick-grid">

        ${(
          state.language === 'hindi'
            ? [
                ['₹', 'आज की बिक्री', 'आज की बिक्री बताओ'],
                ['▤', 'स्टॉक जांचें', 'कम स्टॉक वाले सामान दिखाओ'],
                ['★', 'बेस्ट सेलर', 'सबसे ज़्यादा बिकने वाला सामान कौन सा है?'],
                ['🏷', 'ऑफ़र बनाएं', 'धीमे सामान के लिए ऑफ़र बना दो'],
                ['↗', 'बिक्री सलाह', 'दुकान की बिक्री कैसे बढ़ाएं?']
              ]
            : state.language === 'hinglish'
            ? [
                ['₹', 'Aaj ki Sales', 'Aaj ki sales batao'],
                ['▤', 'Stock Check', 'Low stock inventory dikhao'],
                ['★', 'Best Seller', 'Best seller product kaunsa hai?'],
                ['🏷', 'Offer Banayein', 'Slow products ke liye offer bana do'],
                ['↗', 'Sales Advice', 'Meri sales down hain, kya karu?']
              ]
            : [
                ['₹', 'Today’s Sales', 'Show today’s sales'],
                ['▤', 'Check Stock', 'Inspect low stock inventory'],
                ['★', 'Best Seller', 'Which product is selling the most?'],
                ['🏷', 'Create Offer', 'Create an offer for slow items'],
                ['↗', 'Sales Advice', 'How can I grow my sales today?']
              ]
        )
          .map(
            ([icon, label, query]) =>
              `<button
                class="quick-action"
                data-query="${escapeHTML(
                  query
                )}"
              >
                <span class="quick-icon">
                  ${icon}
                </span>
                ${label}
              </button>`
          )
          .join('')}

      </div>

    </section>

    <section class="section">

      <div class="section-top">
        <h2>${escapeHTML(t('home_todays_sales'))}</h2>
        <p>${escapeHTML(t('home_momentum_sub'))}</p>
      </div>

      <div class="metric-grid">

        ${statCard(
          t('home_todays_sales'),
          money(todaySales.sales),
          `↑ ${todaySales.growth}% vs yesterday`,
          'positive'
        )}

        ${statCard(
          t('home_orders'),
          todaySales.orders,
          `${Math.max(
            0,
            todaySales.orders - 9
          )} completed`,
          'positive'
        )}

        ${statCard(
          t('home_customers'),
          todaySales.customers,
          `${m.regularCustomers || 0} returning`,
          ''
        )}

        ${statCard(
          t('biz_low_stock'),
          low.length,
          t('biz_critical'),
          'warning'
        )}

      </div>

    </section>

    <section class="section split">

      <article class="card card-pad">

        <div class="section-top">
          <h2>KartaAI suggestions</h2>

          <button
            class="link-button"
            data-nav="karta"
          >
            Ask anything
          </button>
        </div>

        <div class="suggestion-list">

          <div class="suggestion">

            <span class="suggestion-icon">
              ↗
            </span>

            <div>
              <b>
                Your mustard oil sales are up 18%.
              </b>

              <small>
                It’s your strongest oil product right now.
              </small>
            </div>

            <button
              class="small-button"
              data-query="Oil selling mein konsa section sabse zyada chal raha hai?"
            >
              View sales
            </button>

          </div>

          <div class="suggestion">

            <span class="suggestion-icon">
              ⚠
            </span>

            <div>
              <b>
                ${low.length}
                products are running low.
              </b>

              <small>
                Rice, tea and household items need attention.
              </small>
            </div>

            <button
              class="small-button"
              data-query="Which products are low?"
            >
              Check stock
            </button>

          </div>

          <div class="suggestion">

            <span class="suggestion-icon">
              🏷
            </span>

            <div>
              <b>
                Clear slow-moving stock with an offer.
              </b>

              <small>
                Cold drinks and tea are selling more slowly.
              </small>
            </div>

            <button
              class="small-button"
              data-action="offer"
            >
              Create offer
            </button>

          </div>

        </div>

      </article>

      <article class="card card-pad">

        <div class="section-top">

          <h2>Recent activity</h2>

          <button
            class="link-button"
            data-nav="karta"
          >
            View all
          </button>

        </div>

        <div class="activity-list">
          ${activityHTML(3)}
        </div>

      </article>

    </section>
  `);
}

function chartHTML() {
  const history =
    salesService
      .getSalesHistory()
      .slice(-10);

  const max =
    Math.max(
      ...history.map(
        (item) => Number(item.revenue) || 0
      ),
      1
    );

  return `
    <div
      class="bar-chart"
      aria-label="Sales trend over the last ten days"
    >
      ${history
        .map((item) => {
          const date =
            item.date instanceof Date
              ? item.date
              : new Date(item.date);

          const safeDate =
            Number.isNaN(date.getTime())
              ? new Date()
              : date;

          const revenue =
            Number(item.revenue) || 0;

          return `
            <div
              class="bar-wrap"
              title="${dateText(safeDate)}: ${money(revenue)}"
            >
              <div
                class="bar"
                style="height:${Math.round(
                  (revenue / max) * 100
                )}%"
              ></div>

              <small>
                ${safeDate.getDate()}
              </small>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}
function businessPage() {
  const m = merchant();

  if (!m) {
    state.screen = 'welcome';
    return welcomeScreen();
  }

  const products = Array.isArray(productService.getProducts())
    ? productService.getProducts()
    : [];

  /* =====================================================
     PRODUCT ANALYSIS
  ===================================================== */

  const sortedByUnits = [...products].sort(
    (a, b) => (Number(b.units) || 0) - (Number(a.units) || 0)
  );

  const sortedByRevenue = [...products].sort(
    (a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0)
  );

  const sortedByGrowth = [...products].sort(
    (a, b) => (Number(b.growth) || 0) - (Number(a.growth) || 0)
  );

  const highDemand = products
    .filter((p) => (Number(p.units) || 0) >= 50)
    .sort((a, b) => (Number(b.units) || 0) - (Number(a.units) || 0));

  const growingProducts = products
    .filter((p) => (Number(p.growth) || 0) > 0)
    .sort((a, b) => (Number(b.growth) || 0) - (Number(a.growth) || 0));

  const slowProducts = products
    .filter((p) => (Number(p.growth) || 0) < 0)
    .sort((a, b) => (Number(a.growth) || 0) - (Number(b.growth) || 0));

  const reorderProducts = products.filter(
    (p) =>
      Number(p.stock) <= Number(p.reorderLevel)
  );

  const criticalProducts = products.filter(
    (p) =>
      Number(p.stock) <= Math.max(
        3,
        Math.floor(Number(p.reorderLevel) / 2)
      )
  );

  const lowProducts = products.filter(
    (p) =>
      Number(p.stock) > 0 &&
      Number(p.stock) > Math.max(
        3,
        Math.floor(Number(p.reorderLevel) / 2)
      ) &&
      Number(p.stock) <= Number(p.reorderLevel)
  );

  const healthyProducts = products.filter(
    (p) =>
      Number(p.stock) > Number(p.reorderLevel)
  );

  const totalUnits = products.reduce(
    (sum, p) => sum + (Number(p.units) || 0),
    0
  );

  const totalRevenue = products.reduce(
    (sum, p) => sum + (Number(p.revenue) || 0),
    0
  );

  const categories = {};

  products.forEach((p) => {
    const category = p.category || 'Other';

    if (!categories[category]) {
      categories[category] = {
        name: category,
        units: 0,
        revenue: 0,
        products: 0
      };
    }

    categories[category].units += Number(p.units) || 0;
    categories[category].revenue += Number(p.revenue) || 0;
    categories[category].products += 1;
  });

  const categoryList = Object.values(categories).sort(
    (a, b) => b.revenue - a.revenue
  );

  /* =====================================================
     HELPERS
  ===================================================== */

  const demandStatus = (p) => {
    const units = Number(p.units) || 0;

    if (units >= 50) return 'High';
    if (units >= 20) return 'Medium';
    return 'Low';
  };

  const demandClass = (p) => {
    const status = demandStatus(p);

    if (status === 'High') return 'positive';
    if (status === 'Medium') return 'warning';

    return 'negative';
  };

  const stockStatus = (p) => {
    const stock = Number(p.stock) || 0;
    const reorder = Number(p.reorderLevel) || 0;

    if (stock <= Math.max(3, Math.floor(reorder / 2))) {
      return 'Critical';
    }

    if (stock <= reorder) {
      return 'Low';
    }

    return 'Healthy';
  };

  const stockClass = (p) => {
    const status = stockStatus(p);

    if (status === 'Critical') return 'negative';
    if (status === 'Low') return 'warning';

    return 'positive';
  };

  const productRow = (p) => `
    <div class="product-row">
      <div>
        <b>${escapeHTML(p.name || 'Product')}</b>
        <small>
          ${escapeHTML(p.category || 'Other')}
        </small>
      </div>

      <span>
        ${Number(p.units) || 0} units
      </span>

      <span>
        ${money(Number(p.revenue) || 0)}
      </span>

      <span class="${Number(p.growth) >= 0 ? 'positive' : 'negative'}">
        ${Number(p.growth) >= 0 ? '+' : ''}
        ${Number(p.growth) || 0}%
      </span>

      <span class="${demandClass(p)}">
        ${demandStatus(p)}
      </span>

      <span>
        ${Number(p.stock) || 0} left
      </span>

      <span class="status ${stockClass(p)}">
        ${stockStatus(p)}
      </span>
    </div>
  `;

  /* =====================================================
     PAGE
  ===================================================== */

  return shell(`

    <!-- =================================================
         PAGE HEADER
    ================================================== -->

    <section class="page-heading">

      <div>
        <div class="eyebrow">
          📊 BUSINESS MANAGEMENT
        </div>

        <h1>My Business</h1>

        <p>
          A clear view of
          <strong>
            ${escapeHTML(m.businessName)}
          </strong>
        </p>
      </div>

      <button
        class="primary"
        data-nav="karta"
      >
        ✨ Ask KartaAI
      </button>

    </section>


    <!-- =================================================
         BUSINESS OVERVIEW
    ================================================== -->

    <section class="section">

      <div class="section-top">

        <div>
          <h2>📊 Business Overview</h2>

          <p>
            Your most important numbers at a glance.
          </p>
        </div>

      </div>


      <div class="metric-grid">

        ${statCard(
          'Today’s Sales',
          money(m.today.sales),
          `↑ ${m.today.growth}% vs yesterday`,
          'positive'
        )}

        ${statCard(
          'Orders',
          m.today.orders,
          'Orders today',
          ''
        )}

        ${statCard(
          'Customers',
          m.today.customers,
          `${m.regularCustomers} regular customers`,
          ''
        )}

        ${statCard(
          'Units Sold',
          totalUnits,
          'Across all products',
          ''
        )}

        ${statCard(
          'Product Revenue',
          money(totalRevenue),
          'Current catalog revenue',
          ''
        )}

        ${statCard(
          'Weekly Growth',
          `+${m.weeklyGrowth}%`,
          'Sales growth',
          'positive'
        )}

      </div>

    </section>


    <!-- =================================================
         QUICK BUSINESS STATUS
    ================================================== -->

    <section class="section">

      <div class="section-top">

        <div>
          <h2>🎯 Business at a Glance</h2>

          <p>
            What needs your attention today.
          </p>
        </div>

      </div>


      <div class="metric-grid">

        ${statCard(
          '🔥 High Demand',
          highDemand.length,
          'Products selling strongly',
          'positive'
        )}

        ${statCard(
          '📦 Reorder',
          reorderProducts.length,
          'Products need restocking',
          reorderProducts.length ? 'warning' : 'positive'
        )}

        ${statCard(
          '🚨 Critical Stock',
          criticalProducts.length,
          'Immediate attention',
          criticalProducts.length ? 'warning' : 'positive'
        )}

        ${statCard(
          '📉 Slow Moving',
          slowProducts.length,
          'Products needing attention',
          slowProducts.length ? 'warning' : 'positive'
        )}

      </div>

    </section>


    <!-- =================================================
         HIGH DEMAND PRODUCTS
    ================================================== -->

    <section class="section">

      <article class="card card-pad">

        <div class="section-top">

          <div>
            <h2>🔥 High-Demand Products</h2>

            <p>
              Products currently selling the most.
            </p>
          </div>

          <button
            class="link-button"
            data-query="Which products are in highest demand?"
          >
            Ask KartaAI
          </button>

        </div>


        ${
          highDemand.length
            ? highDemand
                .slice(0, 5)
                .map(productRow)
                .join('')
            : `
              <p class="empty">
                No high-demand products found.
              </p>
            `
        }

      </article>

    </section>


    <!-- =================================================
         REORDER PRODUCTS
    ================================================== -->

    <section class="section">

      <article class="card card-pad">

        <div class="section-top">

          <div>
            <h2>📦 Products to Reorder</h2>

            <p>
              Products where stock has reached the reorder level.
            </p>
          </div>

          <button
            class="link-button"
            data-action="reorder"
          >
            Reorder
          </button>

        </div>


        ${
          reorderProducts.length
            ? reorderProducts
                .map(
                  (p) => `
                    <div class="product-row">

                      <div>
                        <b>
                          ${escapeHTML(p.name)}
                        </b>

                        <small>
                          Reorder level:
                          ${Number(p.reorderLevel) || 0}
                        </small>
                      </div>

                      <span>
                        ${Number(p.stock) || 0} left
                      </span>

                      <span
                        class="status ${stockClass(p)}"
                      >
                        ${stockStatus(p)}
                      </span>

                      <button
                        class="small-button"
                        data-action="reorder"
                      >
                        Reorder
                      </button>

                    </div>
                  `
                )
                .join('')
            : `
              <p class="empty">
                ✓ All products are above their reorder level.
              </p>
            `
        }

      </article>

    </section>


    <!-- =================================================
         STOCK HEALTH
    ================================================== -->

    <section class="section">

      <article class="card card-pad">

        <div class="section-top">

          <div>
            <h2>📦 Stock Health</h2>

            <p>
              Current inventory condition.
            </p>
          </div>

        </div>


        <div class="metric-grid">

          ${statCard(
            '🚨 Critical',
            criticalProducts.length,
            'Immediate restocking',
            criticalProducts.length ? 'warning' : 'positive'
          )}

          ${statCard(
            '⚠️ Low',
            lowProducts.length,
            'Watch closely',
            lowProducts.length ? 'warning' : 'positive'
          )}

          ${statCard(
            '✓ Healthy',
            healthyProducts.length,
            'Stock is above reorder level',
            'positive'
          )}

        </div>

      </article>

    </section>


    <!-- =================================================
         SLOW MOVING PRODUCTS
    ================================================== -->

    <section class="section">

      <article class="card card-pad">

        <div class="section-top">

          <div>
            <h2>📉 Slow-Moving Products</h2>

            <p>
              Products with declining sales.
            </p>
          </div>

          <button
            class="link-button"
            data-query="Which products are slow moving and what should I do with them?"
          >
            Ask KartaAI
          </button>

        </div>


        ${
          slowProducts.length
            ? slowProducts
                .slice(0, 5)
                .map(
                  (p) => `
                    <div class="product-row">

                      <div>
                        <b>
                          ${escapeHTML(p.name)}
                        </b>

                        <small>
                          ${escapeHTML(
                            p.category || 'Other'
                          )}
                        </small>
                      </div>

                      <span>
                        ${Number(p.units) || 0} units
                      </span>

                      <span class="negative">
                        ↓ ${Math.abs(
                          Number(p.growth) || 0
                        )}%
                      </span>

                      <button
                        class="small-button"
                        data-query="Create an offer for ${escapeHTML(p.name)} because it is slow moving."
                      >
                        Create Offer
                      </button>

                    </div>
                  `
                )
                .join('')
            : `
              <p class="empty">
                ✓ No slow-moving products detected.
              </p>
            `
        }

      </article>

    </section>


    <!-- =================================================
         GROWING PRODUCTS
    ================================================== -->

    <section class="section">

      <article class="card card-pad">

        <div class="section-top">

          <div>
            <h2>📈 Growing Products</h2>

            <p>
              Products showing positive sales growth.
            </p>
          </div>

        </div>


        ${
          growingProducts.length
            ? growingProducts
                .slice(0, 5)
                .map(
                  (p) => `
                    <div class="product-row">

                      <div>
                        <b>
                          ${escapeHTML(p.name)}
                        </b>

                        <small>
                          ${escapeHTML(
                            p.category || 'Other'
                          )}
                        </small>
                      </div>

                      <span>
                        ${Number(p.units) || 0} units
                      </span>

                      <span class="positive">
                        ↑ ${Number(p.growth) || 0}%
                      </span>

                      <button
                        class="small-button"
                        data-query="How should I increase sales of ${escapeHTML(p.name)}?"
                      >
                        Sales Advice
                      </button>

                    </div>
                  `
                )
                .join('')
            : `
              <p class="empty">
                No growing products available.
              </p>
            `
        }

      </article>

    </section>


    <!-- =================================================
         CATEGORY PERFORMANCE
    ================================================== -->

    <section class="section">

      <article class="card card-pad">

        <div class="section-top">

          <div>
            <h2>🗂️ Category-wise Performance</h2>

            <p>
              See which business categories generate the most revenue.
            </p>
          </div>

        </div>


        ${
          categoryList.length
            ? categoryList
                .map(
                  (category) => `
                    <div class="product-row">

                      <div>
                        <b>
                          ${escapeHTML(category.name)}
                        </b>

                        <small>
                          ${category.products} products
                        </small>
                      </div>

                      <span>
                        ${category.units} units
                      </span>

                      <span class="positive">
                        ${money(category.revenue)}
                      </span>

                      <button
                        class="small-button"
                        data-query="Tell me about my ${escapeHTML(category.name)} category performance."
                      >
                        View Analysis
                      </button>

                    </div>
                  `
                )
                .join('')
            : `
              <p class="empty">
                No category data available.
              </p>
            `
        }

      </article>

    </section>


    <!-- =================================================
         COMPLETE PRODUCT CATALOG
    ================================================== -->

    <section class="section">

      <article class="card card-pad">

        <div class="section-top">

          <div>
            <h2>🛒 Complete Product Catalog</h2>

            <p>
              Complete view of your products, sales and inventory.
            </p>
          </div>

          <button
            class="link-button"
            data-query="Give me a complete analysis of my product catalog."
          >
            Analyze Catalog
          </button>

        </div>


        <div
          style="
            overflow-x:auto;
            width:100%;
          "
        >

          <div
            style="
              min-width:950px;
            "
          >

            <div
              class="product-row"
              style="
                font-weight:700;
                border-bottom:2px solid #e5e7eb;
              "
            >

              <div>
                Product
              </div>

              <span>
                Units Sold
              </span>

              <span>
                Revenue
              </span>

              <span>
                Growth
              </span>

              <span>
                Demand
              </span>

              <span>
                Stock
              </span>

              <span>
                Status
              </span>

            </div>


            ${
              products.length
                ? products
                    .map(productRow)
                    .join('')
                : `
                  <p class="empty">
                    No products available.
                  </p>
                `
            }

          </div>

        </div>

      </article>

    </section>


    <!-- =================================================
         KARTAAI BUSINESS ASSISTANCE
    ================================================== -->

    <section class="section">

      <article class="insight-panel">

        <h3>
          ✨ Let KartaAI handle the analysis
        </h3>

        <p>
          Ask KartaAI to analyze sales, inventory,
          slow-moving products, growing products,
          category performance or reorder requirements.
        </p>

        <div
          style="
            display:flex;
            flex-wrap:wrap;
            gap:10px;
            margin-top:18px;
          "
        >

          <button
            class="secondary"
            data-query="Give me today's complete business summary."
          >
            📊 Business Summary
          </button>

          <button
            class="secondary"
            data-query="Which products should I reorder?"
          >
            📦 Check Reorder
          </button>

          <button
            class="secondary"
            data-query="Which products are slow moving?"
          >
            📉 Slow Products
          </button>

          <button
            class="secondary"
            data-query="Which products are growing?"
          >
            📈 Growing Products
          </button>

        </div>

      </article>

    </section>

  `);
}
function resultCard(
  kicker,
  main,
  details = '',
  action = ''
) {
  return `<div class="result-card">

    <div class="result-kicker">
      ${kicker}
    </div>

    ${main}

    ${details}

    ${
      action
        ? `<div class="message-action">
            ${action}
          </div>`
        : ''
    }

  </div>`;
}

function initialMessage() {
  const m = merchant();
  const firstName = m ? escapeHTML(m.name.split(' ')[0]) : '';

  const greeting =
    state.language === 'hindi'
      ? `नमस्ते ${firstName}! मैं आपकी बिक्री, स्टॉक, ऑर्डर, ग्राहकों और ऑफ़र में मदद के लिए तैयार हूँ। आप क्या जानना या करना चाहते हैं?`
      : state.language === 'hinglish'
      ? `Namaste ${firstName}! Main aapki sales, stock, orders, customers aur offers manage karne ke liye ready hoon. Aaj kya check karein?`
      : `Hi ${firstName}! I’m ready to help with your sales, stock, orders, customers, or offers. What do you need?`;

  return {
    who: 'bot',
    html: greeting
  };
}

function kartaPage() {
  const m = merchant();

  if (!m) {
    state.screen = 'welcome';
    return welcomeScreen();
  }

  if (!state.messages.length) {
    state.messages.push(
      initialMessage()
    );
  }

  const quickQuestions =
    state.language === 'hindi'
      ? [
          'आज की बिक्री बताओ',
          'कम स्टॉक वाले सामान दिखाओ',
          'सबसे ज़्यादा बिकने वाला सामान कौन सा है?',
          'आज के ऑर्डर दिखाओ',
          'मेरे नियमित ग्राहक कौन हैं?',
          'भारत में खाद्य तेल का क्या ट्रेंड चल रहा है?'
        ]
      : state.language === 'hinglish'
      ? [
          'Aaj ki sales batao',
          'Low stock inventory check karo',
          'Best seller product kaunsa hai?',
          'Show today’s orders',
          'Mere regular customers kaun hain?',
          'India mein edible oil ka trend kya hai?'
        ]
      : [
          'Show today’s sales',
          'Inspect low stock inventory',
          'Which product is my best seller?',
          'Show today’s customer orders',
          'Who are my regular customers?',
          'What is the edible oil market trend in India?'
        ];

  return shell(`
    <section class="page-heading">

      <div>
        <h1>${escapeHTML(t('assistant_page_title'))}</h1>
        <p>${escapeHTML(t('assistant_page_sub'))}</p>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        ${
          state.currentChatId
            ? `<span class="current-chat-badge">💬 ${escapeHTML(
                state.chatList.find((item) => item.id === state.currentChatId)?.title || 'Current Chat'
              )}</span>`
            : ''
        }
        <button class="primary" data-action="new-chat">
          ＋ New Chat
        </button>
      </div>

    </section>

    <section class="assistant-layout">

      <article class="card assistant-main">

        <div class="assistant-top" style="display:flex;justify-content:space-between;align-items:center;">

          <div class="assistant-title">

            <span class="brand-mark">
              ✦
            </span>

            <div>

              <h2>KartaAI</h2>

              <p>
                ${escapeHTML(t('assistant_here_to_help'))}
                ${escapeHTML(
                  m.businessName
                )}
              </p>

            </div>

          </div>

          <button
            class="voice-toggle-btn ${state.voiceEnabled ? 'active' : ''}"
            data-action="toggle-voice-sound"
            title="Toggle voice speech / बोलकर उत्तर चालू या बंद करें"
          >
            <span>${state.voiceEnabled ? '🔊' : '🔇'}</span>
            <span>${state.voiceEnabled ? escapeHTML(t('assistant_voice_on')) : escapeHTML(t('assistant_voice_off'))}</span>
          </button>

        </div>

        <div
          class="messages"
          id="messages"
        >
          ${messagesHTML()}
        </div>

        <form
          class="assistant-input"
          data-form="assistant-ask"
        >

          <input
            id="assistant-question"
            aria-label="Ask KartaAI"
            placeholder="${escapeHTML(t('assistant_input_placeholder'))}"
          />

          <button
            type="button"
            class="mic-btn ${state.isListening ? 'listening' : ''}"
            data-action="voice-mic"
            data-target="assistant-question"
            title="Speak your question / बोलकर पूछें"
          >
            🎤
          </button>

          <button
            class="primary"
            type="submit"
          >
            ${escapeHTML(t('home_ask_btn'))}
          </button>

        </form>

        ${
          state.isListening
            ? `<div style="padding: 0 16px 8px;">
                <div class="voice-status-pill">
                  <span class="voice-dot"></span>
                  <span>${escapeHTML(t('assistant_speech_listening'))}</span>
                </div>
              </div>`
            : ''
        }

      </article>

      <aside class="card side-quick">

        <h3>
          ${escapeHTML(t('assistant_quick_title'))}
        </h3>

        ${quickQuestions
          .map(
            (query) =>
              `<button
                class="quick-text"
                data-query="${escapeHTML(
                  query
                )}"
              >
                ${escapeHTML(
                  query
                )}
              </button>`
          )
          .join('')}

        <button
          class="quick-text"
          data-action="view-plan"
        >
          ${escapeHTML(t('home_view_plan'))}
        </button>

        <div class="source-note">
          ${escapeHTML(t('assistant_source_note'))}
        </div>

      </aside>

    </section>
  `);
}

function messagesHTML() {
  const m = merchant();

  if (!m) return '';

  return state.messages
    .map(
      (message) => {
        const isBot = message.who !== 'user';
        const isThinking = message.html.includes('ai-thinking');
        const speechText = isBot && !isThinking ? cleanTextForSpeech(message.html) : '';

        return `<div
          class="message ${
            message.who === 'user'
              ? 'user'
              : ''
          }"
        >

          <span class="message-avatar">
            ${
              message.who === 'user'
                ? escapeHTML(
                    m.initials
                      ?.slice(0, 1) ||
                      'U'
                  )
                : '✦'
            }
          </span>

          <div class="message-bubble">
            ${message.html}
            ${
              isBot && !isThinking && speechText
                ? `<div class="message-audio-controls">
                    <button
                      type="button"
                      class="tts-play-btn ${state.currentlySpeaking === speechText.slice(0, 40) ? 'speaking' : ''}"
                      data-action="toggle-tts"
                      data-text="${escapeHTML(speechText)}"
                      title="Listen aloud / बोलकर सुनें"
                    >
                      <span>${state.currentlySpeaking === speechText.slice(0, 40) ? '⏹' : '🔊'}</span>
                      <span>${state.currentlySpeaking === speechText.slice(0, 40) ? escapeHTML(t('assistant_voice_stop')) : escapeHTML(t('assistant_voice_readout'))}</span>
                    </button>
                  </div>`
                : ''
            }
          </div>

        </div>`;
      }
    )
    .join('');
}


function paymentSummaryCard(label, value, tone = '') {
  return `
    <article class="card payment-summary-card ${tone}">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </article>
  `;
}

async function loadPayments(options = {}) {
  const m = merchant();
  if (!m) return null;

  state.paymentLoading = true;

  try {
    const params = new URLSearchParams({
      merchantId: m.id,
      page: String(state.paymentPage || 1),
      limit: '10',
      search: state.paymentSearch || '',
      status: state.paymentStatus || 'All',
      from: state.paymentFrom || '',
      to: state.paymentTo || ''
    });

    const result = await api(`/payments?${params.toString()}`);
    state.paymentData = result;
    return result;
  } catch (error) {
    console.warn('Payment history load failed:', error);
    state.toast = error.message || 'Could not load payment history.';
    return null;
  } finally {
    state.paymentLoading = false;
    if (options.render !== false) render();
  }
}

function paymentStatusClass(status) {
  return `payment-status payment-status-${statusClass(status)}`;
}

function paymentHistoryPage() {
  const data = state.paymentData;
  const payments = data?.payments || [];
  const summary = data?.summary || {
    totalPayments: 0,
    totalReceived: 0,
    pendingAmount: 0,
    failedPayments: 0,
    refundedAmount: 0
  };
  const pagination = data?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0
  };

  return shell(`
    <section class="page-heading payment-heading">
      <div>
        <h1>Payment History</h1>
        <p>Track every payment, transaction and settlement for your business.</p>
      </div>
      <button class="primary" data-action="refresh-payments">
        ↻ Refresh
      </button>
    </section>

    <section class="payment-summary-grid">
      ${paymentSummaryCard('Total Payments', String(summary.totalPayments))}
      ${paymentSummaryCard('Total Received', money(summary.totalReceived), 'success')}
      ${paymentSummaryCard('Pending Amount', money(summary.pendingAmount), 'warning')}
      ${paymentSummaryCard('Failed Payments', String(summary.failedPayments), 'danger')}
    </section>

    <section class="card payment-toolbar">
      <div class="payment-search">
        <span>⌕</span>
        <input
          id="payment-search"
          value="${escapeHTML(state.paymentSearch)}"
          placeholder="Search payment, order, customer or transaction..."
        />
      </div>

      <select id="payment-status-filter">
        ${['All', 'Completed', 'Pending', 'Failed', 'Refunded'].map((status) =>
          `<option value="${status}" ${state.paymentStatus === status ? 'selected' : ''}>${status}</option>`
        ).join('')}
      </select>

      <input
        id="payment-from"
        type="date"
        value="${escapeHTML(state.paymentFrom)}"
        title="From date"
      />

      <input
        id="payment-to"
        type="date"
        value="${escapeHTML(state.paymentTo)}"
        title="To date"
      />

      <button class="secondary" data-action="apply-payment-filters">
        Apply
      </button>

      <button class="link-button" data-action="clear-payment-filters">
        Clear
      </button>
    </section>

    <section class="card payment-table-card">
      <div class="payment-table-head">
        <div>
          <h3>Transactions</h3>
          <p>${pagination.total || 0} payment records</p>
        </div>
        ${state.paymentLoading ? '<span class="payment-loading">Loading…</span>' : ''}
      </div>

      ${
        payments.length
          ? `<div class="payment-table-wrap">
              <table class="payment-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Customer</th>
                    <th>Order ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Transaction</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${payments.map((payment) => `
                    <tr>
                      <td><strong>${escapeHTML(payment.id)}</strong></td>
                      <td>${escapeHTML(payment.customer || '—')}</td>
                      <td>${escapeHTML(payment.orderId || '—')}</td>
                      <td><strong>${money(payment.amount)}</strong></td>
                      <td><span class="payment-method">${escapeHTML(payment.paymentMethod || '—')}</span></td>
                      <td class="transaction-cell">${escapeHTML(payment.transactionId || '—')}</td>
                      <td>${payment.paymentDate ? new Date(payment.paymentDate).toLocaleString('en-IN') : '—'}</td>
                      <td><span class="${paymentStatusClass(payment.status)}">${escapeHTML(payment.status)}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`
          : `<div class="payment-empty">
              <div>💳</div>
              <h2>No payments found</h2>
              <p>Try changing your filters or record a payment through the payment API.</p>
            </div>`
      }

      ${
        pagination.totalPages > 1
          ? `<div class="payment-pagination">
              <button class="secondary" data-action="payment-prev" ${pagination.page <= 1 ? 'disabled' : ''}>
                ← Previous
              </button>
              <span>Page ${pagination.page} of ${pagination.totalPages}</span>
              <button class="secondary" data-action="payment-next" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>
                Next →
              </button>
            </div>`
          : ''
      }
    </section>
  `);
}

function offersPage() {
  const list =
    offerService
      .getOffers()
      .filter(
        (offer) =>
          state.offerFilter === 'All' ||
          offer.status ===
            state.offerFilter
      );

  return shell(`
    <section class="page-heading">

      <div>

        <h1>Offers</h1>

        <p>
          Offers for
          ${escapeHTML(
            merchant().businessName
          )}
        </p>

      </div>

      <button
        class="primary"
        data-action="offer"
      >
        Create offer
      </button>

    </section>

    <section class="offer-plan">
      ${momentumCard(true)}
    </section>

    <div class="offer-tabs">

      ${[
        'All',
        'Active',
        'Scheduled',
        'Draft'
      ]
        .map(
          (tab) =>
            `<button
              class="tab ${
                state.offerFilter === tab
                  ? 'active'
                  : ''
              }"
              data-filter="${tab}"
            >
              ${tab}
            </button>`
        )
        .join('')}

    </div>

    <section class="offer-grid">

      ${
        list.length
          ? list
              .map(
                (offer) =>
                  `<article class="offer-card">

                    <span
                      class="status ${statusClass(
                        offer.status
                      )}"
                    >
                      ${escapeHTML(
                        offer.status
                      )}
                    </span>

                    <h3>
                      ${escapeHTML(
                        offer.name
                      )}
                    </h3>

                    <p>
                      ${escapeHTML(
                        offer.products
                      )}
                    </p>

                    <p style="margin-top:7px">
                      ${escapeHTML(
                        offer.start
                      )}
                      –
                      ${escapeHTML(
                        offer.end
                      )}
                    </p>

                    <div class="offer-card-footer">

                      <span class="offer-discount">
                        ${escapeHTML(
                          offer.discount
                        )}
                      </span>

                      ${
                        offer.status ===
                        'Draft'
                          ? `<button
                              class="small-button"
                              data-action="publish"
                              data-id="${escapeHTML(
                                offer.id
                              )}"
                            >
                              Publish
                            </button>`
                          : `<span
                              style="font-size:11px;color:#7790a7;font-weight:700"
                            >
                              ${escapeHTML(
                                offer.createdBy
                              )}
                            </span>`
                      }

                    </div>

                  </article>`
              )
              .join('')
          : '<p class="empty">No offers in this view yet.</p>'
      }

    </section>

    <section class="section offer-rec">

      <article class="card card-pad">

        <div class="section-top">

          <h2>
            KartaAI recommendation
          </h2>

          <span class="demo-pill">
            Opportunity found
          </span>

        </div>

        <div class="suggestion">

          <span class="suggestion-icon">
            🏷
          </span>

          <div>

            <b>
              Run a 10% offer on slow-moving products.
            </b>

            <small>
              Cold Drinks and Premium Tea have healthy
              stock and slower sales.
            </small>

          </div>

          <button
            class="small-button"
            data-action="view-plan"
          >
            See plan
          </button>

        </div>

      </article>

    </section>
  `);
}

function profilePage() {
  const m = merchant();

  if (!m) {
    state.screen = 'welcome';
    return welcomeScreen();
  }

  return shell(`
    <section class="page-heading">

      <div>

        <h1>${escapeHTML(t('profile_page_title'))}</h1>

        <p>
          ${escapeHTML(t('profile_page_sub'))}
        </p>

      </div>

    </section>

    <section class="profile-layout">

      <article class="card profile-head">

        ${avatarHTML(m, true)}

        <h2>
          ${escapeHTML(
            m.name
          )}
        </h2>

        <p>
          ${escapeHTML(
            m.businessName
          )}
        </p>

        <p>
          ${escapeHTML(
            m.businessType
          )}
        </p>

        <button
          class="secondary"
          data-action="open-lang-modal"
          style="margin-top: 14px;"
        >
          ${escapeHTML(t('profile_change_lang'))}
        </button>

        <button
          class="secondary logout"
          data-action="logout"
        >
          ${escapeHTML(t('profile_logout'))}
        </button>

      </article>

      <div>

        <article class="card detail-card">

          <h2>
            ${escapeHTML(t('profile_bdetails'))}
          </h2>

          <div class="detail-row">
            <span>${escapeHTML(t('profile_language'))}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <select class="lang-inline-select" data-action="select-lang-inline" aria-label="Select website language" style="padding:6px 10px; border-radius:8px; border:1px solid #cce2f7; background:#fff; font-size:13px; font-weight:600; color:#0759c9; cursor:pointer;">
                <option value="english" ${state.language === 'english' ? 'selected' : ''}>🌐 English</option>
                <option value="hindi" ${state.language === 'hindi' ? 'selected' : ''}>🇮🇳 हिंदी</option>
                <option value="hinglish" ${state.language === 'hinglish' ? 'selected' : ''}>🇮🇳 Hinglish</option>
              </select>
              ${languageButtonHTML()}
            </div>
          </div>

          <div class="detail-row">
            <span>${escapeHTML(t('profile_phone'))}</span>
            <b>${escapeHTML(
              m.mobile || ''
            )}</b>
          </div>

          <div class="detail-row">
            <span>Email</span>
            <b>${escapeHTML(
              m.email || ''
            )}</b>
          </div>

          <div class="detail-row">
            <span>Merchant ID</span>
            <b>${escapeHTML(
              m.id || ''
            )}</b>
          </div>

        </article>

        <article
          class="card detail-card"
          style="margin-top:18px"
        >

          <h2>
            ${escapeHTML(t('profile_store'))}
          </h2>

          <div class="detail-row">
            <span>${escapeHTML(t('profile_store'))}</span>
            <b>${escapeHTML(
              m.businessName || ''
            )}</b>
          </div>

          <div class="detail-row">
            <span>${escapeHTML(t('profile_category'))}</span>
            <b>${escapeHTML(
              m.businessType || ''
            )}</b>
          </div>

          <div class="detail-row">
            <span>${escapeHTML(t('profile_city'))}</span>
            <b>${escapeHTML(
              m.location || ''
            )}</b>
          </div>

        </article>

      </div>

    </section>
  `);
}

function modalHTML() {
  if (!state.modal) {
    return '';
  }

  const low =
    inventoryService
      .getLowStockProducts();

  if (state.modal === 'plan') {
    return `<div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >

      <section class="modal plan-modal">

        <span class="modal-icon">
          ✦
        </span>

        <span class="plan-kicker">
          Your 1-minute business plan
        </span>

        <h2 id="modal-title">
          Help beverages sell before evening
        </h2>

        <p>
          One focused step is easier to manage
          than a complicated dashboard.
        </p>

        <div class="plan-steps">

          <div>
            <span>1</span>
            <p>
              <b>What I noticed</b>
              <small>
                Cold Drinks and Premium Tea are selling slowly,
                while stock is healthy.
              </small>
            </p>
          </div>

          <div>
            <span>2</span>
            <p>
              <b>What I suggest</b>
              <small>
                Create a 10% offer for those two products
                for 7 days.
              </small>
            </p>
          </div>

          <div>
            <span>3</span>
            <p>
              <b>What happens next</b>
              <small>
                You approve it, choose when to publish,
                and KartaAI checks that it is live.
              </small>
            </p>
          </div>

        </div>

        <div class="modal-actions">

          <button
            class="secondary"
            data-action="close-modal"
          >
            Not now
          </button>

          <button
            class="primary"
            data-action="offer"
          >
            Review offer
          </button>

        </div>

      </section>

    </div>`;
  }

  if (state.modal === 'offer') {
    return `<div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >

      <section class="modal">

        <span class="modal-icon">
          🏷
        </span>

        <span class="plan-kicker">
          Step 1 of 3 · Your approval
        </span>

        <h2 id="modal-title">
          KartaAI wants to create this offer
        </h2>

        <p>
          It will help move slow stock.
          You stay in control at every step.
        </p>

        <div class="approval-summary">

          <div>
            <span>Offer</span>
            <b>Slow Stock Saver</b>
          </div>

          <div>
            <span>Products</span>
            <b>
              Cold Drinks, Premium Tea
            </b>
          </div>

          <div>
            <span>Discount</span>
            <b>10% OFF</b>
          </div>

          <div>
            <span>Duration</span>
            <b>7 days</b>
          </div>

        </div>

        <div class="plan-check">

          <span>✓</span>

          <p>
            <b>After approval</b>

            <small>
              KartaAI saves the offer,
              you decide when to publish it,
              then KartaAI checks that it’s active.
            </small>
          </p>

        </div>

        <div class="modal-actions">

          <button
            class="secondary"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            class="primary"
            data-action="approve-offer"
          >
            Approve offer
          </button>

        </div>

      </section>

    </div>`;
  }

  return `<div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >

    <section class="modal">

      <span class="modal-icon">
        📦
      </span>

      <h2 id="modal-title">
        Confirm reorder
      </h2>

      <p>
        These products need attention.
        KartaAI will create a reorder request
        for your review.
      </p>

      <div class="approval-summary">

        ${
          low.length
            ? low
                .map(
                  (item) =>
                    `<div>
                      <span>${escapeHTML(
                        item.name
                      )}</span>
                      <b>
                        ${item.stock} left
                      </b>
                    </div>`
                )
                .join('')
            : `<div>
                <span>Stock</span>
                <b>Healthy</b>
              </div>`
        }

      </div>

      <div class="modal-actions">

        <button
          class="secondary"
          data-action="close-modal"
        >
          Cancel
        </button>

        <button
          class="primary"
          data-action="approve-reorder"
        >
          Confirm reorder
        </button>

      </div>

    </section>

  </div>`;
}

function toastHTML() {
  return state.toast
    ? `<div
        class="toast"
        role="status"
      >
        ✓ ${escapeHTML(
          state.toast
        )}
      </div>`
    : '';
}

/* =========================
   LOCAL FALLBACK AI
========================= */

function intentFor(query) {
  const q =
    String(query || '').toLowerCase();

  if (
    /(india|market|trend|current|abhi).*(oil|edible).*(down|kam|declin|kya karu|help)|((oil|edible).*(down|kam|declin|kya karu|help).*(india|market|trend|current|abhi))/.test(
      q
    )
  ) {
    return 'combined';
  }

  if (
    /(india|market|trend|current|abhi).*(oil|edible)|((oil|edible).*(india|market|trend|current|abhi))/.test(
      q
    )
  ) {
    return 'market';
  }

  if (
    /(oil|tel|cooking oil).*(down|kam|declin|kya karu|help)/.test(
      q
    )
  ) {
    return 'oil-advice';
  }

  if (
    /(oil|tel).*(section|chal|selling|sale)/.test(
      q
    )
  ) {
    return 'oil';
  }

  if (
    /(reorder|order karo|stock.*mang|mangwa)/.test(
      q
    )
  ) {
    return 'reorder';
  }

  if (
    /(offer.*bana|create.*offer|promotion|discount|slow.*offer)/.test(
      q
    )
  ) {
    return 'offer';
  }

  if (
    /(inventory|stock|low|maal|products are low)/.test(
      q
    )
  ) {
    return 'inventory';
  }

  if (
    /(order|orders)/.test(q)
  ) {
    return 'orders';
  }

  if (
    /(customer|regular|returning)/.test(
      q
    )
  ) {
    return 'customers';
  }

  if (
    /(best|most|sabse zyada|top product|best seller)/.test(
      q
    )
  ) {
    return 'best';
  }

  if (
    /(slow|not selling|nahi bik|kam bik)/.test(
      q
    )
  ) {
    return 'slow';
  }

  if (
    /(down|sales.*help|help.*sales|kya karu|advice)/.test(
      q
    )
  ) {
    return 'advice';
  }

  if (
    /(sale|sales|revenue|aaj|today|weekly|monthly)/.test(
      q
    )
  ) {
    return 'sales';
  }

  return 'unknown';
}

async function answerFor(intent) {
  const m = merchant();

  if (!m) {
    return 'Please sign in first.';
  }

  const todaySales =
    salesService.getTodaySales();

  const products =
    productService.getProducts();

  const button = (
    label,
    action,
    id = ''
  ) =>
    `<button
      class="primary"
      data-action="${escapeHTML(
        action
      )}"
      ${
        id
          ? `data-id="${escapeHTML(
              id
            )}"`
          : ''
      }
    >
      ${label}
    </button>`;

  switch (intent) {

    case 'sales':
      return `I checked your business.
      ${resultCard(
        'Your business data',
        `<strong>Today’s Sales</strong>
         <div class="result-number">
           ${money(todaySales.sales)}
         </div>`,
        `<div class="result-rows">

          <div class="result-row">
            <span>Orders</span>
            <span>${todaySales.orders}</span>
          </div>

          <div class="result-row">
            <span>
              Compared with yesterday
            </span>
            <span class="positive">
              ↑ ${todaySales.growth}%
            </span>
          </div>

        </div>

        <p>
          Source: Your Business Data
        </p>`
      )}`;

    case 'inventory': {
      const low =
        inventoryService
          .getLowStockProducts();

      return `I checked your inventory.
      ${resultCard(
        'Your business data',
        '<strong>Stock needs attention</strong>',
        `<div class="result-rows">

          ${
            low.length
              ? low
                  .map(
                    (p) =>
                      `<div class="result-row">

                        <span>
                          ${escapeHTML(
                            p.name
                          )}
                        </span>

                        <span class="${
                          p.stock <= 3
                            ? 'negative'
                            : 'warning'
                        }">
                          ${p.stock} left
                        </span>

                      </div>`
                  )
                  .join('')
              : `<div class="result-row">
                  <span>All products</span>
                  <span class="positive">
                    Healthy
                  </span>
                </div>`
          }

        </div>`,
        button(
          'Reorder products',
          'reorder'
        )
      )}`;
    }

    case 'orders': {
      const orders =
        orderService.getOrders();

      return `Here’s your order update.
      ${resultCard(
        'Your business data',
        `<strong>Today’s orders</strong>
         <div class="result-number">
           ${todaySales.orders}
         </div>`,
        `<div class="result-rows">

          <div class="result-row">
            <span>Completed</span>
            <span>
              ${Math.max(
                0,
                todaySales.orders - 9
              )}
            </span>
          </div>

          <div class="result-row">
            <span>Pending</span>
            <span class="warning">
              9
            </span>
          </div>

          <div class="result-row">
            <span>Latest order</span>
            <span>
              ${
                orders[0]?.id ||
                'N/A'
              }
            </span>
          </div>

        </div>`
      )}`;
    }

    case 'customers': {
      const regular =
        customerService
          .getCustomers();

      return `I found your regular customers.
      ${resultCard(
        'Your business data',
        `<strong>
          ${m.regularCustomers}
          returning customers
        </strong>`,
        `<div class="result-rows">

          ${regular
            .slice(0, 3)
            .map(
              (c) =>
                `<div class="result-row">

                  <span>
                    ${escapeHTML(
                      c.name
                    )}
                  </span>

                  <span>
                    ${c.orders} orders
                  </span>

                </div>`
            )
            .join('')}

        </div>

        <p>
          They shop most often for
          Grocery and Cooking Oil.
        </p>`
      )}`;
    }

    case 'best': {
      const p =
        productService
          .getBestSellingProducts()[0];

      if (!p) {
        return 'No product data is available.';
      }

      return `Here’s what is selling the most.
      ${resultCard(
        'Your business data',
        `<strong>Your Best Seller</strong>
         <div
           class="result-number"
           style="font-size:22px"
         >
           ${escapeHTML(
             p.name
           )}
         </div>`,
        `<div class="result-rows">

          <div class="result-row">
            <span>Units sold</span>
            <span>
              ${p.units}
            </span>
          </div>

          <div class="result-row">
            <span>Revenue</span>
            <span>
              ${money(p.revenue)}
            </span>
          </div>

        </div>`,
        button(
          'Promote product',
          'offer'
        )
      )}`;
    }

    case 'slow': {
      const slow =
        productService
          .getSlowMovingProducts()
          .slice(0, 2);

      return `I found products that need a little push.
      ${resultCard(
        'Your business data',
        '<strong>Slow-moving products</strong>',
        `<div class="result-rows">

          ${
            slow.length
              ? slow
                  .map(
                    (p) =>
                      `<div class="result-row">

                        <span>
                          ${escapeHTML(
                            p.name
                          )}
                        </span>

                        <span class="negative">
                          ↓ ${Math.abs(
                            p.growth
                          )}%
                        </span>

                      </div>`
                  )
                  .join('')
              : `<div class="result-row">
                  <span>Products</span>
                  <span class="positive">
                    No slow products
                  </span>
                </div>`
          }

        </div>

        <p>
          Both have enough stock
          for a short offer.
        </p>`,
        button(
          'Create offer',
          'offer'
        )
      )}`;
    }

    case 'oil': {
      const oils =
        products
          .filter(
            (p) =>
              p.category ===
              'Cooking Oil'
          )
          .sort(
            (a, b) =>
              b.revenue -
              a.revenue
          );

      if (!oils.length) {
        return 'No cooking oil data is available.';
      }

      return `I checked your oil sales.
      ${resultCard(
        'Your business data',
        '<strong>Your Oil Sales</strong>',
        `<div class="result-rows">

          ${oils
            .map(
              (p) =>
                `<div class="result-row">

                  <span>
                    ${escapeHTML(
                      p.name.replace(
                        ' 1L',
                        ''
                      )
                    )}
                  </span>

                  <span>
                    ${money(
                      p.revenue
                    )}
                    ·
                    ${p.units}
                    units
                    <br>

                    <em
                      class="${
                        p.growth >= 0
                          ? 'positive'
                          : 'negative'
                      }"
                    >
                      ${
                        p.growth >= 0
                          ? '+'
                          : ''
                      }${p.growth}%
                    </em>

                  </span>

                </div>`
            )
            .join('')}

        </div>

        <p>
          <b>
            ${escapeHTML(
              oils[0].name.replace(
                ' 1L',
                ''
              )
            )}
          </b>
          is currently your strongest
          oil category.
        </p>`,
        button(
          'Promote Mustard Oil',
          'offer'
        )
      )}`;
    }

    case 'advice':
      return `I checked sales, product performance, and stock.
      ${resultCard(
        'Opportunity found',
        '<strong>Your sales need a small lift</strong>',
        `<div class="result-rows">

          <div class="result-row">
            <span>Recent sales</span>
            <span class="negative">
              ↓ 8%
            </span>
          </div>

          <div class="result-row">
            <span>Beverage sales</span>
            <span class="negative">
              ↓ 18%
            </span>
          </div>

          <div class="result-row">
            <span>Beverage stock</span>
            <span class="positive">
              Healthy
            </span>
          </div>

        </div>

        <p>
          I made one simple plan:
          a 10% offer on Cold Drinks
          and Premium Tea for the next 7 days.
        </p>`,
        button(
          'See my 1-minute plan',
          'view-plan'
        )
      )}`;

    case 'oil-advice':
      return `I checked your store first.
      ${resultCard(
        'Your business data',
        '<strong>Your cooking oil picture</strong>',
        `<div class="result-rows">

          <div class="result-row">
            <span>Mustard Oil sales</span>
            <span class="positive">
              ↑ 18%
            </span>
          </div>

          <div class="result-row">
            <span>Soybean Oil sales</span>
            <span class="negative">
              ↓ 3%
            </span>
          </div>

          <div class="result-row">
            <span>Current stock</span>
            <span class="positive">
              Healthy
            </span>
          </div>

        </div>

        <p>
          Cooking oil is healthy overall.
          A small Soybean Oil promotion
          can help the one weaker product.
        </p>`,
        button(
          'Create Soybean Oil offer',
          'offer'
        )
      )}`;

    case 'offer':
      return `I found a simple offer for your slow stock.
      ${resultCard(
        'Recommended action',
        '<strong>Slow Stock Saver</strong>',
        `<div class="result-rows">

          <div class="result-row">
            <span>Products</span>
            <span>
              Cold Drinks, Premium Tea
            </span>
          </div>

          <div class="result-row">
            <span>Discount</span>
            <span>10% OFF</span>
          </div>

          <div class="result-row">
            <span>Duration</span>
            <span>7 days</span>
          </div>

        </div>

        <p>
          I’ll only create it after you approve.
        </p>`,
        button(
          'Review offer',
          'offer'
        )
      )}`;

    case 'reorder': {
      const low =
        inventoryService
          .getLowStockProducts();

      return `I checked your stock.
      ${resultCard(
        'Recommended action',
        `<strong>
          ${low.length}
          products need reordering
        </strong>`,
        `<div class="result-rows">

          ${
            low.length
              ? low
                  .map(
                    (p) =>
                      `<div class="result-row">

                        <span>
                          ${escapeHTML(
                            p.name
                          )}
                        </span>

                        <span class="warning">
                          ${p.stock} left
                        </span>

                      </div>`
                  )
                  .join('')
              : `<div class="result-row">
                  <span>Stock</span>
                  <span class="positive">
                    Healthy
                  </span>
                </div>`
          }

        </div>

        <p>
          I’ll create a request
          only after your confirmation.
        </p>`,
        button(
          'Confirm reorder',
          'reorder'
        )
      )}`;
    }

    case 'market': {
      try {
        const market =
          await marketSearchService
            .searchMarketInformation();

        const sources =
          Array.isArray(
            market?.sources
          )
            ? market.sources
            : [];

        const sourceHTML =
          sources.length
            ? `<p>
                Useful public sources:
                ${sources
                  .map(
                    ([name, url]) =>
                      `<a
                        href="${escapeHTML(
                          url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ${escapeHTML(
                          name
                        )}
                      </a>`
                  )
                  .join(' · ')}
              </p>`
            : '';

        return `I kept this separate from your business data.
        ${resultCard(
          'Current Market Information',
          '<strong>Live market information</strong>',
          `<p>
            ${escapeHTML(
              market?.summary ||
                'A live market check was requested. The connected market service did not return a summary.'
            )}
          </p>

          ${sourceHTML}

          <p>
            Checked:
            ${escapeHTML(
              market?.checkedAt ||
                dateText()
            )}.
            Your business information
            was not used for this answer.
          </p>`
        )}`;
      } catch (error) {
        return `I could not load the live market information right now.
        ${resultCard(
          'Market information',
          '<strong>Market service unavailable</strong>',
          `<p>
            ${escapeHTML(
              error.message ||
                'Please try again.'
            )}
          </p>`
        )}`;
      }
    }

    case 'combined': {
      let market = null;

      try {
        market =
          await marketSearchService
            .searchMarketInformation();
      } catch (error) {
        console.warn(
          'Market check failed:',
          error.message
        );
      }

      const sources =
        Array.isArray(
          market?.sources
        )
          ? market.sources
          : [];

      const sourceHTML =
        sources.length
          ? `<p>
              Public sources:
              ${sources
                .map(
                  ([name, url]) =>
                    `<a
                      href="${escapeHTML(
                        url
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ${escapeHTML(
                        name
                      )}
                    </a>`
                )
                .join(' · ')}
            </p>`
          : '';

      return `Here’s what I found after checking your store first.

      ${resultCard(
        'Your Business Data',
        '<strong>Cooking oil is mixed</strong>',
        `<div class="result-rows">

          <div class="result-row">
            <span>Mustard Oil</span>
            <span class="positive">
              ↑ 18%
            </span>
          </div>

          <div class="result-row">
            <span>Soybean Oil</span>
            <span class="negative">
              ↓ 3%
            </span>
          </div>

          <div class="result-row">
            <span>Oil stock</span>
            <span class="positive">
              Healthy
            </span>
          </div>

        </div>

        <p>
          Recommendation:
          promote Soybean Oil rather than
          discounting your strongest item.
        </p>`,
        button(
          'Create Soybean Oil offer',
          'offer'
        )
      )}

      ${resultCard(
        'Current Market Information',
        '<strong>Live market check</strong>',
        `<p>
          ${escapeHTML(
            market?.summary ||
              'The connected market service did not return a summary.'
          )}
        </p>

        ${sourceHTML}`
      )}`;
    }

    default:
      return `I can help with sales, stock, orders, customers and offers.

      Try asking something like
      <b>“Which product is selling the most?”</b>
      or
      <b>“Mera inventory check karo.”</b>`;
  }
}
/* =========================
   AI CHAT
========================= */

async function ask(query) {
  const clean = String(query || '').trim();

  if (!clean) return;

  const m = merchant();

  if (!m) {
    state.toast = 'Please sign in first.';
    render();
    return;
  }

  /*
    Every question belongs to one server-side conversation.
    If the user has not started one yet, create it first.
  */
  if (!state.currentChatId) {
    const chat = await createNewChat({
      title: clean.slice(0, 60) || 'New Chat'
    });

    if (!chat) return;
  }

  state.messages.push({
    who: 'user',
    html: escapeHTML(clean)
  });

  state.messages.push({
    who: 'bot',
    html: '<span class="ai-thinking">KartaAI is thinking…</span>'
  });

  state.page = 'karta';
  render();

  try {
    const result = await api('/ai/chat', {
      method: 'POST',
      body: {
        merchantId: m.id,
        message: clean,
        conversationId: state.currentChatId,
        language: state.language || 'english'
      }
    });

    if (result?.conversationId) {
      state.currentChatId = result.conversationId;
    }

    const last = state.messages[state.messages.length - 1];

    if (result?.html) {
      last.html = result.html;
    } else if (result?.text) {
      last.html = escapeHTML(result.text);
    } else {
      last.html = 'I could not generate a response.';
    }

    addActivity(
      `Answered: “${
        clean.length > 32 ? `${clean.slice(0, 32)}…` : clean
      }”`
    );

    /*
      Refresh the title/updated time in the history without
      leaving the current conversation.
    */
    await loadChatHistory({ render: false });
  } catch (error) {
    console.warn('AI API failed:', error.message);

    const last = state.messages[state.messages.length - 1];

    try {
      last.html =
        (await answerFor(intentFor(clean))) +
        `<p class="demo-note">
          AI service is unavailable right now,
          so I used the built-in fallback.
        </p>`;
    } catch (fallbackError) {
      console.error('Fallback AI failed:', fallbackError);
      last.html = `
        <p>
          I’m unable to answer that right now.
          Please try again.
        </p>
      `;
    }
  }

  render();

  requestAnimationFrame(() => {
    const box = $('#messages');
    if (box) box.scrollTop = box.scrollHeight;
  });
}

/* =========================
   OFFER / REORDER ACTIONS
========================= */

async function createOffer() {
  const m = merchant();

  if (!m) {
    throw new Error(
      'Please sign in first.'
    );
  }

  const id =
    `offer_${m.id.slice(-3)}_${Date.now()}`;

  const offer =
    await offerService.createOffer({
      id,

      name:
        'Slow Stock Saver',

      products:
        'Cold Drinks, Premium Tea',

      discount:
        '10% OFF',

      start:
        dateText(),

      end:
        dateText(
          new Date(
            Date.now() +
              7 *
                86400000
          )
        ),

      status:
        'Draft',

      createdBy:
        'KartaAI'
    });

  const plan =
    momentumFor(m);

  if (plan) {
    plan.status =
      'Draft';

    plan.offerId =
      offer.id;
  }

  state.modal = null;

  persist();

  state.toast =
    'Plan step complete: your offer is ready for you to publish.';

  state.messages.push({
    who: 'bot',

    html: `Done ✓

      ${resultCard(
        'Plan updated · Step 2 of 3',
        '<strong>Slow Stock Saver is ready</strong>',
        `<div class="result-rows">

          <div class="result-row">
            <span>Discount</span>
            <span>
              10% OFF
            </span>
          </div>

          <div class="result-row">
            <span>Status</span>
            <span class="warning">
              Waiting for you
            </span>
          </div>

        </div>

        <p>
          Your offer is saved.
          Publish it when you are happy with it,
          then I’ll check that it is live.
        </p>`,

        `<button
          class="primary"
          data-action="publish"
          data-id="${escapeHTML(
            offer.id
          )}"
        >
          Publish offer
        </button>`
      )}`
  });

  render();
}

async function publishOffer(id) {
  if (!id) {
    throw new Error(
      'Offer ID is missing.'
    );
  }

  const offer =
    await offerService
      .publishOffer(id);

  if (!offer) {
    throw new Error(
      'Offer could not be found.'
    );
  }

  const plan =
    momentumFor();

  if (
    plan &&
    plan.offerId === id
  ) {
    plan.status =
      'Active';

    persist();
  }

  state.toast =
    'Offer published. KartaAI is ready to verify it is live.';

  state.messages.push({
    who: 'bot',

    html: `Done ✓ Your offer is now active.

      ${resultCard(
        'Plan updated · Step 3 of 3',
        '<strong>Offer published successfully</strong>',
        `<p>
          ${escapeHTML(
            offer.name
          )}
          is active and has been added
          to your activity.
          I can now check that it is live.
        </p>`,

        `<button
          class="primary"
          data-action="verify-plan"
        >
          Verify it’s live
        </button>`
      )}`
  });

  render();
}

function verifyPlan() {
  const m = merchant();

  if (!m) {
    state.toast =
      'Please sign in first.';
    render();
    return;
  }

  const plan =
    momentumFor(m);

  if (!plan?.offerId) {
    state.toast =
      'Create and publish an offer first.';
    render();
    return;
  }

  const offer =
    m.offers?.find(
      (item) =>
        item.id ===
          plan.offerId &&
        item.status ===
          'Active'
    );

  if (!offer) {
    state.toast =
      'Publish the offer first, then I can verify it.';
    render();
    return;
  }

  plan.status =
    'Verified';

  plan.verifiedAt =
    'Just now';

  addActivity(
    `Verified ${offer.name} is active`
  );

  persist();

  state.toast =
    'Done — your plan is complete and the offer is live.';

  state.messages.push({
    who: 'bot',

    html: `Done ✓

      ${resultCard(
        'Plan complete',
        '<strong>Your offer is live and verified</strong>',
        `<div class="result-rows">

          <div class="result-row">
            <span>Offer</span>
            <span>
              ${escapeHTML(
                offer.name
              )}
            </span>
          </div>

          <div class="result-row">
            <span>Status</span>
            <span class="positive">
              Active
            </span>
          </div>

          <div class="result-row">
            <span>Verified</span>
            <span>
              Just now
            </span>
          </div>

        </div>

        <p>
          When live order data is connected,
          this same plan will show its sales
          result here.
        </p>`
      )}`
  });

  render();
}

async function createReorder() {
  const m = merchant();

  if (!m) {
    throw new Error(
      'Please sign in first.'
    );
  }

  const items =
    inventoryService
      .getLowStockProducts();

  if (!items.length) {
    state.modal = null;
    state.toast =
      'Your inventory is currently healthy.';
    render();
    return;
  }

  await inventoryService
    .createReorderRequest(
      items
    );

  state.modal = null;

  state.toast =
    'Reorder request created and added to activity.';

  addActivity(
    `Created reorder request for ${items.length} products`
  );

  state.messages.push({
    who: 'bot',

    html: `Done ✓

      ${resultCard(
        'Verified',
        '<strong>Reorder request created</strong>',
        `<p>
          A request for
          ${items.length}
          low-stock products is ready
          for supplier review.
        </p>`
      )}`
  });

  render();
}

/* =========================
   RENDER
========================= */

function render() {
  const root =
    getApp();

  if (!root) {
    console.error(
      'KartaAI: #app element was not found. Make sure index.html contains <div id="app"></div>.'
    );
    return;
  }

  try {
    let html = '';
    if (
      state.screen ===
      'welcome'
    ) {
      html =
        welcomeScreen();
    } else if (
      state.screen ===
      'auth'
    ) {
      html =
        authScreen();
    } else {
     const pages = {
  home: homePage,
  business: businessPage,
  karta: kartaPage,
  history: chatHistoryPage,
  payments: paymentHistoryPage,
  offers: offersPage,
  profile: profilePage
};

      const page =
        pages[state.page] ||
        homePage;

      html =
        page();
    }

    root.innerHTML =
      html + languageModalHTML();

    bindEvents();
  } catch (error) {
    console.error(
      'KartaAI render error:',
      error
    );

    root.innerHTML = `
      <div
        style="
          padding:40px;
          font-family:Arial,sans-serif;
        "
      >

        <h2>
          KartaAI could not render the page.
        </h2>

        <p>
          ${escapeHTML(
            error.message ||
              'Unknown error'
          )}
        </p>

        <button
          class="primary"
          onclick="location.reload()"
        >
          Reload
        </button>

      </div>
    `;
  }

  /*
    Toast timeout is stored on the state
    so multiple renders do not create
    unlimited timers.
  */
  if (
    state.toast &&
    !state.toastTimer
  ) {
    state.toastTimer =
      window.setTimeout(
        () => {
          state.toast = '';
          state.toastTimer =
            null;
          render();
        },
        3600
      );
  }
}

/* =========================
   EVENTS
========================= */

function bindEvents() {

  /* Navigation */
  document
    .querySelectorAll(
      '[data-nav]'
    )
    .forEach((el) => {
      el.addEventListener(
        'click',
        async () => {
          const page = el.dataset.nav;

          if (!page) {
            return;
          }

          state.page = page;
          render();

          if (page === 'history') {
            await loadChatHistory();
          }

          if (page === 'payments') {
            await loadPayments();
          }
        }
      );
    });

  /* Quick AI questions */
  document
    .querySelectorAll(
      '[data-query]'
    )
    .forEach((el) => {
      el.addEventListener(
        'click',
        () => {
          const query =
            el.dataset.query;

          if (query) {
            ask(query);
          }
        }
      );
    });

  /* Offer filters */
  document
    .querySelectorAll(
      '[data-filter]'
    )
    .forEach((el) => {
      el.addEventListener(
        'click',
        () => {
          state.offerFilter =
            el.dataset.filter ||
            'All';

          render();
        }
      );
    });

  /* Toast buttons */
  document
    .querySelectorAll(
      '[data-toast]'
    )
    .forEach((el) => {
      el.addEventListener(
        'click',
        () => {
          state.toast =
            el.dataset.toast ||
            '';

          render();
        }
      );
    });

  /* Forms */
  document
    .querySelectorAll(
      '[data-form]'
    )
    .forEach((form) => {
      form.addEventListener(
        'submit',
        async (event) => {
          event.preventDefault();

          const field =
            form.querySelector(
              'input'
            );

          if (!field) {
            return;
          }

          const value =
            field.value.trim();

          if (!value) {
            return;
          }

          await ask(value);
        }
      );
    });

  /* Inline language selector (e.g. Profile page) */
  document
    .querySelectorAll(
      'select[data-action="select-lang-inline"]'
    )
    .forEach((sel) => {
      sel.addEventListener(
        'change',
        (event) => {
          const lang = event.target.value;
          if (lang) {
            state.language = lang;
            localStorage.setItem('kartaai-lang', lang);
            render();
          }
        }
      );
    });

  /* Main action buttons */
  document
    .querySelectorAll(
      '[data-action]'
    )
    .forEach((el) => {

      el.addEventListener(
        'click',
        async () => {

          const action =
            el.dataset.action;

          if (!action) {
            return;
          }

          if (action === 'new-chat') {
            await createNewChat();
            return;
          }

          if (action === 'open-chat') {
            await openChat(el.dataset.id);
            return;
          }

          if (action === 'delete-chat') {
            await deleteChat(el.dataset.id);
            return;
          }

          if (action === 'clear-chat-history') {
            await clearChatHistory();
            return;
          }

          if (action === 'refresh-payments') {
            await loadPayments();
            return;
          }

          if (action === 'apply-payment-filters') {
            state.paymentSearch =
              document.querySelector('#payment-search')?.value.trim() || '';
            state.paymentStatus =
              document.querySelector('#payment-status-filter')?.value || 'All';
            state.paymentFrom =
              document.querySelector('#payment-from')?.value || '';
            state.paymentTo =
              document.querySelector('#payment-to')?.value || '';
            state.paymentPage = 1;
            await loadPayments();
            return;
          }

          if (action === 'clear-payment-filters') {
            state.paymentSearch = '';
            state.paymentStatus = 'All';
            state.paymentFrom = '';
            state.paymentTo = '';
            state.paymentPage = 1;
            await loadPayments();
            return;
          }

          if (action === 'payment-prev') {
            state.paymentPage = Math.max(1, state.paymentPage - 1);
            await loadPayments();
            return;
          }

          if (action === 'payment-next') {
            const totalPages = state.paymentData?.pagination?.totalPages || 1;
            state.paymentPage = Math.min(totalPages, state.paymentPage + 1);
            await loadPayments();
            return;
          }

          /* =====================
             LANGUAGE MODAL & SELECTION
          ===================== */

          if (
            action ===
            'open-lang-modal'
          ) {
            state.showLanguageModal =
              true;
            render();
            return;
          }

          if (
            action ===
            'close-lang-backdrop' ||
            action ===
            'close-lang-modal'
          ) {
            state.showLanguageModal =
              false;
            render();
            return;
          }

          if (
            action ===
            'select-lang'
          ) {
            const lang =
              el.dataset.lang ||
              el.closest('[data-lang]')?.dataset?.lang;

            if (lang) {
              state.language =
                lang;
              localStorage.setItem(
                'kartaai-lang',
                lang
              );
            }

            state.showLanguageModal =
              false;

            render();
            return;
          }

          /* =====================
             VOICE & SPEECH CONTROLS
          ===================== */

          if (
            action ===
            'voice-mic'
          ) {
            const target =
              el.dataset.target ||
              'home-question';
            toggleSpeechRecognition(target);
            return;
          }

          if (
            action ===
            'toggle-voice-sound'
          ) {
            state.voiceEnabled =
              !state.voiceEnabled;
            render();
            return;
          }

          if (
            action ===
            'toggle-tts'
          ) {
            const text =
              el.dataset.text || '';
            if (state.currentlySpeaking) {
              stopSpeaking();
            } else if (text) {
              speakText(text);
            }
            return;
          }

          /* =====================
             START / LOGIN
          ===================== */

          if (
            action ===
            'start'
          ) {
            state.screen =
              'auth';

            state.authMode =
              'signup';

            state.authStep =
              'mobile';

            state.toast =
              '';

            render();
            return;
          }

          if (
            action ===
            'login'
          ) {
            state.screen =
              'auth';

            state.authMode =
              'login';

            state.authStep =
              'mobile';

            state.toast =
              '';

            render();
            return;
          }

          if (
            action ===
            'back-welcome'
          ) {
            state.screen =
              'welcome';

            state.authStep =
              'mobile';

            state.toast =
              '';

            render();
            return;
          }

          /* =====================
             DEMO
          ===================== */

          if (
            action ===
            'demo'
          ) {
            state.toast =
              'Demo login is disabled. Use your real mobile number and OTP.';

            state.authMode =
              'login';

            state.authStep =
              'mobile';

            render();
            return;
          }

          /* =====================
             SEND OTP
          ===================== */

          if (
            action ===
            'continue-login'
          ) {
            const mobileField =
              $('#mobile');

            const value =
              mobileField
                ? mobileField.value.replace(
                    /\D/g,
                    ''
                  )
                : '';

            if (
              !/^\d{10}$/.test(
                value
              )
            ) {
              state.toast =
                'Enter a valid 10-digit Indian mobile number.';

              render();
              return;
            }

            state.loginNumber =
              value;

            try {
              await sendMsg91Otp(
                value
              );

              state.authStep =
                'otp';

              state.toast =
                'OTP sent successfully.';
            } catch (error) {
              console.error(
                'Send OTP failed:',
                error
              );

              state.toast =
                error?.message ||
                'Could not send OTP.';
            }

            render();
            return;
          }

          /* =====================
             RESEND OTP
          ===================== */

          if (
            action ===
            'resend-otp'
          ) {
            if (
              !state.loginNumber
            ) {
              state.toast =
                'Enter your mobile number first.';

              state.authStep =
                'mobile';

              render();
              return;
            }

            try {
              await sendMsg91Otp(
                state.loginNumber
              );

              state.toast =
                'A new OTP has been sent.';
            } catch (error) {
              console.error(
                'Resend OTP failed:',
                error
              );

              state.toast =
                error?.message ||
                'Could not resend OTP.';
            }

            render();
            return;
          }

        /* =====================
   VERIFY OTP
===================== */

if (
  action ===
  'verify'
) {
  const otpField =
    $('#otp');

  const otp =
    otpField
      ? otpField.value.trim()
      : '';

  if (
    !/^\d{4}$/.test(
      otp
    )
  ) {
    state.toast =
      'Enter the 4-digit OTP you received.';

    render();
    return;
  }

  /*
    IMPORTANT:
    A new signup does NOT have a merchant
    account yet.

    First verify the OTP.
    Then move directly to the
    business onboarding screen.

    Login is different:
    Login must load an existing
    merchant account.
  */

  try {
    const result =
      await verifyMsg91Otp(
        otp
      );

    console.log(
      'MSG91 verification result:',
      result
    );

    const accessToken =
      extractAccessToken(
        result
      );

    if (
      !accessToken
    ) {
      throw new Error(
        'MSG91 verified the OTP but did not return an access token.'
      );
    }

    state.msg91AccessToken =
      accessToken;

    const verified =
      await merchantService
        .verifyMsg91(
          accessToken,
          state.loginNumber,
          state.authMode
        );

    console.log(
      'KartaAI MSG91 server verification:',
      verified
    );

    /*
      =====================
      SIGNUP
      =====================

      IMPORTANT:
      Do NOT require
      verified.merchant.id here.

      The merchant account does
      not exist yet.
    */

    if (
      state.authMode ===
      'signup'
    ) {
      state.loginNumber =
        verified?.mobile ||
        state.loginNumber;

      state.verificationId =
        verified?.verificationId ||
        verified?.verificationID ||
        '';

      state.authStep =
        'onboard';

      state.toast =
        '';

      render();
      return;
    }

    /*
      =====================
      LOGIN
      =====================

      Login requires an
      existing merchant.
    */

    const verifiedMerchant =
      verified?.merchant ||
      verified;

    if (
      !verifiedMerchant?.id
    ) {
      throw new Error(
        'No KartaAI account was found for this mobile number. Please use Create Account.'
      );
    }

    state.loginNumber =
      verified.mobile ||
      verifiedMerchant.mobile ||
      state.loginNumber;

    state.merchantId =
      verifiedMerchant.id;

    const existingIndex =
      merchants.findIndex(
        (item) =>
          item.id ===
          verifiedMerchant.id
      );

    if (
      existingIndex >=
      0
    ) {
      merchants[
        existingIndex
      ] = {
        ...merchants[
          existingIndex
        ],
        ...verifiedMerchant
      };
    } else {
      merchants.push(
        verifiedMerchant
      );
    }
    persist();

    state.screen =
      'app';

    state.page =
      'home';

    state.currentChatId =
      null;

    state.messages =
      [];

    await refreshMerchantFromAPI();

    state.toast =
      'Login successful.';

  } catch (error) {
    console.error(
      'OTP verification flow failed:',
      error
    );

    state.toast =
      error?.message ||
      'OTP verification failed.';
  }

  render();
  return;
}

          /* =====================
             OLD MERCHANT BUTTON
          ===================== */

          if (
            action ===
            'merchant'
          ) {
            state.toast =
              'Demo merchant login is disabled. Use your real mobile number.';

            render();
            return;
          }

          /* =====================
             CREATE ACCOUNT
          ===================== */

          if (
            action ===
            'create-account'
          ) {
            const name =
              $('#merchant-name')
                ?.value
                .trim() ||
              '';

            const businessName =
              $('#business-name')
                ?.value
                .trim() ||
              '';

            const businessType =
              $('#business-type')
                ?.value ||
              'Grocery & Daily Essentials';

            const location =
              $('#location')
                ?.value
                .trim() ||
              '';

            const email =
              $('#onboard-email')
                ?.value
                .trim() ||
              '';

            if (
              !name ||
              !businessName ||
              !location
            ) {
              state.toast =
                'Please fill Name, Business Name and City / Location.';

              render();
              return;
            }

            try {
              const createdResponse =
                await merchantService
                  .createMerchant({
                    id:
                      `merchant_${Date.now()}`,

                    name,

                    businessName,

                    businessType,

                    location,

                    mobile:
                      state.loginNumber,

                    email,

                    verificationId:
                      state.verificationId
                  });

              console.log(
                'Merchant creation response:',
                createdResponse
              );

              const created =
                createdResponse?.merchant ||
                createdResponse;

              if (
                !created?.id
              ) {
                throw new Error(
                  'Account was not created correctly by the server.'
                );
              }

              const existingIndex =
                merchants.findIndex(
                  (item) =>
                    item.id ===
                    created.id
                );

              if (
                existingIndex >=
                0
              ) {
                merchants[
                  existingIndex
                ] = {
                  ...merchants[
                    existingIndex
                  ],
                  ...created
                };
              } else {
                merchants.push(
                  created
                );
              }

              state.merchantId =
                created.id;

              state.screen =
                'app';

              state.page =
                'home';

              state.currentChatId =
                null;

              state.messages =
                [];

              state.toast =
                'Welcome to KartaAI!';

              persist();

            } catch (error) {
              console.error(
                'Merchant creation error:',
                error
              );

              state.toast =
                error?.message ||
                'Could not create your account.';
            }

            render();
            return;
          }
                    /* =====================
             OFFER MODAL
          ===================== */

          if (
            action ===
            'offer'
          ) {
            state.modal =
              'offer';

            render();
            return;
          }

          /* =====================
             PLAN MODAL
          ===================== */

          if (
            action ===
            'view-plan'
          ) {
            state.modal =
              'plan';

            render();
            return;
          }

          /* =====================
             REORDER MODAL
          ===================== */

          if (
            action ===
            'reorder'
          ) {
            state.modal =
              'reorder';

            render();
            return;
          }

          /* =====================
             CLOSE MODAL
          ===================== */

          if (
            action ===
            'close-modal'
          ) {
            state.modal =
              null;

            render();
            return;
          }

          /* =====================
             APPROVE OFFER
          ===================== */

          if (
            action ===
            'approve-offer'
          ) {
            try {
              await createOffer();
            } catch (error) {
              console.error(
                'Create offer error:',
                error
              );

              state.toast =
                error?.message ||
                'Could not create the offer.';

              render();
            }

            return;
          }

          /* =====================
             PUBLISH OFFER
          ===================== */

          if (
            action ===
            'publish'
          ) {
            try {
              await publishOffer(
                el.dataset.id
              );
            } catch (error) {
              console.error(
                'Publish offer error:',
                error
              );

              state.toast =
                error?.message ||
                'Could not publish the offer.';

              render();
            }

            return;
          }

          /* =====================
             VERIFY PLAN
          ===================== */

          if (
            action ===
            'verify-plan'
          ) {
            try {
              verifyPlan();
            } catch (error) {
              console.error(
                'Verify plan error:',
                error
              );

              state.toast =
                error?.message ||
                'Could not verify the plan.';

              render();
            }

            return;
          }

          /* =====================
             APPROVE REORDER
          ===================== */

          if (
            action ===
            'approve-reorder'
          ) {
            try {
              await createReorder();
            } catch (error) {
              console.error(
                'Create reorder error:',
                error
              );

              state.toast =
                error?.message ||
                'Could not create the reorder request.';

              render();
            }

            return;
          }

          /* =====================
             LOGOUT
          ===================== */

          if (
            action ===
            'logout'
          ) {
            state.screen =
              'welcome';

            state.page =
              'home';

            state.merchantId =
              null;

            state.loginNumber =
              '';

            state.verificationId =
              '';

            state.msg91AccessToken =
              '';

            state.currentChatId =
              null;

            state.messages =
              [];

            state.modal =
              null;

            state.toast =
              '';

            msg91ReqId =
              null;

            render();
            return;
          }
        }
      );
    });
}

/* =========================
   START APPLICATION
========================= */

/*
  This is the important part that was
  missing/broken earlier.

  It ensures the application renders
  after the HTML has loaded.
*/

function startKartaAI() {
  try {
    render();
  } catch (error) {
    console.error(
      'KartaAI startup error:',
      error
    );

    const root =
      getApp();

    if (root) {
      root.innerHTML = `
        <div
          style="
            padding:40px;
            font-family:Arial,sans-serif;
          "
        >
          <h2>
            KartaAI startup error
          </h2>

          <p>
            ${escapeHTML(
              error.message ||
                'Unknown error'
            )}
          </p>

          <button
            onclick="location.reload()"
          >
            Reload
          </button>
        </div>
      `;
    }
  }
}

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    startKartaAI,
    {
      once: true
    }
  );
} else {
  startKartaAI();
}
/* =========================================
   ENTER KEY - AUTH FORM
   Press Enter instead of clicking buttons
========================================= */

document.addEventListener('keydown', function (event) {
  if (event.key !== 'Enter') return;

  const active = document.activeElement;

  if (!active) return;

  // OTP screen
  if (active.id === 'otp') {
    event.preventDefault();

    const verifyButton = document.querySelector(
      'button[data-action="verify"]'
    );

    if (verifyButton && !verifyButton.disabled) {
      verifyButton.click();
    }

    return;
  }

  // Mobile number screen
  if (active.id === 'mobile') {
    event.preventDefault();

    const sendOtpButton = document.querySelector(
      'button[data-action="continue-login"]'
    );

    if (sendOtpButton && !sendOtpButton.disabled) {
      sendOtpButton.click();
    }

    return;
  }

  // Business onboarding fields
  if (
    active.id === 'merchant-name' ||
    active.id === 'business-name' ||
    active.id === 'business-type' ||
    active.id === 'location' ||
    active.id === 'onboard-email'
  ) {
    event.preventDefault();

    const createAccountButton = document.querySelector(
      'button[data-action="create-account"]'
    );

    if (
      createAccountButton &&
      !createAccountButton.disabled
    ) {
      createAccountButton.click();
    }
  }
});
/* =========================================
   ULTRA-FAST OTP FLOW
========================================= */

let otpSending = false;
let otpVerifying = false;

document.addEventListener('input', async function (event) {

  const field = event.target;

  /* ---------- MOBILE ---------- */
  if (field?.id === 'mobile') {

    field.value = field.value.replace(/\D/g, '');

    if (
      field.value.length === 10 &&
      /^[6-9]\d{9}$/.test(field.value) &&
      !otpSending
    ) {

      otpSending = true;

      state.loginNumber = field.value;

      console.log('⚡ Sending OTP immediately...');

      try {

        await sendMsg91Otp(state.loginNumber);

        state.authStep = 'otp';
        state.toast = 'OTP sent successfully.';

        render();

      } catch (error) {

        console.error('Send OTP failed:', error);

        state.toast =
          error?.message || 'Could not send OTP.';

        render();

        otpSending = false;
      }
    }

    return;
  }


  /* ---------- OTP ---------- */
  if (field?.id === 'otp') {

    field.value = field.value.replace(/\D/g, '');

    if (
      field.value.length === 4 &&
      !otpVerifying
    ) {

      otpVerifying = true;

      const otp = field.value;

      console.log('⚡ Verifying OTP immediately...');

      try {

        const result =
          await verifyMsg91Otp(otp);

        const accessToken =
          extractAccessToken(result);

        if (!accessToken) {
          throw new Error(
            'MSG91 verified the OTP but did not return an access token.'
          );
        }

        state.msg91AccessToken = accessToken;

        const verified =
          await merchantService.verifyMsg91(
            accessToken,
            state.loginNumber,
            state.authMode
          );

        if (state.authMode === 'signup') {

          state.loginNumber =
            verified?.mobile ||
            state.loginNumber;

          state.verificationId =
            verified?.verificationId ||
            verified?.verificationID ||
            '';

          state.authStep = 'onboard';

          state.toast = '';

          render();

          return;
        }

        const verifiedMerchant =
          verified?.merchant || verified;

        if (!verifiedMerchant?.id) {
          throw new Error(
            'No KartaAI account was found for this mobile number.'
          );
        }

        state.merchantId =
          verifiedMerchant.id;

        state.screen = 'app';
        state.page = 'home';
        state.currentChatId = null;
        state.messages = [];

        await refreshMerchantFromAPI();

        state.toast = 'Login successful.';

        render();

      } catch (error) {

        console.error(
          'Instant OTP verification failed:',
          error
        );

        state.toast =
          error?.message ||
          'OTP verification failed.';

        render();

        otpVerifying = false;
      }
    }
  }

});
// Remove only the duplicate English selector from the bottom-left sidebar
function removeDuplicateSidebarLanguage() {
    const elements = document.querySelectorAll(
        'button, [role="button"], a'
    );

    elements.forEach((el) => {
        const text = el.textContent.trim();

        if (
            text.includes("English") &&
            !text.includes("KartaAI")
        ) {
            const rect = el.getBoundingClientRect();

            // Bottom-left sidebar English button
            if (
                rect.left < 300 &&
                rect.top > window.innerHeight * 0.65
            ) {
                el.remove();
            }
        }
    });
}

// Run after page loads
document.addEventListener("DOMContentLoaded", () => {
    removeDuplicateSidebarLanguage();

    setTimeout(removeDuplicateSidebarLanguage, 500);
    setTimeout(removeDuplicateSidebarLanguage, 1500);
});

// Handle dynamically rendered UI
const languageObserver = new MutationObserver(() => {
    removeDuplicateSidebarLanguage();
});

languageObserver.observe(document.body, {
    childList: true,
    subtree: true
});