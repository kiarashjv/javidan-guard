import Image from "next/image";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Archive, Clock, Crosshair, Crown, Mail, Send, Heart } from "lucide-react";
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
  const tFooter = await getTranslations({ locale, namespace: "footer" });
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

                {/* Social Links */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold">{tFooter("social")}</h4>
                  <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                      <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                      <a href="#" aria-label="Telegram" className="text-muted-foreground hover:text-foreground">
                        <Send className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                      <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                        </svg>
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                      <a href={`mailto:${tFooter("email")}`} aria-label="Email" className="text-muted-foreground hover:text-foreground">
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
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
                </nav>
              </div>

              {/* Support & Legal */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold">{tFooter("support")}</h4>
                <nav className="flex flex-col gap-2">
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5" />
                    {tFooter("donate")}
                  </a>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {tFooter("contribute")}
                  </a>
                </nav>

                <h4 className="text-sm font-semibold mt-2">{tFooter("legal")}</h4>
                <nav className="flex flex-col gap-2">
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {tFooter("privacy")}
                  </a>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {tFooter("terms")}
                  </a>
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
