import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const sampleMembers = [
  {
    id: "s1",
    name: "Hossein Rahimi",
    role: "IRGC - Tehran Unit",
    status: "active",
    location: "Tehran",
  },
  {
    id: "s2",
    name: "Majid Arjmand",
    role: "Basij - District 3",
    status: "unknown",
    location: "Shiraz",
  },
  {
    id: "s3",
    name: "Parviz Khodadadi",
    role: "Police - Special Forces",
    status: "fled",
    location: "Tabriz",
  },
];

export default function RegimeMembersPage() {
  const locale = useLocale();
  const t = useTranslations("regimeMembers");

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 text-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
          <p className="text-base text-zinc-600">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder={t("searchPlaceholder")} className="sm:max-w-sm" />
          <Button>{t("ctaReport")}</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sampleMembers.map((member) => (
          <Card key={member.id} className="border border-zinc-200">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <Badge variant="secondary">{t(`status.${member.status}`)}</Badge>
              </div>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-zinc-600">
                {t("lastKnownLocation")}: {member.location}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/${locale}/regime-members/${member.id}`}>
                  {t("viewProfile")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
