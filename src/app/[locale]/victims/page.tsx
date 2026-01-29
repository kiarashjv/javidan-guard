"use client";

import { useTranslations } from "next-intl";
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

export default function VictimsPage() {
  const t = useTranslations("victims");
  const victims = useQuery(api.victims.listCurrent, {});

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 text-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
          <p className="text-base text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button className="w-fit">{t("ctaReport")}</Button>
      </div>

      {victims === undefined ? (
        <div className="text-sm text-zinc-500">{t("loading")}</div>
      ) : victims.length === 0 ? (
        <div className="text-sm text-zinc-500">{t("empty")}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {victims.map((victim) => (
            <Card key={victim._id} className="border border-zinc-200">
              <CardHeader>
                <CardTitle>{victim.name}</CardTitle>
                <CardDescription>
                  {victim.incidentLocation} · {victim.incidentDate}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-zinc-600">
                {victim.circumstances}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
