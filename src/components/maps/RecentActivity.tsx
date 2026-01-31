"use client";

import { memo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { enUS, faIR } from "date-fns/locale";
import { Crosshair, Crown, Archive, Clock, MapPin } from "lucide-react";
import { getProvinceName } from "@/lib/province-names";
import { useTranslations } from "next-intl";

interface RecentActivityProps {
  limit?: number;
  locale?: "en" | "fa";
}

export const RecentActivity = memo(function RecentActivity({
  limit = 3,
  locale = "en"
}: RecentActivityProps = {}) {
  const activities = useQuery(api.recent.feed, { limit });
  const t = useTranslations("map");

  if (!activities || activities.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "regimeMembers":
        return <Crosshair className="h-4 w-4" />;
      case "victims":
        return <Crown className="h-4 w-4" />;
      case "actions":
        return <Archive className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "regimeMembers":
        return t("mercenary");
      case "victims":
        return t("victim");
      case "actions":
        return t("action");
      default:
        return type;
    }
  };

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{t("recentActivity")}</h3>
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <span className="text-xs text-muted-foreground">{t("liveUpdates")}</span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity._id}
            className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
            style={{
              animationDelay: `${index * 50}ms`,
              animationDuration: '300ms',
              animationFillMode: 'backwards',
            }}
          >
            <div className="mt-1 text-muted-foreground">{getIcon(activity.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">
                  {getTypeLabel(activity.type)}
                </span>
                {activity.status && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {activity.status}
                  </span>
                )}
                {activity.provinceCode && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {getProvinceName(activity.provinceCode, locale)}
                  </span>
                )}
              </div>

              <p className="font-medium text-sm mt-1.5 truncate">
                {activity.title}
              </p>

              <p className="text-xs text-muted-foreground mt-1 truncate">
                {activity.subtitle}
              </p>
            </div>

            <div className="text-xs text-muted-foreground whitespace-nowrap mt-1">
              {formatDistanceToNow(activity.createdAt, {
                addSuffix: true,
                locale: locale === "fa" ? faIR : enUS,
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
