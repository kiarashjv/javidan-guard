"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  proposedAt: number;
  expiresAt: number;
  reason?: string;
  targetSnapshot?: string | null;
  targetHref?: string;
};

export function PendingUpdateCard({
  id,
  targetLabel,
  proposedChanges,
  currentVerifications,
  requiredVerifications,
  proposedAt,
  expiresAt,
  reason,
  targetSnapshot,
  targetHref,
}: PendingUpdateCardProps) {
  const t = useTranslations("pendingUpdates");
  const locale = useLocale();
  const verify = useMutation(api.pendingUpdates.verify);
  const reject = useMutation(api.pendingUpdates.reject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );

  const proposedLabel = dateFormatter.format(new Date(proposedAt));
  const expiresLabel = dateFormatter.format(new Date(expiresAt));

  const fieldLabel = (key: string) =>
    key
      .replace(/[_-]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  async function handleVerify() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();
    await verify({
      pendingUpdateId: id,
      sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
    });
    setIsSubmitting(false);
  }

  async function handleReject() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();
    await reject({
      pendingUpdateId: id,
      sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: rejectReason.trim() || t("rejectFallback"),
    });
    setRejectReason("");
    setIsSubmitting(false);
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
        <CardDescription className="flex flex-wrap gap-2 text-xs text-zinc-500">
          <span>{t("proposedAt", { date: proposedLabel })}</span>
          <span>•</span>
          <span>{t("expiresAt", { date: expiresLabel })}</span>
        </CardDescription>
        <CardDescription>{t("proposedChanges")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {reason ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs text-zinc-500">{t("reason")}</div>
            <div className="text-sm text-zinc-800">{reason}</div>
          </div>
        ) : null}
        <div className="space-y-2">
          {Object.entries(parsedChanges).map(([key, value]) => {
            const currentValue = parsedSnapshot[key];
            const currentText = currentValue ? String(currentValue) : t("unknown");
            const proposedText = String(value);
            const hasChanged = currentText !== proposedText;
            return (
              <div
                key={key}
                className="grid gap-2 rounded-lg border border-zinc-200 p-3"
              >
                <div className="text-xs font-medium text-zinc-500">
                  {fieldLabel(key)}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-zinc-500">{t("current")}</div>
                    <div className="text-sm text-zinc-700">{currentText}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">{t("proposed")}</div>
                    <div
                      className={`text-sm font-medium ${
                        hasChanged ? "text-emerald-700" : "text-zinc-500"
                      }`}
                    >
                      {proposedText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleVerify} disabled={isSubmitting}>
            {t("verify")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isSubmitting}>
                {t("reject")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("rejectTitle")}</AlertDialogTitle>
              </AlertDialogHeader>
              <Textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder={t("rejectPlaceholder")}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleReject}>
                  {t("confirmReject")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
