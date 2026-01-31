import Image from "next/image";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Archive, BookOpen, Clock, Crosshair, Crown } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { UpdatesMarquee } from "@/components/updates/UpdatesMarquee";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : null;

  if (!locale) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: "nav" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen flex flex-col bg-background" dir={direction}>
        <UpdatesMarquee />

        {/* Modern Clean Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="mx-auto max-w-7xl w-full flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-6">
              <Link href={`/${locale}`} className="flex items-center gap-3">
                <Image
                  src="/LION.png"
                  alt={t("brandName")}
                  width={48}
                  height={48}
                  className="h-12 w-12"
                />
                <span className="font-bold text-xl">{t("brandName")}</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/regime-members`} className="flex items-center gap-2">
                    <Crosshair className="h-4 w-4" />
                    {t("regimeMembers")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/victims`} className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    {t("victims")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/actions`} className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    {t("actions")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/pending`} className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t("pending")}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/guide`} className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {t("guide")}
                  </Link>
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <MobileNav />
              <LanguageSwitcher locale={locale} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 md:px-6 md:py-12">
          {children}
        </main>

        {/* Enhanced Footer */}
        <footer className="mt-auto border-t bg-muted/30">
          <div className="mx-auto max-w-7xl w-full px-4 py-12 md:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {/* About Section */}
              <div className="flex flex-col gap-4 lg:col-span-2">
                <div className="flex items-center gap-3">
                  <Image
                    src="/LION.png"
                    alt={t("brandName")}
                    width={40}
                    height={40}
                    className="h-10 w-10"
                  />
                  <h3 className="font-bold text-lg">{t("brandName")}</h3>
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  {tFooter("mission")}
                </p>

              </div>

              {/* Quick Links */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold">{tFooter("quickLinks")}</h4>
                <nav className="flex flex-col gap-2">
                  <Link href={`/${locale}/regime-members`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t("regimeMembers")}
                  </Link>
                  <Link href={`/${locale}/victims`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t("victims")}
                  </Link>
                  <Link href={`/${locale}/actions`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t("actions")}
                  </Link>
                  <Link href={`/${locale}/pending`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t("pending")}
                  </Link>
                  <Link href={`/${locale}/guide`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t("guide")}
                  </Link>
                </nav>
              </div>

              {/* Support & Legal */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold">{tFooter("support")}</h4>
                <nav className="flex flex-col gap-2">
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {tFooter("contribute")}
                  </a>
                </nav>

                <h4 className="text-sm font-semibold mt-2">{tFooter("legal")}</h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    href={`/${locale}/privacy`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tFooter("privacy")}
                  </Link>
                  <Link
                    href={`/${locale}/terms`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tFooter("terms")}
                  </Link>
                </nav>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground text-center">
                {tFooter("copyright", { year: new Date().getFullYear() })}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
