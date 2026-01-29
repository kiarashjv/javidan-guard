import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VictimsPage() {
  const t = useTranslations("victims");

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 text-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
          <p className="text-base text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button className="w-fit">{t("ctaReport")}</Button>
      </div>

      <Card className="border border-zinc-200">
        <CardHeader>
          <CardTitle>{t("placeholderTitle")}</CardTitle>
          <CardDescription>{t("placeholderSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600">
          {t("placeholderBody")}
        </CardContent>
      </Card>
    </section>
  );
}
