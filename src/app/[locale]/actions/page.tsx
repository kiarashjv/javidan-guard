"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/convex-api";

export default function ActionsPage() {
  const locale = useLocale();
  const t = useTranslations("actions");
  const actions = useQuery(api.actions.listCurrent, {});

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
        <p className="text-base text-zinc-600">{t("subtitle")}</p>
      </div>

      {actions === undefined ? (
        <div className="text-sm text-zinc-500">{t("loading")}</div>
      ) : actions.length === 0 ? (
        <div className="text-sm text-zinc-500">{t("empty")}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {actions.map((action) => {
            const typed = action as {
              _id: string;
              actionType: string;
              location: string;
              date: string;
              description: string;
            };

            return (
              <Card key={typed._id} className="border border-zinc-200">
                <CardHeader>
                  <CardTitle>{typed.actionType}</CardTitle>
                  <CardDescription>
                    {typed.location} · {typed.date}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-zinc-600">
                  <div>{typed.description}</div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${locale}/actions/${typed._id}`}>{t("view")}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
