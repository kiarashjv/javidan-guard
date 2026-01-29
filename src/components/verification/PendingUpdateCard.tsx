"use client";

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
};

export function PendingUpdateCard({
  id,
  targetLabel,
  proposedChanges,
  currentVerifications,
  requiredVerifications,
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
          {Object.entries(parsedChanges).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-zinc-500">{key}</span>
              <span className="font-medium text-zinc-900">{value}</span>
            </div>
          ))}
        </div>
        <Button onClick={handleVerify}>{t("verify")}</Button>
      </CardContent>
    </Card>
  );
}
