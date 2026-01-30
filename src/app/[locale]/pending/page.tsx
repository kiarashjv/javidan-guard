"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PendingUpdateCard } from "@/components/verification/PendingUpdateCard";
import { api } from "@/lib/convex-api";

export default function PendingUpdatesPage() {
  const locale = useLocale();
  const t = useTranslations("pendingUpdates");
  const regimeT = useTranslations("regimeMembers");
  const victimsT = useTranslations("victims");
  const actionsT = useTranslations("actions");
  const [collection, setCollection] = useState<
    "regimeMembers" | "victims" | "actions"
  >("regimeMembers");
  const routeSegment =
    collection === "regimeMembers"
      ? "regime-members"
      : collection === "victims"
        ? "victims"
        : "actions";
  const pending = useQuery(api.pendingUpdates.listPending, {
    targetCollection: collection,
  });

  const fieldLabels = {
    regimeMembers: {
      name: regimeT("form.name"),
      organization: regimeT("form.organization"),
      unit: regimeT("form.unit"),
      position: regimeT("form.position"),
      rank: regimeT("form.rank"),
      status: regimeT("form.status"),
      lastKnownLocation: regimeT("form.location"),
      aliases: regimeT("form.aliases"),
      photoUrls: regimeT("form.photos"),
    },
    victims: {
      name: victimsT("form.name"),
      hometown: victimsT("form.hometown"),
      status: victimsT("form.status"),
      incidentDate: victimsT("form.incidentDate"),
      incidentLocation: victimsT("form.incidentLocation"),
      circumstances: victimsT("form.circumstances"),
      evidenceLinks: victimsT("form.evidenceLinks"),
      newsReports: victimsT("form.newsReports"),
      witnessAccounts: victimsT("form.witnessAccounts"),
      linkedPerpetrators: victimsT("form.linkedPerpetrators"),
      photoUrls: victimsT("form.photos"),
    },
    actions: {
      actionType: actionsT("form.actionType"),
      date: actionsT("form.date"),
      location: actionsT("form.location"),
      description: actionsT("form.description"),
      perpetratorId: actionsT("form.perpetratorId"),
      victimIds: actionsT("form.victimIds"),
      evidenceUrls: actionsT("form.evidenceUrls"),
      videoLinks: actionsT("form.videoLinks"),
      documentLinks: actionsT("form.documentLinks"),
      witnessStatements: actionsT("form.witnessStatements"),
    },
  } as const;

  const formatValue = (key: string, value: string) => {
    if (collection === "regimeMembers" && key === "status") {
      try {
        return regimeT(`status.${value}`);
      } catch {
        return value;
      }
    }
    if (collection === "victims" && key === "status") {
      try {
        return victimsT(`status.${value}`);
      } catch {
        return value;
      }
    }
    if (collection === "actions" && key === "actionType") {
      try {
        return actionsT(`types.${value}`);
      } catch {
        return value;
      }
    }
    return value;
  };

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-zinc-900">{t("title")}</h1>
          <p className="text-sm text-zinc-600">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={collection === "regimeMembers" ? "default" : "outline"}
            size="sm"
            onClick={() => setCollection("regimeMembers")}
          >
            {t("filters.regimeMembers")}
          </Button>
          <Button
            variant={collection === "victims" ? "default" : "outline"}
            size="sm"
            onClick={() => setCollection("victims")}
          >
            {t("filters.victims")}
          </Button>
          <Button
            variant={collection === "actions" ? "default" : "outline"}
            size="sm"
            onClick={() => setCollection("actions")}
          >
            {t("filters.actions")}
          </Button>
        </div>
      </div>

      {pending === undefined ? (
        <div className="text-sm text-zinc-500">{t("loading")}</div>
      ) : pending.length === 0 ? (
        <div className="text-sm text-zinc-500">{t("empty")}</div>
      ) : (
        <div className="grid gap-4">
          {pending.map((update) => (
            <PendingUpdateCard
              key={update._id}
              id={update._id}
              targetLabel={t(`labels.${collection}`)}
              proposedChanges={update.proposedChanges}
              proposedAt={update.proposedAt}
              expiresAt={update.expiresAt}
              reason={update.reason}
              targetSnapshot={update.targetSnapshot}
              targetHref={`/${locale}/${routeSegment}/${update.targetId}`}
              currentVerifications={update.currentVerifications}
              requiredVerifications={update.requiredVerifications}
              fieldLabels={fieldLabels[collection]}
              formatValue={formatValue}
            />
          ))}
        </div>
      )}
    </section>
  );
}
