"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TimelineItem = {
  id: string;
  label: string;
  description: string;
  timestamp: number;
  isCurrent?: boolean;
};

export function VersionTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="border border-zinc-200">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{item.label}</CardTitle>
              {item.isCurrent ? (
                <Badge>Current</Badge>
              ) : (
                <Badge variant="secondary">Archived</Badge>
              )}
            </div>
            <CardDescription>
              {new Date(item.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            {item.description}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
