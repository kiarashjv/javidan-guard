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

  const versions = [history.current, ...history.history];
  const timelineItems = versions.map((item, index) => {
    const previous = versions[index + 1];
    const changes = previous ? buildChanges(item, previous, actionsT) : undefined;

    return {
      id: item._id,
      label: actionsT(`types.${item.actionType}`),
      description: item.location,
      timestamp: item.createdAt,
      isCurrent: index === 0,
      meta: [
        { label: actionsT("form.date"), value: item.date },
        { label: actionsT("form.location"), value: item.location },
      ],
      details: item.description,
      changes,
    };
  });

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

function buildChanges(
  current: {
    actionType: string;
    date: string;
    location: string;
    description: string;
  },
  previous: {
    actionType: string;
    date: string;
    location: string;
    description: string;
  },
  t: ReturnType<typeof useTranslations>
) {
  const changes: { label: string; before: string; after: string }[] = [];
  const fields = [
    {
      key: "actionType",
      label: t("form.actionType"),
      format: (value: string) => t(`types.${value}`),
    },
    { key: "date", label: t("form.date"), format: (value: string) => value },
    {
      key: "location",
      label: t("form.location"),
      format: (value: string) => value,
    },
    {
      key: "description",
      label: t("form.description"),
      format: (value: string) => value,
    },
  ] as const;

  fields.forEach((field) => {
    const before = field.format(previous[field.key]);
    const after = field.format(current[field.key]);
    if (before !== after) {
      changes.push({ label: field.label, before, after });
    }
  });

  return changes;
}
