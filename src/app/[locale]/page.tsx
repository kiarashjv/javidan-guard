import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("home");

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-zinc-900">
          {t("title")}
        </h1>
        <p className="text-base leading-7 text-zinc-600">{t("subtitle")}</p>
      </div>
      <Card className="border border-zinc-200">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row">
          <Button>{t("ctaPrimary")}</Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/regime-members`}>{t("ctaSecondary")}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
