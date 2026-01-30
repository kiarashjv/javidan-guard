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

  const versions = [history.current, ...history.history];
  const timelineItems = versions.map((item, index) => {
    const previous = versions[index + 1];
    const changes = previous
      ? buildChanges(item, previous, membersT)
      : undefined;

    return {
      id: item._id,
      label: item.name,
      description: `${item.organization} · ${item.unit}`,
      timestamp: item.createdAt,
      isCurrent: index === 0,
      meta: [
        {
          label: membersT("form.status"),
          value: membersT(`status.${item.status}`),
        },
        { label: membersT("form.location"), value: item.lastKnownLocation },
      ],
      details: item.position,
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
          <Link href={`/${locale}/regime-members/${id}`}>{t("back")}</Link>
        </Button>
      </div>
      <VersionTimeline items={timelineItems} />
    </section>
  );
}

function buildChanges(
  current: {
    name: string;
    organization: string;
    unit: string;
    position: string;
    rank: string;
    status: string;
    lastKnownLocation: string;
  },
  previous: {
    name: string;
    organization: string;
    unit: string;
    position: string;
    rank: string;
    status: string;
    lastKnownLocation: string;
  },
  t: ReturnType<typeof useTranslations>
) {
  const changes: { label: string; before: string; after: string }[] = [];
  const fields = [
    {
      key: "name",
      label: t("form.name"),
      format: (value: string) => value,
    },
    {
      key: "organization",
      label: t("form.organization"),
      format: (value: string) => value,
    },
    { key: "unit", label: t("form.unit"), format: (value: string) => value },
    {
      key: "position",
      label: t("form.position"),
      format: (value: string) => value,
    },
    { key: "rank", label: t("form.rank"), format: (value: string) => value },
    {
      key: "status",
      label: t("form.status"),
      format: (value: string) => t(`status.${value}`),
    },
    {
      key: "lastKnownLocation",
      label: t("form.location"),
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
