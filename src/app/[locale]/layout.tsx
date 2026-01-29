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
      <div className="min-h-screen bg-zinc-50 text-zinc-950" dir={direction}>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="text-sm font-semibold tracking-wide">
                Iran Revolution Accountability Platform
              </div>
              <nav className="flex flex-wrap gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/regime-members`}>{t("regimeMembers")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/victims`}>{t("victims")}</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/pending`}>{t("pending")}</Link>
                </Button>
              </nav>
            </div>
            <LanguageSwitcher locale={locale} />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
