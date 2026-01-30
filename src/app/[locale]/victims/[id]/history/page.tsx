"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex-api";
import { VersionTimeline } from "@/components/history/VersionTimeline";

export default function VictimHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("history");
  const victimsT = useTranslations("victims");
  const locale = useLocale();
  const history = useQuery(api.history.victims, { id });

  if (history === undefined) {
    return <div className="text-sm text-zinc-500">{t("loading")}</div>;
  }

  if (!history) {
    return <div className="text-sm text-zinc-500">{t("empty")}</div>;
  }

  const timelineItems = [
    {
      id: history.current._id,
      label: history.current.name,
      description: history.current.incidentLocation,
      timestamp: history.current.createdAt,
      isCurrent: true,
      meta: [
        { label: victimsT("form.status"), value: victimsT(`status.${history.current.status}`) },
        { label: victimsT("form.incidentDate"), value: history.current.incidentDate },
      ],
      details: history.current.circumstances,
    },
    ...history.history.map((item) => ({
      id: item._id,
      label: item.name,
      description: item.incidentLocation,
      timestamp: item.createdAt,
      meta: [
        { label: victimsT("form.status"), value: victimsT(`status.${item.status}`) },
        { label: victimsT("form.incidentDate"), value: item.incidentDate },
      ],
      details: item.circumstances,
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
          <Link href={`/${locale}/victims/${id}`}>{t("back")}</Link>
        </Button>
      </div>
      <VersionTimeline items={timelineItems} />
    </section>
  );
}
