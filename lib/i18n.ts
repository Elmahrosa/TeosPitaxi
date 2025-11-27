// Internationalization configuration for Arabic/English support

export type Locale = "en" | "ar"

export const locales: Locale[] = ["en", "ar"]
export const defaultLocale: Locale = "en"

export interface Translations {
  // Common
  appName: string
  tagline: string
  helloWorld: string
  payWithPi: string
  signIn: string
  signOut: string
  loading: string

  // Navigation
  rider: string
  driver: string
  agent: string
  delivery: string
  admin: string
  transparency: string

  // Rider App
  pickupLocation: string
  destination: string
  whereTo: string
  findRide: string
  chooseRide: string
  confirmRide: string
  bookRide: string
  schedule: string
  favorites: string
  history: string

  // Driver App
  online: string
  offline: string
  acceptingRides: string
  notAccepting: string
  todayEarnings: string
  completedRides: string
  onlineTime: string
  rating: string

  // Agent App
  totalEarnings: string
  totalReferrals: string
  referralCode: string
  shareCode: string
  driverReferral: string
  riderReferral: string

  // Delivery
  packageSize: string
  recipientPhone: string
  packageDescription: string
  findCourier: string

  // Payment
  paymentDetails: string
  amount: string
  service: string
  escrowProtection: string
  paymentSuccessful: string
  paymentFailed: string
  fundsHeldEscrow: string

  // Admin
  platformStats: string
  userManagement: string
  transactions: string
  verification: string
  pendingVerifications: string

  // Common Actions
  back: string
  cancel: string
  confirm: string
  retry: string
  viewAll: string
  close: string
}

export const translations: Record<Locale, Translations> = {
  en: {
    // Common
    appName: "TEOSPITAXI",
    tagline: "Civic-first mobility, powered by Pi",
    helloWorld: "Hello World",
    payWithPi: "Pay with Pi",
    signIn: "Sign In",
    signOut: "Sign Out",
    loading: "Loading",

    // Navigation
    rider: "Rider",
    driver: "Driver",
    agent: "Global Agent",
    delivery: "Bike Delivery",
    admin: "Admin",
    transparency: "Transparency",

    // Rider App
    pickupLocation: "Pickup location",
    destination: "Destination",
    whereTo: "Where to?",
    findRide: "Find a Ride",
    chooseRide: "Choose a ride",
    confirmRide: "Confirm Ride",
    bookRide: "Book a Ride",
    schedule: "Schedule",
    favorites: "Favorites",
    history: "History",

    // Driver App
    online: "Online",
    offline: "Offline",
    acceptingRides: "Accepting ride requests",
    notAccepting: "Not accepting rides",
    todayEarnings: "Today's Earnings",
    completedRides: "Completed rides",
    onlineTime: "Online time",
    rating: "Rating",

    // Agent App
    totalEarnings: "Total Earnings",
    totalReferrals: "Total referrals",
    referralCode: "Your Referral Code",
    shareCode: "Share this code to onboard new drivers and riders",
    driverReferral: "Driver Referral",
    riderReferral: "Rider Referral",

    // Delivery
    packageSize: "Package size",
    recipientPhone: "Recipient phone number",
    packageDescription: "Package description",
    findCourier: "Find a Courier",

    // Payment
    paymentDetails: "Payment Details",
    amount: "Amount",
    service: "Service",
    escrowProtection: "Escrow Protection",
    paymentSuccessful: "Payment Successful",
    paymentFailed: "Payment Failed",
    fundsHeldEscrow: "Funds held in escrow",

    // Admin
    platformStats: "Platform Statistics",
    userManagement: "User Management",
    transactions: "Transactions",
    verification: "Verification",
    pendingVerifications: "Pending Verifications",

    // Common Actions
    back: "Back",
    cancel: "Cancel",
    confirm: "Confirm",
    retry: "Retry",
    viewAll: "View All",
    close: "Close",
  },
  ar: {
    // Common - Arabic translations
    appName: "تيوس بي تاكسي",
    tagline: "خدمة تنقل مدنية، مدعومة بعملة باي",
    helloWorld: "مرحبا بالعالم",
    payWithPi: "ادفع بعملة باي",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    loading: "جاري التحميل",

    // Navigation
    rider: "راكب",
    driver: "سائق",
    agent: "وكيل عالمي",
    delivery: "توصيل بالدراجة",
    admin: "المسؤول",
    transparency: "الشفافية",

    // Rider App
    pickupLocation: "موقع الاستلام",
    destination: "الوجهة",
    whereTo: "إلى أين؟",
    findRide: "ابحث عن رحلة",
    chooseRide: "اختر رحلة",
    confirmRide: "تأكيد الرحلة",
    bookRide: "احجز رحلة",
    schedule: "جدولة",
    favorites: "المفضلة",
    history: "السجل",

    // Driver App
    online: "متصل",
    offline: "غير متصل",
    acceptingRides: "قبول طلبات الرحلات",
    notAccepting: "عدم قبول الرحلات",
    todayEarnings: "أرباح اليوم",
    completedRides: "الرحلات المكتملة",
    onlineTime: "وقت الاتصال",
    rating: "التقييم",

    // Agent App
    totalEarnings: "إجمالي الأرباح",
    totalReferrals: "إجمالي الإحالات",
    referralCode: "كود الإحالة الخاص بك",
    shareCode: "شارك هذا الكود لتسجيل سائقين وركاب جدد",
    driverReferral: "إحالة سائق",
    riderReferral: "إحالة راكب",

    // Delivery
    packageSize: "حجم الطرد",
    recipientPhone: "رقم هاتف المستلم",
    packageDescription: "وصف الطرد",
    findCourier: "ابحث عن مندوب",

    // Payment
    paymentDetails: "تفاصيل الدفع",
    amount: "المبلغ",
    service: "الخدمة",
    escrowProtection: "حماية الضمان",
    paymentSuccessful: "نجح الدفع",
    paymentFailed: "فشل الدفع",
    fundsHeldEscrow: "الأموال محفوظة في الضمان",

    // Admin
    platformStats: "إحصائيات المنصة",
    userManagement: "إدارة المستخدمين",
    transactions: "المعاملات",
    verification: "التحقق",
    pendingVerifications: "التحققات المعلقة",

    // Common Actions
    back: "رجوع",
    cancel: "إلغاء",
    confirm: "تأكيد",
    retry: "إعادة المحاولة",
    viewAll: "عرض الكل",
    close: "إغلاق",
  },
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale]
}
