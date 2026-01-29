"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { RegimeMemberStatus } from "@/types/records";

export default function RegimeMembersPage() {
  const locale = useLocale();
  const t = useTranslations("regimeMembers");
  const members = useQuery(api.regimeMembers.listCurrent, {});
  const createMember = useMutation(api.regimeMembers.create);

  const [formState, setFormState] = useState({
    name: "",
    organization: "",
    unit: "",
    position: "",
    rank: "",
    status: "active" as RegimeMemberStatus,
    lastKnownLocation: "",
    aliases: "",
    photoUrls: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = useMemo(() => {
    return (
      formState.name.trim().length > 1 &&
      formState.organization.trim().length > 1 &&
      formState.reason.trim().length > 3
    );
  }, [formState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();

    await createMember({
      name: formState.name.trim(),
      aliases: formState.aliases
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      photoUrls: formState.photoUrls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      organization: formState.organization.trim(),
      unit: formState.unit.trim(),
      position: formState.position.trim(),
      rank: formState.rank.trim(),
      status: formState.status,
      lastKnownLocation: formState.lastKnownLocation.trim(),
      createdBySession: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: formState.reason.trim(),
    });

    setFormState({
      name: "",
      organization: "",
      unit: "",
      position: "",
      rank: "",
      status: "active",
      lastKnownLocation: "",
      aliases: "",
      photoUrls: "",
      reason: "",
    });
    setIsSubmitting(false);
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 text-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900">{t("title")}</h1>
          <p className="text-base text-zinc-600">{t("subtitle")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input placeholder={t("searchPlaceholder")} className="sm:max-w-sm" />
          <Button>{t("ctaReport")}</Button>
        </div>
      </div>

      <Card className="border border-zinc-200">
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
          <CardDescription>{t("form.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="member-name">{t("form.name")}</Label>
                <Input
                  id="member-name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-organization">{t("form.organization")}</Label>
                <Input
                  id="member-organization"
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
                <Label htmlFor="member-unit">{t("form.unit")}</Label>
                <Input
                  id="member-unit"
                  value={formState.unit}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, unit: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-position">{t("form.position")}</Label>
                <Input
                  id="member-position"
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
                <Label htmlFor="member-rank">{t("form.rank")}</Label>
                <Input
                  id="member-rank"
                  value={formState.rank}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, rank: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("form.status")}</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: value as RegimeMemberStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                    <SelectItem value="arrested">{t("status.arrested")}</SelectItem>
                    <SelectItem value="fled">{t("status.fled")}</SelectItem>
                    <SelectItem value="deceased">{t("status.deceased")}</SelectItem>
                    <SelectItem value="unknown">{t("status.unknown")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-location">{t("form.location")}</Label>
                <Input
                  id="member-location"
                  value={formState.lastKnownLocation}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastKnownLocation: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-aliases">{t("form.aliases")}</Label>
                <Input
                  id="member-aliases"
                  value={formState.aliases}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      aliases: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="member-photos">{t("form.photos")}</Label>
                <Input
                  id="member-photos"
                  value={formState.photoUrls}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      photoUrls: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="member-reason">{t("form.reason")}</Label>
              <Textarea
                id="member-reason"
                value={formState.reason}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reason: event.target.value }))
                }
              />
            </div>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? t("form.submitting") : t("form.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {members === undefined ? (
        <div className="text-sm text-zinc-500">{t("loading")}</div>
      ) : members.length === 0 ? (
        <div className="text-sm text-zinc-500">{t("empty")}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <Card key={member._id} className="border border-zinc-200">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <Badge variant="secondary">
                    {t(`status.${member.status}`)}
                  </Badge>
                </div>
                <CardDescription>
                  {member.organization} · {member.unit}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-zinc-600">
                  {t("lastKnownLocation")}: {member.lastKnownLocation}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/regime-members/${member._id}`}>
                    {t("viewProfile")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
