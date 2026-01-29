import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("home");

  return (
    <div className="flex flex-col gap-16">
      {/* Modern Hero Section */}
      <section className="flex flex-col items-center text-center gap-6 py-20">
        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
          Documentation & Verification
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          {t("title")}
        </h1>
        <p className="max-w-175 text-lg text-muted-foreground sm:text-xl">
          {t("subtitle")}
        </p>
        <div className="flex flex-col gap-2 min-[400px]:flex-row">
          <Button size="lg">{t("ctaPrimary")}</Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/${locale}/regime-members`}>{t("ctaSecondary")}</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regime Members</CardTitle>
            <CardDescription>
              Document and track regime officials and their actions
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Victims</CardTitle>
            <CardDescription>
              Honor and remember those affected by the regime
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verified Records</CardTitle>
            <CardDescription>
              Community-verified documentation with full transparency
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
