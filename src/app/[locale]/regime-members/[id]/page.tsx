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

export default function RegimeMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const t = useTranslations("regimeMember");
  const member = useQuery(api.regimeMembers.getById, { id });
  const proposeUpdate = useMutation(api.pendingUpdates.propose);

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
            <Badge variant="secondary">{t(`status.${member.status}`)}</Badge>
          </div>
          <CardDescription>
            {member.organization} · {member.unit}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-600">
          <div>
            {t("recordId")}: {member._id}
          </div>
          <div>
            {t("location")}: {member.lastKnownLocation}
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
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-organization">{t("propose.organization")}</Label>
                <Input
                  id="update-organization"
                  value={formState.organization}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      organization: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-unit">{t("propose.unit")}</Label>
                <Input
                  id="update-unit"
                  value={formState.unit}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, unit: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-position">{t("propose.position")}</Label>
                <Input
                  id="update-position"
                  value={formState.position}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      position: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-rank">{t("propose.rank")}</Label>
                <Input
                  id="update-rank"
                  value={formState.rank}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, rank: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-status">{t("propose.status")}</Label>
                <Input
                  id="update-status"
                  value={formState.status}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, status: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="update-location">{t("propose.location")}</Label>
                <Input
                  id="update-location"
                  value={formState.lastKnownLocation}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastKnownLocation: event.target.value,
                    }))
                  }
                />
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
    </section>
  );
}
