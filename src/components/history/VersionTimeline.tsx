"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TimelineMeta = {
  label: string;
  value: string;
};

type TimelineItem = {
  id: string;
  label: string;
  description?: string;
  timestamp: number;
  isCurrent?: boolean;
  meta?: TimelineMeta[];
  details?: string;
};

export function VersionTimeline({ items }: { items: TimelineItem[] }) {
  const locale = useLocale();
  const t = useTranslations("history");
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={item.id} className="relative pl-6">
          <span className="absolute left-0 top-4 h-2.5 w-2.5 rounded-full bg-zinc-400" />
          {index < items.length - 1 && (
            <span className="absolute left-1 top-7 h-full w-px bg-zinc-200" />
          )}
          <Card className="border border-zinc-200">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{item.label}</CardTitle>
                {item.isCurrent ? (
                  <Badge>{t("currentLabel")}</Badge>
                ) : (
                  <Badge variant="secondary">{t("archivedLabel")}</Badge>
                )}
              </div>
              <CardDescription className="text-xs text-zinc-500">
                {formatter.format(new Date(item.timestamp))}
              </CardDescription>
              {item.description ? (
                <CardDescription className="text-sm text-zinc-600">
                  {item.description}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-700">
              {item.meta && item.meta.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {item.meta.map((metaItem) => (
                    <div key={metaItem.label} className="rounded-lg border p-2">
                      <div className="text-xs text-zinc-500">
                        {metaItem.label}
                      </div>
                      <div className="text-sm font-medium text-zinc-800">
                        {metaItem.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {item.details ? (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                  {item.details}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
