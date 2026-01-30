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

export default function VictimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const t = useTranslations("victimDetail");
  const victimsT = useTranslations("victims");
  const pendingT = useTranslations("pendingUpdates");
  const victim = useQuery(api.victims.getById, { id });
  const proposeUpdate = useMutation(api.pendingUpdates.propose);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const pendingUpdates = useQuery(api.pendingUpdates.listForTarget, {
    targetCollection: "victims",
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


  const currentValueLabel = (value: string | undefined) =>
    t("propose.currentValue", {
      value: value?.trim().length ? value : t("propose.currentValueEmpty"),
    });

  const [formState, setFormState] = useState({
    name: "",
    hometown: "",
    status: "",
    incidentDate: "",
    incidentLocation: "",
    circumstances: "",
    photoUrls: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePropose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!victim) {
      return;
    }

    const proposedChanges: Record<string, unknown> = {};
    if (formState.name.trim().length > 0) proposedChanges.name = formState.name.trim();
    if (formState.hometown.trim().length > 0) {
      proposedChanges.hometown = formState.hometown.trim();
    }
    if (formState.status.trim().length > 0) {
      proposedChanges.status = formState.status.trim();
    }
    if (formState.incidentDate.trim().length > 0) {
      proposedChanges.incidentDate = formState.incidentDate.trim();
    }
    if (formState.incidentLocation.trim().length > 0) {
      proposedChanges.incidentLocation = formState.incidentLocation.trim();
    }
    if (formState.circumstances.trim().length > 0) {
      proposedChanges.circumstances = formState.circumstances.trim();
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
        <CardContent className="space-y-6 text-sm text-zinc-600">
          <div>
            {t("recordId")}: {victim._id}
          </div>
          {victim.photoUrls?.length ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{victimsT("form.photos")}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {victim.photoUrls.map((url) => (
                  <div key={url} className="overflow-hidden rounded-lg border border-zinc-200">
                    <Image
                      src={url}
                      alt={victim.name}
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
              <div className="text-xs text-muted-foreground">{victimsT("form.name")}</div>
              <div className="text-base text-foreground">{victim.name}</div>
              {pendingByField.name ? (
                <PendingFieldUpdate
                  update={pendingByField.name.update}
                  proposedValue={String(pendingByField.name.proposedValue)}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{victimsT("form.status")}</div>
              <div className="text-base text-foreground">{t(`status.${victim.status}`)}</div>
              {pendingByField.status ? (
                <PendingFieldUpdate
                  update={pendingByField.status.update}
                  proposedValue={String(pendingByField.status.proposedValue)}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{victimsT("form.hometown")}</div>
              <div className="text-base text-foreground">{victim.hometown}</div>
              {pendingByField.hometown ? (
                <PendingFieldUpdate
                  update={pendingByField.hometown.update}
                  proposedValue={String(pendingByField.hometown.proposedValue)}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {victimsT("form.incidentDate")}
              </div>
              <div className="text-base text-foreground">{victim.incidentDate}</div>
              {pendingByField.incidentDate ? (
                <PendingFieldUpdate
                  update={pendingByField.incidentDate.update}
                  proposedValue={String(pendingByField.incidentDate.proposedValue)}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {victimsT("form.incidentLocation")}
              </div>
              <div className="text-base text-foreground">{victim.incidentLocation}</div>
              {pendingByField.incidentLocation ? (
                <PendingFieldUpdate
                  update={pendingByField.incidentLocation.update}
                  proposedValue={String(pendingByField.incidentLocation.proposedValue)}
                />
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-xs text-muted-foreground">
                {victimsT("form.circumstances")}
              </div>
              <div className="text-base text-foreground">{victim.circumstances}</div>
              {pendingByField.circumstances ? (
                <PendingFieldUpdate
                  update={pendingByField.circumstances.update}
                  proposedValue={String(pendingByField.circumstances.proposedValue)}
                />
              ) : null}
            </div>
            {pendingByField.photoUrls ? (
              <div className="space-y-2 md:col-span-2">
                <div className="text-xs text-muted-foreground">
                  {pendingT("fieldPending")} · {victimsT("form.photos")}
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
                          alt={victim.name}
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
          </div>
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
                  disabled={isFieldPending("name")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(victim.name)}
                </p>
                {isFieldPending("name") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-hometown">{t("propose.hometown")}</Label>
                <Input
                  id="update-victim-hometown"
                  value={formState.hometown}
                  disabled={isFieldPending("hometown")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, hometown: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(victim.hometown)}
                </p>
                {isFieldPending("hometown") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-status">{t("propose.status")}</Label>
                <Input
                  id="update-victim-status"
                  value={formState.status}
                  disabled={isFieldPending("status")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, status: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(t(`status.${victim.status}`))}
                </p>
                {isFieldPending("status") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-date">{t("propose.incidentDate")}</Label>
                <Input
                  id="update-victim-date"
                  value={formState.incidentDate}
                  disabled={isFieldPending("incidentDate")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, incidentDate: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(victim.incidentDate)}
                </p>
                {isFieldPending("incidentDate") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-location">{t("propose.incidentLocation")}</Label>
                <Input
                  id="update-victim-location"
                  value={formState.incidentLocation}
                  disabled={isFieldPending("incidentLocation")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, incidentLocation: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(victim.incidentLocation)}
                </p>
                {isFieldPending("incidentLocation") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="update-victim-circumstances">
                  {t("propose.circumstances")}
                </Label>
                <Textarea
                  id="update-victim-circumstances"
                  value={formState.circumstances}
                  disabled={isFieldPending("circumstances")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, circumstances: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(victim.circumstances)}
                </p>
                {isFieldPending("circumstances") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="update-victim-photos">{victimsT("form.photos")}</Label>
                <Input
                  id="update-victim-photos"
                  value={formState.photoUrls}
                  disabled={isFieldPending("photoUrls")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, photoUrls: event.target.value }))
                  }
                />
                <Input
                  id="update-victim-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isUploading || isFieldPending("photoUrls")}
                />
                <p className="text-xs text-muted-foreground">
                  {isUploading ? victimsT("form.uploading") : victimsT("form.uploadPhotos")}
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
