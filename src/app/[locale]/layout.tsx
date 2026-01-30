import Image from "next/image";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Archive, Clock, Crosshair, Crown } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { UpdatesSidebar } from "@/components/updates/UpdatesSidebar";

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
      <div className="min-h-screen flex flex-col bg-background" dir={direction}>
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
              </nav>
            </div>
            <LanguageSwitcher locale={locale} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 md:px-6 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>{children}</div>
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <UpdatesSidebar />
              </div>
            </div>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="mt-auto border-t">
          <div className="mx-auto max-w-7xl w-full flex flex-col gap-4 py-10 px-4 md:px-6 md:flex-row md:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">{t("brandName")}</p>
              <p className="text-sm text-muted-foreground">
                {t("brandTagline")}
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
