"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PiProvider } from "@/contexts/pi-context"
import { useLocale } from "@/contexts/locale-context"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { TeosLogo } from "@/components/teos-logo"
import { AIChat } from "@/components/ai-chat"
import Link from "next/link"
import { Car, Package, Users, Shield, Globe, Zap, MessageCircle } from "lucide-react"

export default function HomePage() {
  const { t, isRTL } = useLocale()

  return (
    <PiProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeosLogo size="sm" />
                <div>
                  <h1 className="text-xl font-bold">{t.appName}</h1>
                  <p className="text-xs text-muted-foreground">{t.tagline}</p>
                </div>
              </div>
              <LocaleSwitcher />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              {isRTL ? "انطلاقاً من الإسكندرية، مصر" : "Launching in Alexandria, Egypt"}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              {t.helloWorld}
              <span className="inline-block ml-2">⭐️</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-3 text-pretty">
              {isRTL ? "منصة تنقل شفافة مدعومة بشبكة باي" : "Transparent mobility platform powered by Pi Network"}
            </p>
            <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto text-pretty">
              {isRTL
                ? "احجز رحلات، أرسل الطرود، وكن وكيلاً عالمياً مع مدفوعات آمنة بعملة باي المشفرة"
                : "Book rides, send parcels, and become a global agent with secure Pi cryptocurrency payments"}
            </p>

            <div className="bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-sm font-medium mb-2">
                {isRTL ? "🚀 انضم إلى شبكة باي باستخدام رمزنا!" : "🚀 Join Pi Network with our referral code!"}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="text-lg font-bold text-primary">aams1969</span>
                <a
                  href="https://minepi.com/aams1969"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button size="sm" variant="default" className="gap-2">
                    <span className="text-accent">π</span>
                    {isRTL ? "انضم الآن" : "Join Pi Network"}
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isRTL
                  ? "انضم إلى ثورة العملات المشفرة المجتمعية"
                  : "Join the community-powered cryptocurrency revolution"}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/rider">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  <Car className={`h-5 w-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t.bookRide}
                </Button>
              </Link>
              <Link href="/driver">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 bg-transparent">
                  <Users className={`h-5 w-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {isRTL ? "كن سائقاً" : "Become a Driver"}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <Card className="p-4">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">{isRTL ? "مدفوعات باي" : "Pi Payments"}</div>
              </Card>
              <Card className="p-4">
                <div className="text-3xl font-bold text-primary">0%</div>
                <div className="text-sm text-muted-foreground">{isRTL ? "رسوم مخفية" : "Hidden Fees"}</div>
              </Card>
              <Card className="p-4">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">{isRTL ? "دعم" : "Support"}</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold mb-12 text-center">{isRTL ? "خدماتنا" : "Our Services"}</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/rider">
                <Card className="p-6 hover:border-primary transition-all cursor-pointer h-full">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{isRTL ? "خدمات التاكسي" : "Taxi Services"}</h4>
                  <p className="text-muted-foreground mb-4">
                    {isRTL
                      ? "احجز رحلات بأسعار باي شفافة. بدون زيادات أو رسوم مخفية."
                      : "Book rides with transparent Pi pricing. No surge fees, no hidden costs."}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <span className="text-accent">π</span>
                    {isRTL ? "السعر من عرض الخادم" : "Server-quoted fares"}
                  </div>
                </Card>
              </Link>

              <Link href="/delivery">
                <Card className="p-6 hover:border-primary transition-all cursor-pointer h-full">
                  <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-accent" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{isRTL ? "توصيل بالدراجة" : "Bike Delivery"}</h4>
                  <p className="text-muted-foreground mb-4">
                    {isRTL
                      ? "توصيل سريع للطرود بالدراجات عندما تكون الخدمة الموثوقة متاحة."
                      : "Fast parcel delivery by bike couriers when the trusted service is available."}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <span className="text-accent">π</span>
                    {isRTL ? "السعر من عرض الخادم" : "Server-quoted fares"}
                  </div>
                </Card>
              </Link>

              <Link href="/agent">
                <Card className="p-6 hover:border-primary transition-all cursor-pointer h-full">
                  <div className="h-12 w-12 bg-chart-3/10 rounded-xl flex items-center justify-center mb-4">
                    <Globe className="h-6 w-6 text-chart-3" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{isRTL ? "الوكلاء العالميون" : "Global Agents"}</h4>
                  <p className="text-muted-foreground mb-4">
                    {isRTL
                      ? "انضم كوكيل. يتم اشتقاق الأهلية وعمولة 5% من الخادم."
                      : "Join as an agent. Eligibility and 5% commission are derived server-side."}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <span className="text-accent">π</span>
                    {isRTL ? "اكسب عمولة" : "Earn commission"}
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold mb-12 text-center">
              {isRTL ? "لماذا تيوس بي تاكسي؟" : "Why TEOSPITAXI?"}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-accent">π</span>
                </div>
                <h4 className="font-semibold mb-2">{t.payWithPi}</h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "مدفوعات باي مع تحقق من الخادم الموثوق"
                    : "Pi payments verified through a trusted server boundary"}
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">{isRTL ? "حوكمة شفافة" : "Transparent Governance"}</h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "نهج مدني أولاً مع سجلات تدقيق الخادم عند الربط"
                    : "Civic-first approach with server audit records when connected"}
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="h-16 w-16 bg-chart-3/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-chart-3" />
                </div>
                <h4 className="font-semibold mb-2">{isRTL ? "سريع وآمن" : "Fast & Secure"}</h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "تتبع في الوقت الفعلي مع اتصالات مشفرة" : "Real-time tracking with encrypted communications"}
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="h-16 w-16 bg-chart-4/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-chart-4" />
                </div>
                <h4 className="font-semibold mb-2">{isRTL ? "شبكة عالمية" : "Global Network"}</h4>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? "البداية في الإسكندرية، التوسع عبر منطقة الشرق الأوسط"
                    : "Starting in Alexandria, expanding across MENA region"}
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-6">{isRTL ? "انضم إلى مجتمعنا" : "Join Our Community"}</h3>
            <p className="text-muted-foreground mb-8">
              {isRTL
                ? "تواصل معنا واحصل على آخر التحديثات والدعم"
                : "Stay connected and get the latest updates and support"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://t.me/teospitaxi" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full gap-2 bg-transparent">
                  <MessageCircle className="h-5 w-5" />
                  {isRTL ? "انضم إلى تيليجرام" : "Join Telegram Channel"}
                </Button>
              </a>
              <a
                href="https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="lg" variant="outline" className="w-full gap-2 bg-transparent">
                  <MessageCircle className="h-5 w-5" />
                  {isRTL ? "انضم إلى واتساب" : "Join WhatsApp Channel"}
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 py-6 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TeosLogo size="sm" />
              <span className="text-xl font-bold">{t.appName}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t.tagline}</p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-4 flex-wrap">
              <Link href="/admin" className="hover:text-foreground transition-colors">
                {t.admin}
              </Link>
              <Link href="/transparency" className="hover:text-foreground transition-colors">
                {t.transparency}
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                {isRTL ? "الشروط والأحكام" : "Terms of Service"}
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-4">
              <a
                href="https://t.me/teospitaxi"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {isRTL ? "تيليجرام" : "Telegram"}
              </a>
              <a
                href="https://whatsapp.com/channel/0029VbBkdhP4IBhDSAW6Gw2u"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {isRTL ? "واتساب" : "WhatsApp"}
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {isRTL
                ? "© 2025 تيوس بي تاكسي - جزء من مشاريع المحروسة"
                : "© 2025 TeosPiTaxi - Part of Elmahrosa Projects"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {isRTL ? "تأسست بواسطة" : "Founded by"} <span className="font-semibold">aams1969</span>
            </p>
          </div>
        </footer>

        <AIChat />
      </div>
    </PiProvider>
  )
}
