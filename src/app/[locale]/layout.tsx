import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

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
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-background" dir={direction}>
        {/* Modern Clean Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link href={`/${locale}`} className="flex items-center space-x-2">
                <span className="font-bold text-xl">Iran Revolution Platform</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/regime-members`}>{t("regimeMembers")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/victims`}>{t("victims")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/actions`}>{t("actions")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/pending`}>{t("pending")}</Link>
                </Button>
              </nav>
            </div>
            <LanguageSwitcher locale={locale} />
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-8 md:py-12">{children}</main>

        {/* Minimal Footer */}
        <footer className="border-t">
          <div className="container flex flex-col gap-4 py-10 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Iran Revolution Accountability Platform</p>
              <p className="text-sm text-muted-foreground">
                Documentation & Verification System
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
