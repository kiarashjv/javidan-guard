"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/convex-api";
import { getClientMeta, getSessionId } from "@/lib/session";

export type PendingUpdateCardProps = {
  id: string;
  targetLabel: string;
  proposedChanges: string;
  currentVerifications: number;
  requiredVerifications: number;
  targetSnapshot?: string | null;
  targetHref?: string;
};

export function PendingUpdateCard({
  id,
  targetLabel,
  proposedChanges,
  currentVerifications,
  requiredVerifications,
  targetSnapshot,
  targetHref,
}: PendingUpdateCardProps) {
  const t = useTranslations("pendingUpdates");
  const verify = useMutation(api.pendingUpdates.verify);

  const parsedChanges = useMemo(() => {
    try {
      return JSON.parse(proposedChanges) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  }, [proposedChanges]);

  const parsedSnapshot = useMemo(() => {
    if (!targetSnapshot) {
      return {} as Record<string, unknown>;
    }
    try {
      return JSON.parse(targetSnapshot) as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
    }
  }, [targetSnapshot]);

  async function handleVerify() {
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();
    await verify({
      pendingUpdateId: id,
      sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
    });
  }

  return (
    <Card className="border border-zinc-200">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle>{targetLabel}</CardTitle>
          <Badge variant="secondary">
            {currentVerifications}/{requiredVerifications}
          </Badge>
        </div>
        <CardDescription>{t("proposedChanges")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          {Object.entries(parsedChanges).map(([key, value]) => {
            const currentValue = parsedSnapshot[key];
            return (
              <div key={key} className="grid gap-2 rounded-lg border border-zinc-200 p-3">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  {key}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-zinc-500">{t("current")}</div>
                    <div className="text-sm text-zinc-700">
                      {currentValue ? String(currentValue) : t("unknown")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">{t("proposed")}</div>
                    <div className="text-sm font-medium text-zinc-900">{value}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleVerify}>{t("verify")}</Button>
          {targetHref ? (
            <Button asChild variant="outline">
              <Link href={targetHref}>{t("viewTarget")}</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
