"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { use, useMemo, useState } from "react";
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
import { PendingFieldUpdate } from "@/components/verification/PendingFieldUpdate";
import { PendingUpdateCard } from "@/components/verification/PendingUpdateCard";

export default function RegimeMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const t = useTranslations("regimeMember");
  const membersT = useTranslations("regimeMembers");
  const pendingT = useTranslations("pendingUpdates");
  const member = useQuery(api.regimeMembers.getById, { id });
  const proposeUpdate = useMutation(api.pendingUpdates.propose);
  const pendingUpdates = useQuery(api.pendingUpdates.listForTarget, {
    targetCollection: "regimeMembers",
    targetId: id,
  });

  const pendingByField = useMemo(() => {
    if (!pendingUpdates) {
      return {} as Record<
        string,
        { update: PendingUpdateRecord; proposedValue: string }
      >;
    }
    const result: Record<string, { update: PendingUpdateRecord; proposedValue: string }> = {};
    for (const update of pendingUpdates) {
      let parsed: Record<string, string>;
      try {
        parsed = JSON.parse(update.proposedChanges) as Record<string, string>;
      } catch {
        continue;
      }
      for (const [key, value] of Object.entries(parsed)) {
        const existing = result[key];
        if (!existing || update.proposedAt > existing.update.proposedAt) {
          result[key] = { update, proposedValue: value };
        }
      }
    }
    return result;
  }, [pendingUpdates]);

  const isFieldPending = (field: string) => Boolean(pendingByField[field]);

  const fieldLabels = {
    name: membersT("form.name"),
    organization: membersT("form.organization"),
    unit: membersT("form.unit"),
    position: membersT("form.position"),
    rank: membersT("form.rank"),
    status: membersT("form.status"),
    lastKnownLocation: membersT("form.location"),
    aliases: membersT("form.aliases"),
    photoUrls: membersT("form.photos"),
  } as const;

  const formatValue = (key: string, value: string) => {
    if (key === "status") {
      try {
        return membersT(`status.${value}`);
      } catch {
        return value;
      }
    }
    return value;
  };

  const [formState, setFormState] = useState({
    name: "",
    organization: "",
    unit: "",
    position: "",
    rank: "",
    status: "",
    lastKnownLocation: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePropose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) {
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
      targetCollection: "regimeMembers",
      targetId: member._id,
      proposedChanges: serializeChanges(proposedChanges),
      reason: formState.reason.trim(),
      proposedBy: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
    });

    setFormState({
      name: "",
      organization: "",
      unit: "",
      position: "",
      rank: "",
      status: "",
      lastKnownLocation: "",
      reason: "",
    });
    setIsSubmitting(false);
  }

  if (member === undefined) {
    return <div className="text-sm text-zinc-500">{t("loading")}</div>;
  }

  if (!member) {
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
          <Link href={`/${locale}/regime-members`}>{t("back")}</Link>
        </Button>
      </div>

      <Card className="border border-zinc-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{member.name}</CardTitle>
            <Badge variant="secondary">
              {membersT(`status.${member.status}`)}
            </Badge>
          </div>
          <CardDescription>
            {member.organization} · {member.unit}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-zinc-600">
          <div>
            {t("recordId")}: {member._id}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{membersT("form.name")}</div>
              <div className="text-base text-foreground">{member.name}</div>
              {pendingByField.name ? (
                <PendingFieldUpdate
                  update={pendingByField.name.update}
                  proposedValue={pendingByField.name.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {membersT("form.status")}
              </div>
              <div className="text-base text-foreground">
                {membersT(`status.${member.status}`)}
              </div>
              {pendingByField.status ? (
                <PendingFieldUpdate
                  update={pendingByField.status.update}
                  proposedValue={pendingByField.status.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {membersT("form.organization")}
              </div>
              <div className="text-base text-foreground">{member.organization}</div>
              {pendingByField.organization ? (
                <PendingFieldUpdate
                  update={pendingByField.organization.update}
                  proposedValue={pendingByField.organization.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{membersT("form.unit")}</div>
              <div className="text-base text-foreground">{member.unit}</div>
              {pendingByField.unit ? (
                <PendingFieldUpdate
                  update={pendingByField.unit.update}
                  proposedValue={pendingByField.unit.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {membersT("form.position")}
              </div>
              <div className="text-base text-foreground">{member.position}</div>
              {pendingByField.position ? (
                <PendingFieldUpdate
                  update={pendingByField.position.update}
                  proposedValue={pendingByField.position.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{membersT("form.rank")}</div>
              <div className="text-base text-foreground">{member.rank}</div>
              {pendingByField.rank ? (
                <PendingFieldUpdate
                  update={pendingByField.rank.update}
                  proposedValue={pendingByField.rank.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-xs text-muted-foreground">
                {membersT("form.location")}
              </div>
              <div className="text-base text-foreground">{member.lastKnownLocation}</div>
              {pendingByField.lastKnownLocation ? (
                <PendingFieldUpdate
                  update={pendingByField.lastKnownLocation.update}
                  proposedValue={pendingByField.lastKnownLocation.proposedValue}
                />
              ) : null}
            </div>
          </div>
          <div>{t("notes")}</div>
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
                <Label htmlFor="update-name">{t("propose.name")}</Label>
                <Input
                  id="update-name"
                  value={formState.name}
                  disabled={isFieldPending("name")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                {isFieldPending("name") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-organization">{t("propose.organization")}</Label>
                <Input
                  id="update-organization"
                  value={formState.organization}
                  disabled={isFieldPending("organization")}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      organization: event.target.value,
                    }))
                  }
                />
                {isFieldPending("organization") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-unit">{t("propose.unit")}</Label>
                <Input
                  id="update-unit"
                  value={formState.unit}
                  disabled={isFieldPending("unit")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, unit: event.target.value }))
                  }
                />
                {isFieldPending("unit") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-position">{t("propose.position")}</Label>
                <Input
                  id="update-position"
                  value={formState.position}
                  disabled={isFieldPending("position")}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      position: event.target.value,
                    }))
                  }
                />
                {isFieldPending("position") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-rank">{t("propose.rank")}</Label>
                <Input
                  id="update-rank"
                  value={formState.rank}
                  disabled={isFieldPending("rank")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, rank: event.target.value }))
                  }
                />
                {isFieldPending("rank") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-status">{t("propose.status")}</Label>
                <Input
                  id="update-status"
                  value={formState.status}
                  disabled={isFieldPending("status")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, status: event.target.value }))
                  }
                />
                {isFieldPending("status") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="update-location">{t("propose.location")}</Label>
                <Input
                  id="update-location"
                  value={formState.lastKnownLocation}
                  disabled={isFieldPending("lastKnownLocation")}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastKnownLocation: event.target.value,
                    }))
                  }
                />
                {isFieldPending("lastKnownLocation") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="update-reason">{t("propose.reason")}</Label>
              <Textarea
                id="update-reason"
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
          <CardTitle>{pendingT("title")}</CardTitle>
          <CardDescription>{pendingT("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingUpdates === undefined ? (
            <div className="text-sm text-zinc-500">{pendingT("loading")}</div>
          ) : pendingUpdates.length === 0 ? (
            <div className="text-sm text-zinc-500">{pendingT("empty")}</div>
          ) : (
            pendingUpdates.map((update) => (
              <PendingUpdateCard
                key={update._id}
                id={update._id}
                targetLabel={pendingT("labels.regimeMembers")}
                proposedChanges={update.proposedChanges}
                proposedAt={update.proposedAt}
                expiresAt={update.expiresAt}
                reason={update.reason}
                targetSnapshot={update.targetSnapshot}
                currentVerifications={update.currentVerifications}
                requiredVerifications={update.requiredVerifications}
                fieldLabels={fieldLabels}
                formatValue={formatValue}
              />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

type PendingUpdateRecord = {
  _id: string;
  proposedChanges: string;
  proposedAt: number;
  expiresAt: number;
  currentVerifications: number;
  requiredVerifications: number;
  reason?: string | null;
};
