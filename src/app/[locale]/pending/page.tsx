"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { PendingUpdateCard } from "@/components/verification/PendingUpdateCard";
import { api } from "@/lib/convex-api";

export default function PendingUpdatesPage() {
  const t = useTranslations("pendingUpdates");
  const pending = useQuery(api.pendingUpdates.listPending, {
    targetCollection: "regimeMembers",
  });

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">{t("title")}</h1>
        <p className="text-sm text-zinc-600">{t("subtitle")}</p>
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
              targetLabel={t("regimeMemberLabel")}
              proposedChanges={update.proposedChanges}
              currentVerifications={update.currentVerifications}
              requiredVerifications={update.requiredVerifications}
            />
          ))}
        </div>
      )}
    </section>
  );
}
