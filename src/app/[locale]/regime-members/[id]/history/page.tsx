"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex-api";
import { VersionTimeline } from "@/components/history/VersionTimeline";

export default function RegimeMemberHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("history");
  const membersT = useTranslations("regimeMembers");
  const locale = useLocale();
  const history = useQuery(api.history.regimeMembers, { id });

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
      description: `${history.current.organization} · ${history.current.unit}`,
      timestamp: history.current.createdAt,
      isCurrent: true,
      meta: [
        {
          label: membersT("form.status"),
          value: membersT(`status.${history.current.status}`),
        },
        { label: membersT("form.location"), value: history.current.lastKnownLocation },
      ],
      details: history.current.position,
    },
    ...history.history.map((item) => ({
      id: item._id,
      label: item.name,
      description: `${item.organization} · ${item.unit}`,
      timestamp: item.createdAt,
      meta: [
        {
          label: membersT("form.status"),
          value: membersT(`status.${item.status}`),
        },
        { label: membersT("form.location"), value: item.lastKnownLocation },
      ],
      details: item.position,
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
          <Link href={`/${locale}/regime-members/${id}`}>{t("back")}</Link>
        </Button>
      </div>
      <VersionTimeline items={timelineItems} />
    </section>
  );
}
