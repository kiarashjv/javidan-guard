"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex-api";

function routeFor(type: "regimeMembers" | "victims" | "actions", id: string) {
  if (type === "regimeMembers") return `/regime-members/${id}`;
  if (type === "victims") return `/victims/${id}`;
  return `/actions/${id}`;
}

export function UpdatesSidebar() {
  const t = useTranslations("updates");
  const locale = useLocale();
  const feed = useQuery(api.recent.feed, { limit: 10 });

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{t("title")}</h2>
          <p className="text-xs text-zinc-500">{t("subtitle")}</p>
        </div>
        <Button size="xs" variant="outline">
          {t("refresh")}
        </Button>
      </div>

      {feed === undefined ? (
        <div className="text-xs text-zinc-500">{t("loading")}</div>
      ) : feed.length === 0 ? (
        <div className="text-xs text-zinc-500">{t("empty")}</div>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => (
            <Link
              key={item._id}
              href={`/${locale}${routeFor(item.type, item._id)}`}
              className="block rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-zinc-700">
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
          ))}
        </div>
      )}
    </aside>
  );
}
