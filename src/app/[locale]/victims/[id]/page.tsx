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
import { victimUpdateSchema } from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";
import { serializeChanges } from "@/lib/pending-updates";
import { PendingFieldUpdate } from "@/components/verification/PendingFieldUpdate";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { iranCities } from "@/data/iran-cities";
import { formatIranLocation } from "@/lib/location";

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
  const common = useTranslations("common");
  const victim = useQuery(api.victims.getById, { id });
  const proposeUpdate = useMutation(api.pendingUpdates.propose);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getUploadUrl = useMutation(api.files.getUrl);
  const { toast } = useToast();
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
  const shownKeys = useMemo(
    () =>
      new Set([
        "name",
        "status",
        "hometownProvince",
        "hometownCity",
        "hometown",
        "incidentDate",
        "incidentProvince",
        "incidentCity",
        "incidentLocation",
        "circumstances",
        "photoUrls",
      ]),
    []
  );
  const fieldLabels = useMemo(
    () => ({
      name: victimsT("form.name"),
      hometownProvince: victimsT("form.hometownProvince"),
      hometownCity: victimsT("form.hometownCity"),
      hometown: victimsT("form.hometown"),
      status: victimsT("form.status"),
      incidentDate: victimsT("form.incidentDate"),
      incidentProvince: victimsT("form.incidentProvince"),
      incidentCity: victimsT("form.incidentCity"),
      incidentLocation: victimsT("form.incidentLocation"),
      circumstances: victimsT("form.circumstances"),
      evidenceLinks: victimsT("form.evidenceLinks"),
      newsReports: victimsT("form.newsReports"),
      witnessAccounts: victimsT("form.witnessAccounts"),
      linkedPerpetrators: victimsT("form.linkedPerpetrators"),
      photoUrls: victimsT("form.photos"),
      age: victimsT("form.age"),
    }),
    [victimsT]
  );


  const currentValueLabel = (value: string | undefined) =>
    t("propose.currentValue", {
      value: value?.trim().length ? value : t("propose.currentValueEmpty"),
    });

  const [formState, setFormState] = useState({
    name: "",
    hometownProvince: "",
    hometownCity: "",
    status: "",
    incidentDate: "",
    incidentProvince: "",
    incidentCity: "",
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
    const nextHometownProvince = formState.hometownProvince.trim();
    const nextHometownCity = formState.hometownCity.trim();
    if (nextHometownProvince.length > 0) {
      proposedChanges.hometownProvince = nextHometownProvince;
    }
    if (nextHometownCity.length > 0) {
      proposedChanges.hometownCity = nextHometownCity;
    }
    if (nextHometownProvince.length > 0 || nextHometownCity.length > 0) {
      proposedChanges.hometown = formatIranLocation(
        nextHometownProvince.length > 0 ? nextHometownProvince : victim.hometownProvince,
        nextHometownCity.length > 0 ? nextHometownCity : victim.hometownCity,
      );
    }
    if (formState.status.trim().length > 0) {
      proposedChanges.status = formState.status.trim();
    }
    if (formState.incidentDate.trim().length > 0) {
      proposedChanges.incidentDate = formState.incidentDate.trim();
    }
    const nextIncidentProvince = formState.incidentProvince.trim();
    const nextIncidentCity = formState.incidentCity.trim();
    if (nextIncidentProvince.length > 0) {
      proposedChanges.incidentProvince = nextIncidentProvince;
    }
    if (nextIncidentCity.length > 0) {
      proposedChanges.incidentCity = nextIncidentCity;
    }
    if (nextIncidentProvince.length > 0 || nextIncidentCity.length > 0) {
      proposedChanges.incidentLocation = formatIranLocation(
        nextIncidentProvince.length > 0 ? nextIncidentProvince : victim.incidentProvince,
        nextIncidentCity.length > 0 ? nextIncidentCity : victim.incidentCity,
      );
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

    const validation = victimUpdateSchema.safeParse(proposedChanges);
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
      targetCollection: "victims",
      targetId: victim._id,
      proposedChanges: serializeChanges(validation.data),
      reason: formState.reason.trim(),
      proposedBy: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
    });

    setFormState({
      name: "",
      hometownProvince: "",
      hometownCity: "",
      status: "",
      incidentDate: "",
      incidentProvince: "",
      incidentCity: "",
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
          <div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/victims/${victim._id}/history`}>
                {t("historyLink")}
              </Link>
            </Button>
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
                <Label>{t("propose.hometownProvince")}</Label>
                <SearchableSelect
                  value={formState.hometownProvince}
                  options={Object.keys(iranCities)}
                  placeholder={victimsT("form.provincePlaceholder")}
                  searchPlaceholder={victimsT("form.searchProvince")}
                  emptyLabel={victimsT("form.noResults")}
                  direction={locale === "fa" ? "rtl" : "ltr"}
                  disabled={isFieldPending("hometownProvince")}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      hometownProvince: value,
                      hometownCity: "",
                    }))
                  }
                />
                {isFieldPending("hometownProvince") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("propose.hometownCity")}</Label>
                <SearchableSelect
                  value={formState.hometownCity}
                  options={iranCities[formState.hometownProvince] ?? []}
                  placeholder={victimsT("form.cityPlaceholder")}
                  searchPlaceholder={victimsT("form.searchCity")}
                  emptyLabel={victimsT("form.noResults")}
                  direction={locale === "fa" ? "rtl" : "ltr"}
                  disabled={
                    !formState.hometownProvince ||
                    isFieldPending("hometownCity")
                  }
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      hometownCity: value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(victim.hometown)}
                </p>
                {isFieldPending("hometownCity") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-victim-status">{t("propose.status")}</Label>
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
                    <SelectItem value="murdered">{victimsT("status.murdered")}</SelectItem>
                    <SelectItem value="captured">{victimsT("status.captured")}</SelectItem>
                    <SelectItem value="vanished">{victimsT("status.vanished")}</SelectItem>
                    <SelectItem value="released">{victimsT("status.released")}</SelectItem>
                    <SelectItem value="confirmed_dead">
                      {victimsT("status.confirmed_dead")}
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>{t("propose.incidentProvince")}</Label>
                <SearchableSelect
                  value={formState.incidentProvince}
                  options={Object.keys(iranCities)}
                  placeholder={victimsT("form.provincePlaceholder")}
                  searchPlaceholder={victimsT("form.searchProvince")}
                  emptyLabel={victimsT("form.noResults")}
                  direction={locale === "fa" ? "rtl" : "ltr"}
                  disabled={isFieldPending("incidentProvince")}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      incidentProvince: value,
                      incidentCity: "",
                    }))
                  }
                />
                {isFieldPending("incidentProvince") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("propose.incidentCity")}</Label>
                <SearchableSelect
                  value={formState.incidentCity}
                  options={iranCities[formState.incidentProvince] ?? []}
                  placeholder={victimsT("form.cityPlaceholder")}
                  searchPlaceholder={victimsT("form.searchCity")}
                  emptyLabel={victimsT("form.noResults")}
                  direction={locale === "fa" ? "rtl" : "ltr"}
                  disabled={
                    !formState.incidentProvince ||
                    isFieldPending("incidentCity")
                  }
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      incidentCity: value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(victim.incidentLocation)}
                </p>
                {isFieldPending("incidentCity") ? (
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
