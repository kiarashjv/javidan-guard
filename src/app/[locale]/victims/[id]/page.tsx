"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/convex-api";
import { getClientMeta, getSessionId } from "@/lib/session";
import { serializeChanges } from "@/lib/pending-updates";
import { PendingUpdateCard } from "@/components/verification/PendingUpdateCard";

export default function VictimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const t = useTranslations("victimDetail");
  const victim = useQuery(api.victims.getById, { id });
  const proposeUpdate = useMutation(api.pendingUpdates.propose);
  const pendingUpdates = useQuery(api.pendingUpdates.listForTarget, {
    targetCollection: "victims",
    targetId: id,
  });

  const [formState, setFormState] = useState({
    name: "",
    hometown: "",
    status: "",
    incidentDate: "",
    incidentLocation: "",
    circumstances: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePropose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!victim) {
      return;
    }

    const proposedChanges = Object.fromEntries(
      Object.entries(formState).filter(([key, value]) => key !== "reason" && value.trim().length > 0)
    ) as Record<string, string>;

    if (Object.keys(proposedChanges).length === 0) {
      return;
    }

    setIsSubmitting(true);
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();

    await proposeUpdate({
      targetCollection: "victims",
      targetId: victim._id,
      proposedChanges: serializeChanges(proposedChanges),
      reason: formState.reason.trim(),
      proposedBy: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
    });

    setFormState({
      name: "",
      hometown: "",
      status: "",
      incidentDate: "",
      incidentLocation: "",
      circumstances: "",
      reason: "",
    });
    setIsSubmitting(false);
  }

  if (victim === undefined) {
    return <div className="text-sm text-zinc-500">{t("loading")}</div>;
  }

  if (!victim) {
    return <div className="text-sm text-zinc-500">{t("notFound")}</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-start">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/victims`}>{t("back")}</Link>
        </Button>
      </div>

      <Card className="border border-zinc-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{victim.name}</CardTitle>
            <Badge variant="secondary">{t(`status.${victim.status}`)}</Badge>
          </div>
          <CardDescription>
            {victim.incidentLocation} · {victim.incidentDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-600">
          <div>
            {t("recordId")}: {victim._id}
          </div>
          <div>
            {t("hometown")}: {victim.hometown}
          </div>
          <div>{victim.circumstances}</div>
        </CardContent>
      </Card>

      <Card className="border border-zinc-200">
        <CardHeader>
          <CardTitle>{t("propose.title")}</CardTitle>
          <CardDescription>{t("propose.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePropose}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="update-victim-name">{t("propose.name")}</Label>
                <Input
                  id="update-victim-name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-hometown">{t("propose.hometown")}</Label>
                <Input
                  id="update-victim-hometown"
                  value={formState.hometown}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, hometown: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-status">{t("propose.status")}</Label>
                <Input
                  id="update-victim-status"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, status: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-date">{t("propose.incidentDate")}</Label>
                <Input
                  id="update-victim-date"
                  value={formState.incidentDate}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, incidentDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-location">{t("propose.incidentLocation")}</Label>
                <Input
                  id="update-victim-location"
                  value={formState.incidentLocation}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, incidentLocation: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="update-victim-circumstances">
                  {t("propose.circumstances")}
                </Label>
                <Textarea
                  id="update-victim-circumstances"
                  value={formState.circumstances}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, circumstances: event.target.value }))
                  }
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="update-victim-reason">{t("propose.reason")}</Label>
              <Textarea
                id="update-victim-reason"
                value={formState.reason}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reason: event.target.value }))
                }
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("propose.submitting") : t("propose.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-zinc-200">
        <CardHeader>
          <CardTitle>{t("pending.title")}</CardTitle>
          <CardDescription>{t("pending.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingUpdates === undefined ? (
            <div className="text-sm text-zinc-500">{t("pending.loading")}</div>
          ) : pendingUpdates.length === 0 ? (
            <div className="text-sm text-zinc-500">{t("pending.empty")}</div>
          ) : (
            pendingUpdates.map((update) => (
              <PendingUpdateCard
                key={update._id}
                id={update._id}
                targetLabel={t("pending.label")}
                proposedChanges={update.proposedChanges}
                targetSnapshot={update.targetSnapshot}
                currentVerifications={update.currentVerifications}
                requiredVerifications={update.requiredVerifications}
              />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
