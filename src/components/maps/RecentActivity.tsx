"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { Crosshair, Crown, Archive, Clock } from "lucide-react";

export function RecentActivity() {
  const activities = useQuery(api.recent.feed, { limit: 10 });

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
        return "Regime Member";
      case "victims":
        return "Victim";
      case "actions":
        return "Action";
      default:
        return type;
    }
  };

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">Live Updates</span>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity._id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="mt-0.5 text-muted-foreground">{getIcon(activity.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {getTypeLabel(activity.type)}
                </span>
                {activity.status && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {activity.status}
                  </span>
                )}
              </div>

              <p className="font-medium text-sm mt-0.5 truncate">
                {activity.title}
              </p>

              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {activity.subtitle}
              </p>
            </div>

            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
