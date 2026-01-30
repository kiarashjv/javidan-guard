"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { api } from "@/lib/convex-api";
import { getClientMeta, getSessionId } from "@/lib/session";

type PendingFieldUpdateProps = {
  update: {
    _id: string;
    proposedAt: number;
    expiresAt: number;
    currentVerifications: number;
    requiredVerifications: number;
    reason?: string | null;
  };
  proposedValue: string;
};

export function PendingFieldUpdate({
  update,
  proposedValue,
}: PendingFieldUpdateProps) {
  const t = useTranslations("pendingUpdates");
  const locale = useLocale();
  const verify = useMutation(api.pendingUpdates.verify);
  const reject = useMutation(api.pendingUpdates.reject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [open, setOpen] = useState(false);
  const isRtl = locale === "fa";

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );

  const proposedLabel = proposedValue.trim().length ? proposedValue : t("unknown");
  const proposedAtLabel = t("proposedAt", {
    date: dateFormatter.format(new Date(update.proposedAt)),
  });

  async function handleVerify() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();
    await verify({
      pendingUpdateId: update._id,
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
      pendingUpdateId: update._id,
      sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: rejectReason.trim() || t("rejectFallback"),
    });
    setRejectReason("");
    setIsSubmitting(false);
  }

  return (
    <div className="rounded-md border border-amber-200/70 bg-amber-50/50 p-2.5 text-xs text-amber-900">
      <div
        className={`flex flex-wrap items-center justify-between gap-2 ${
          isRtl ? "text-right" : "text-left"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="px-2 py-0 text-[10px]">
            {t("fieldPending")}
          </Badge>
          <span className="font-medium">
            {t("proposed")}: {proposedLabel}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 text-amber-700 ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          <span>
            {update.currentVerifications}/{update.requiredVerifications}
          </span>
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
              >
                <ChevronDown
                  className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                />
                <span className="sr-only">
                  {open ? t("hideDetails") : t("details")}
                </span>
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent
          className={`mt-2 rounded-sm bg-amber-100/50 px-2 py-1 text-[11px] leading-relaxed text-amber-700 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          <div>{proposedAtLabel}</div>
          {update.reason ? <div>{t("reason")}: {update.reason}</div> : null}
        </CollapsibleContent>
      </Collapsible>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={handleVerify}
          disabled={isSubmitting}
        >
          <Check className="size-4" />
          {t("verifyShort")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isSubmitting}
            >
              <X className="size-4" />
              {t("rejectShort")}
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
      </div>
    </div>
  );
}
