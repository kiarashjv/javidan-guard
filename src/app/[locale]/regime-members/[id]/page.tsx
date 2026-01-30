"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { use, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { regimeMemberUpdateSchema } from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";
import { serializeChanges } from "@/lib/pending-updates";
import { PendingFieldUpdate } from "@/components/verification/PendingFieldUpdate";
import { useToast } from "@/hooks/use-toast";

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
  const common = useTranslations("common");
  const member = useQuery(api.regimeMembers.getById, { id });
  const proposeUpdate = useMutation(api.pendingUpdates.propose);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const { toast } = useToast();
  const pendingUpdates = useQuery(api.pendingUpdates.listForTarget, {
    targetCollection: "regimeMembers",
    targetId: id,
  });

  const pendingByField = useMemo(() => {
    if (!pendingUpdates) {
      return {} as Record<
        string,
        { update: PendingUpdateRecord; proposedValue: unknown }
      >;
    }
    const result: Record<string, { update: PendingUpdateRecord; proposedValue: unknown }> = {};
    for (const update of pendingUpdates) {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(update.proposedChanges) as Record<string, unknown>;
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
  const shownKeys = useMemo(
    () =>
      new Set([
        "name",
        "status",
        "organization",
        "unit",
        "position",
        "rank",
        "lastKnownLocation",
        "photoUrls",
      ]),
    []
  );
  const fieldLabels = useMemo(
    () => ({
      name: membersT("form.name"),
      organization: membersT("form.organization"),
      unit: membersT("form.unit"),
      position: membersT("form.position"),
      rank: membersT("form.rank"),
      status: membersT("form.status"),
      lastKnownLocation: membersT("form.location"),
      aliases: membersT("form.aliases"),
      photoUrls: membersT("form.photos"),
    }),
    [membersT]
  );


  const [formState, setFormState] = useState({
    name: "",
    organization: "",
    unit: "",
    position: "",
    rank: "",
    status: "",
    lastKnownLocation: "",
    photoUrls: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePropose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member) {
      return;
    }

    const proposedChanges: Record<string, unknown> = {};
    if (formState.name.trim().length > 0) proposedChanges.name = formState.name.trim();
    if (formState.organization.trim().length > 0) {
      proposedChanges.organization = formState.organization.trim();
    }
    if (formState.unit.trim().length > 0) {
      proposedChanges.unit = formState.unit.trim();
    }
    if (formState.position.trim().length > 0) {
      proposedChanges.position = formState.position.trim();
    }
    if (formState.rank.trim().length > 0) {
      proposedChanges.rank = formState.rank.trim();
    }
    if (formState.status.trim().length > 0) {
      proposedChanges.status = formState.status.trim();
    }
    if (formState.lastKnownLocation.trim().length > 0) {
      proposedChanges.lastKnownLocation = formState.lastKnownLocation.trim();
    }
    if (formState.photoUrls.trim().length > 0) {
      proposedChanges.photoUrls = formState.photoUrls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    if (Object.keys(proposedChanges).length === 0) {
      return;
    }

    const validation = regimeMemberUpdateSchema.safeParse(proposedChanges);
    if (!validation.success) {
      toast({
        title: common("validationTitle"),
        description: common("validationDescription"),
      });
      return;
    }

    setIsSubmitting(true);
    const sessionId = getSessionId();
    const clientMeta = getClientMeta();

    await proposeUpdate({
      targetCollection: "regimeMembers",
      targetId: member._id,
      proposedChanges: serializeChanges(validation.data),
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
      photoUrls: "",
      reason: "",
    });
    setIsSubmitting(false);
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl({});
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error("Upload failed.");
        }

        const { storageId } = (await result.json()) as { storageId: string };
        const resolvedUrl = await getUploadUrl({ storageId });
        if (resolvedUrl) {
          uploadedUrls.push(resolvedUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormState((prev) => {
          const existing = prev.photoUrls.trim();
          const combined = existing.length
            ? `${existing}, ${uploadedUrls.join(", ")}`
            : uploadedUrls.join(", ");
          return { ...prev, photoUrls: combined };
        });
      }
      event.target.value = "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
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
          {member.photoUrls?.length ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{membersT("form.photos")}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {member.photoUrls.map((url) => (
                  <div key={url} className="overflow-hidden rounded-lg border border-zinc-200">
                    <Image
                      src={url}
                      alt={member.name}
                      width={640}
                      height={360}
                      className="h-40 w-full object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{membersT("form.name")}</div>
              <div className="text-base text-foreground">{member.name}</div>
              {pendingByField.name ? (
                <PendingFieldUpdate
                  update={pendingByField.name.update}
                  proposedValue={String(pendingByField.name.proposedValue)}
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
                  proposedValue={String(pendingByField.status.proposedValue)}
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
                  proposedValue={String(pendingByField.organization.proposedValue)}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{membersT("form.unit")}</div>
              <div className="text-base text-foreground">{member.unit}</div>
              {pendingByField.unit ? (
                <PendingFieldUpdate
                  update={pendingByField.unit.update}
                  proposedValue={String(pendingByField.unit.proposedValue)}
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
                  proposedValue={String(pendingByField.position.proposedValue)}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{membersT("form.rank")}</div>
              <div className="text-base text-foreground">{member.rank}</div>
              {pendingByField.rank ? (
                <PendingFieldUpdate
                  update={pendingByField.rank.update}
                  proposedValue={String(pendingByField.rank.proposedValue)}
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
                  proposedValue={String(pendingByField.lastKnownLocation.proposedValue)}
                />
              ) : null}
            </div>
            {pendingByField.photoUrls ? (
              <div className="space-y-2 md:col-span-2">
                <div className="text-xs text-muted-foreground">
                  {pendingT("fieldPending")} · {membersT("form.photos")}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {normalizePhotoUrls(pendingByField.photoUrls.proposedValue).map(
                    (url) => (
                      <div
                        key={url}
                        className="overflow-hidden rounded-lg border border-amber-200"
                      >
                        <Image
                          src={url}
                          alt={member.name}
                          width={640}
                          height={360}
                          className="h-40 w-full object-cover"
                          unoptimized
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : null}
            {Object.keys(pendingByField).some((key) => !shownKeys.has(key)) ? (
              <div className="space-y-2 md:col-span-2">
                <div className="text-xs text-muted-foreground">
                  {pendingT("otherPendingFields")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(pendingByField)
                    .filter((key) => !shownKeys.has(key))
                    .map((key) => (
                      <Badge key={key} variant="secondary">
                        {fieldLabels[key as keyof typeof fieldLabels] ?? key}
                      </Badge>
                    ))}
                </div>
              </div>
            ) : null}
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
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, status: value }))
                  }
                  disabled={isFieldPending("status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("propose.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{membersT("status.active")}</SelectItem>
                    <SelectItem value="arrested">{membersT("status.arrested")}</SelectItem>
                    <SelectItem value="fled">{membersT("status.fled")}</SelectItem>
                    <SelectItem value="deceased">{membersT("status.deceased")}</SelectItem>
                    <SelectItem value="unknown">{membersT("status.unknown")}</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="update-photos">{membersT("form.photos")}</Label>
                <Input
                  id="update-photos"
                  value={formState.photoUrls}
                  disabled={isFieldPending("photoUrls")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, photoUrls: event.target.value }))
                  }
                />
                <Input
                  id="update-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isUploading || isFieldPending("photoUrls")}
                />
                <p className="text-xs text-muted-foreground">
                  {isUploading ? membersT("form.uploading") : membersT("form.uploadPhotos")}
                </p>
                {isFieldPending("photoUrls") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
                {uploadError ? (
                  <p className="text-xs text-destructive">{uploadError}</p>
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
