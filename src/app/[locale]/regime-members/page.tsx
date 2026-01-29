"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "convex/react";
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
import { api } from "@/lib/convex-api";

export default function RegimeMembersPage() {
  const locale = useLocale();
  const t = useTranslations("regimeMembers");
  const members = useQuery(api.regimeMembers.listCurrent, {});

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

      {members === undefined ? (
        <div className="text-sm text-zinc-500">{t("loading")}</div>
      ) : members.length === 0 ? (
        <div className="text-sm text-zinc-500">{t("empty")}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <Card key={member._id} className="border border-zinc-200">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <Badge variant="secondary">
                    {t(`status.${member.status}`)}
                  </Badge>
                </div>
                <CardDescription>
                  {member.organization} · {member.unit}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-zinc-600">
                  {t("lastKnownLocation")}: {member.lastKnownLocation}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/regime-members/${member._id}`}>
                    {t("viewProfile")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
