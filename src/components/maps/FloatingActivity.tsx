"use client";

import { memo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { enUS, faIR } from "date-fns/locale";
import { Crosshair, Crown, Archive, MapPin } from "lucide-react";
import { getProvinceName } from "@/lib/province-names";
import { useTranslations } from "next-intl";

interface FloatingActivityProps {
  limit?: number;
  locale?: "en" | "fa";
}

export default memo(function FloatingActivity({
  limit = 4,
  locale = "en"
}: FloatingActivityProps) {
  const activities = useQuery(api.recent.feed, { limit });
  const t = useTranslations("map");

  const getIcon = (type: string) => {
    switch (type) {
      case "regimeMembers":
        return <Crosshair className="h-4 w-4" />;
      case "victims":
        return <Crown className="h-4 w-4" />;
      case "actions":
        return <Archive className="h-4 w-4" />;
      default:
        return null;
    }
  };


  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="md:absolute md:top-20 md:right-4 md:max-w-sm md:z-40 flex flex-col gap-2 md:pointer-events-none md:max-h-96 md:overflow-hidden">
      {/* Gradient fade overlay - desktop only */}
      <div className="hidden md:block absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/90 via-background/40 to-transparent pointer-events-none z-10" />

      <div className="flex flex-col gap-2">
        {activities.map((activity, index) => (
          <div
            key={activity._id}
            className="md:pointer-events-auto rounded-lg shadow-md p-2.5 bg-background/95 backdrop-blur-sm border animate-in slide-in-from-left-5 fade-in duration-300"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{getIcon(activity.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-medium">
                    {activity.type === "regimeMembers"
                      ? t("mercenary")
                      : activity.type === "victims"
                        ? t("victim")
                        : t("action")}
                  </span>
                  {activity.provinceCode && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {getProvinceName(activity.provinceCode, locale)}
                    </span>
                  )}
                </div>

                <p className="font-medium text-sm truncate">{activity.title}</p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(activity.createdAt, {
                    addSuffix: true,
                    locale: locale === "fa" ? faIR : enUS,
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
