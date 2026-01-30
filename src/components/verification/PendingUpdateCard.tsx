"use client";

import Image from "next/image";
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
  status: "pending" | "approved" | "rejected" | "expired";
  verifiedBySessions: string[];
  rejectedBySessions: string[];
  proposedAt: number;
  expiresAt: number;
  reason?: string;
  targetSnapshot?: string | null;
  targetHref?: string;
  fieldLabels?: Record<string, string>;
  formatValue?: (key: string, value: string) => string;
};

export function PendingUpdateCard({
  id,
  targetLabel,
  proposedChanges,
  currentVerifications,
  requiredVerifications,
  status,
  verifiedBySessions,
  rejectedBySessions,
  proposedAt,
  expiresAt,
  reason,
  targetSnapshot,
  targetHref,
  fieldLabels,
  formatValue,
}: PendingUpdateCardProps) {
  const t = useTranslations("pendingUpdates");
  const locale = useLocale();
  const isRtl = locale === "fa";
  const verify = useMutation(api.pendingUpdates.verify);
  const reject = useMutation(api.pendingUpdates.reject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const sessionId = getSessionId();
  const hasApproved = verifiedBySessions.includes(sessionId);
  const hasRejected = rejectedBySessions.includes(sessionId);
  const isFinalized = status !== "pending";

  const parsedChanges = useMemo(() => {
    try {
      return JSON.parse(proposedChanges) as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
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
      <CardHeader className="space-y-2 pb-3">
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
      <CardContent className="space-y-3 text-sm">
        {isFinalized ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
            {status === "approved" ? t("statusApproved") : t("statusRejected")}
          </div>
        ) : hasApproved ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
            {t("youApproved")}
          </div>
        ) : hasRejected ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700">
            {t("youRejected")}
          </div>
        ) : null}
        {reason ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="text-xs text-zinc-500">{t("reason")}</div>
            <div className="text-sm text-zinc-800">{reason}</div>
          </div>
        ) : null}
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <div
            className={`hidden grid-cols-3 gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 md:grid ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div>{t("proposedChanges")}</div>
            <div>{t("current")}</div>
            <div>{t("proposed")}</div>
          </div>
          <div className="divide-y divide-zinc-200">
            {Object.entries(parsedChanges).map(([key, value]) => {
              const currentValue = parsedSnapshot[key];
              const currentText = formatDisplayValue(key, currentValue, formatValue, t);
              const proposedText = formatDisplayValue(key, value, formatValue, t);
              const hasChanged = currentText !== proposedText;
              const isPhotoField = key === "photoUrls";
              const label = fieldLabels?.[key] ?? fieldLabel(key);
              const currentDisplay = isPhotoField
                ? renderPhotoGrid(normalizePhotoUrls(currentValue), t("unknown"))
                : currentText;
              const proposedDisplay = isPhotoField
                ? renderPhotoGrid(normalizePhotoUrls(value), t("unknown"))
                : proposedText;
              return (
                <div
                  key={key}
                  className={`grid grid-cols-1 gap-2 px-3 py-2 text-xs md:grid-cols-3 ${
                    isRtl ? "text-right" : "text-left"
                  }`}
                >
                  <div className="font-medium text-zinc-600">{label}</div>
                  <div className="text-zinc-700">
                    <div className="text-[10px] text-zinc-500 md:hidden">{t("current")}</div>
                    {currentDisplay}
                  </div>
                  <div
                    className={`font-medium ${
                      hasChanged ? "text-emerald-700" : "text-zinc-500"
                    }`}
                  >
                    <div
                      className={`text-[10px] font-normal md:hidden ${
                        hasChanged ? "text-emerald-600" : "text-zinc-500"
                      }`}
                    >
                      {t("proposed")}
                    </div>
                    {proposedDisplay}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isFinalized && !hasApproved && !hasRejected ? (
            <>
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
            </>
          ) : null}
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

function normalizePhotoUrls(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [] as string[];
}

function formatDisplayValue(
  key: string,
  value: unknown,
  formatValue: ((key: string, value: string) => string) | undefined,
  t: (key: string) => string
) {
  if (value === null || value === undefined || value === "") {
    return t("unknown");
  }
  if (formatValue && typeof value === "string") {
    return formatValue(key, value);
  }
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function renderPhotoGrid(urls: string[], fallback: string) {
  if (urls.length === 0) {
    return <span className="text-zinc-500">{fallback}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {urls.map((url) => (
        <div key={url} className="h-12 w-12 overflow-hidden rounded-md border border-zinc-200">
          <Image
            src={url}
            alt=""
            width={96}
            height={96}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
