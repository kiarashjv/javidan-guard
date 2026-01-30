"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex-api";
import { VersionTimeline } from "@/components/history/VersionTimeline";

export default function ActionHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("history");
  const actionsT = useTranslations("actions");
  const locale = useLocale();
  const history = useQuery(api.history.actions, { id });

  if (history === undefined) {
    return <div className="text-sm text-zinc-500">{t("loading")}</div>;
  }

  if (!history) {
    return <div className="text-sm text-zinc-500">{t("empty")}</div>;
  }

  const timelineItems = [
    {
      id: history.current._id,
      label: actionsT(`types.${history.current.actionType}`),
      description: history.current.location,
      timestamp: history.current.createdAt,
      isCurrent: true,
      meta: [
        { label: actionsT("form.date"), value: history.current.date },
        { label: actionsT("form.location"), value: history.current.location },
      ],
      details: history.current.description,
    },
    ...history.history.map((item) => ({
      id: item._id,
      label: actionsT(`types.${item.actionType}`),
      description: item.location,
      timestamp: item.createdAt,
      meta: [
        { label: actionsT("form.date"), value: item.date },
        { label: actionsT("form.location"), value: item.location },
      ],
      details: item.description,
    })),
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-zinc-900">{t("title")}</h1>
          <p className="text-sm text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/actions/${id}`}>{t("back")}</Link>
        </Button>
      </div>
      <VersionTimeline items={timelineItems} />
    </section>
  );
}
