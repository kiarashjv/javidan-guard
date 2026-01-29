"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
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
import { api } from "@/lib/convex-api";

export default function RegimeMemberDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = useLocale();
  const t = useTranslations("regimeMember");
  const member = useQuery(api.regimeMembers.getById, { id: params.id });

  if (member === undefined) {
    return <div className="text-sm text-zinc-500">{t("loading")}</div>;
  }

  if (!member) {
    return <div className="text-sm text-zinc-500">{t("notFound")}</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-start">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/regime-members`}>{t("back")}</Link>
        </Button>
      </div>

      <Card className="border border-zinc-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{member.name}</CardTitle>
            <Badge variant="secondary">{t(`status.${member.status}`)}</Badge>
          </div>
          <CardDescription>
            {member.organization} · {member.unit}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-600">
          <div>
            {t("recordId")}: {member._id}
          </div>
          <div>
            {t("location")}: {member.lastKnownLocation}
          </div>
          <div>{t("notes")}</div>
        </CardContent>
      </Card>
    </section>
  );
}
