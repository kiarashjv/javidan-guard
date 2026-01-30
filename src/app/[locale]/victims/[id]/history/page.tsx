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

  const versions = [history.current, ...history.history];
  const timelineItems = versions.map((item, index) => {
    const previous = versions[index + 1];
    const changes = previous ? buildChanges(item, previous, victimsT) : undefined;

    return {
      id: item._id,
      label: item.name,
      description: item.incidentLocation,
      timestamp: item.createdAt,
      isCurrent: index === 0,
      meta: [
        {
          label: victimsT("form.status"),
          value: victimsT(`status.${item.status}`),
        },
        { label: victimsT("form.incidentDate"), value: item.incidentDate },
      ],
      details: item.circumstances,
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
          <Link href={`/${locale}/victims/${id}`}>{t("back")}</Link>
        </Button>
      </div>
      <VersionTimeline items={timelineItems} />
    </section>
  );
}

function buildChanges(
  current: {
    name: string;
    status: string;
    hometown: string;
    incidentDate: string;
    incidentLocation: string;
    circumstances: string;
  },
  previous: {
    name: string;
    status: string;
    hometown: string;
    incidentDate: string;
    incidentLocation: string;
    circumstances: string;
  },
  t: ReturnType<typeof useTranslations>
) {
  const changes: { label: string; before: string; after: string }[] = [];
  const fields = [
    { key: "name", label: t("form.name"), format: (value: string) => value },
    {
      key: "status",
      label: t("form.status"),
      format: (value: string) => t(`status.${value}`),
    },
    {
      key: "hometown",
      label: t("form.hometown"),
      format: (value: string) => value,
    },
    {
      key: "incidentDate",
      label: t("form.incidentDate"),
      format: (value: string) => value,
    },
    {
      key: "incidentLocation",
      label: t("form.incidentLocation"),
      format: (value: string) => value,
    },
    {
      key: "circumstances",
      label: t("form.circumstances"),
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
