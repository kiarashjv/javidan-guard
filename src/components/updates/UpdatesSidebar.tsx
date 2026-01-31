"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Archive, Crosshair, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex-api";

function routeFor(type: "regimeMembers" | "victims" | "actions", id: string) {
  if (type === "regimeMembers") return `/regime-members/${id}`;
  if (type === "victims") return `/victims/${id}`;
  return `/actions/${id}`;
}

function iconFor(type: "regimeMembers" | "victims" | "actions") {
  if (type === "regimeMembers") return Crosshair;
  if (type === "victims") return Crown;
  return Archive;
}

function feedsMatch<T extends { _id: string; createdAt: number }>(
  a: T[],
  b: T[]
) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return item._id === other._id && item.createdAt === other.createdAt;
  });
}

export function UpdatesSidebar() {
  const t = useTranslations("updates");
  const locale = useLocale();
  const liveFeed = useQuery(api.recent.feed, { limit: 6 });
  const [visibleFeed, setVisibleFeed] = useState<NonNullable<
    typeof liveFeed
  > | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (liveFeed === undefined) return;
    if (!visibleFeed) {
      const timer = setTimeout(() => {
        setVisibleFeed(liveFeed);
        setLastUpdatedAt(Date.now());
      }, 0);
      return () => clearTimeout(timer);
    }
    if (!feedsMatch(liveFeed, visibleFeed)) {
      const timer = setTimeout(() => setHasNew(true), 0);
      return () => clearTimeout(timer);
    }
  }, [liveFeed, visibleFeed]);

  const rtf = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    [locale]
  );

  const updatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return null;
    const diffSeconds = Math.max(
      Math.round((now - lastUpdatedAt) / 1000),
      0
    );
    if (diffSeconds < 60) {
      return rtf.format(-diffSeconds, "second");
    }
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) {
      return rtf.format(-diffMinutes, "minute");
    }
    const diffHours = Math.round(diffMinutes / 60);
    return rtf.format(-diffHours, "hour");
  }, [lastUpdatedAt, now, rtf]);

  const showLatest = () => {
    if (!liveFeed) return;
    setVisibleFeed(liveFeed);
    setLastUpdatedAt(Date.now());
    setHasNew(false);
  };

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{t("title")}</h2>
          <p className="text-xs text-zinc-500">{t("subtitle")}</p>
          {updatedLabel ? (
            <p className="mt-1 text-[11px] text-zinc-400">
              {t("updatedLabel", { time: updatedLabel })}
            </p>
          ) : null}
        </div>
        <Button size="xs" variant="outline" onClick={showLatest}>
          {t("refresh")}
        </Button>
      </div>

      {hasNew ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="flex items-center justify-between gap-2">
            <span>{t("newUpdates")}</span>
            <Button size="xs" variant="secondary" onClick={showLatest}>
              {t("showNew")}
            </Button>
          </div>
        </div>
      ) : null}

      {liveFeed === undefined ? (
        <div className="text-xs text-zinc-500">{t("loading")}</div>
      ) : (visibleFeed ?? []).length === 0 ? (
        <div className="text-xs text-zinc-500">{t("empty")}</div>
      ) : (
        <div className="space-y-3">
          {(visibleFeed ?? []).map((item) => {
            const Icon = iconFor(item.type);
            return (
              <Link
                key={item._id}
                href={`/${locale}${routeFor(item.type, item._id)}`}
                className="block rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                    <Icon className="h-3.5 w-3.5" />
                    {t(`types.${item.type}`)}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {item.status}
                  </Badge>
                </div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">
                  {item.title}
                </div>
                <div className="text-xs text-zinc-500">{item.subtitle}</div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
