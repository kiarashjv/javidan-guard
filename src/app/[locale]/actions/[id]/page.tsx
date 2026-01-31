"use client";

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
import { actionUpdateSchema } from "@/lib/client-validation";
import { getClientMeta, getSessionId } from "@/lib/session";
import { serializeChanges } from "@/lib/pending-updates";
import { PendingFieldUpdate } from "@/components/verification/PendingFieldUpdate";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { iranCities } from "@/data/iran-cities";
import { formatIranLocation } from "@/lib/location";

export default function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const t = useTranslations("actionDetail");
  const actionsT = useTranslations("actions");
  const pendingT = useTranslations("pendingUpdates");
  const common = useTranslations("common");
  const action = useQuery(api.actions.getById, { id });
  const proposeUpdate = useMutation(api.pendingUpdates.propose);
  const { toast } = useToast();
  const pendingUpdates = useQuery(api.pendingUpdates.listForTarget, {
    targetCollection: "actions",
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
  const shownKeys = useMemo(
    () =>
      new Set([
        "actionType",
        "date",
        "locationProvince",
        "locationCity",
        "location",
        "description",
      ]),
    []
  );
  const fieldLabels = useMemo(
    () => ({
      actionType: actionsT("form.actionType"),
      date: actionsT("form.date"),
      locationProvince: actionsT("form.province"),
      locationCity: actionsT("form.city"),
      location: actionsT("form.location"),
      description: actionsT("form.description"),
      perpetratorId: actionsT("form.perpetratorId"),
      victimIds: actionsT("form.victimIds"),
      evidenceUrls: actionsT("form.evidenceUrls"),
      videoLinks: actionsT("form.videoLinks"),
      documentLinks: actionsT("form.documentLinks"),
      witnessStatements: actionsT("form.witnessStatements"),
    }),
    [actionsT]
  );


  const currentValueLabel = (value: string | undefined) =>
    t("propose.currentValue", {
      value: value?.trim().length ? value : t("propose.currentValueEmpty"),
    });

  const [formState, setFormState] = useState({
    actionType: "",
    date: "",
    locationProvince: "",
    locationCity: "",
    description: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePropose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) {
      return;
    }
    const typedAction = action as {
      locationProvince?: string;
      locationCity?: string;
    };

    const proposedChanges: Record<string, string> = {};
    if (formState.actionType.trim().length > 0) {
      proposedChanges.actionType = formState.actionType.trim();
    }
    if (formState.date.trim().length > 0) {
      proposedChanges.date = formState.date.trim();
    }
    if (formState.description.trim().length > 0) {
      proposedChanges.description = formState.description.trim();
    }
    const nextProvince = formState.locationProvince.trim();
    const nextCity = formState.locationCity.trim();
    if (nextProvince.length > 0) {
      proposedChanges.locationProvince = nextProvince;
    }
    if (nextCity.length > 0) {
      proposedChanges.locationCity = nextCity;
    }
    if (nextProvince.length > 0 || nextCity.length > 0) {
      proposedChanges.location = formatIranLocation(
        nextProvince.length > 0 ? nextProvince : typedAction.locationProvince,
        nextCity.length > 0 ? nextCity : typedAction.locationCity,
      );
    }

    if (Object.keys(proposedChanges).length === 0) {
      return;
    }

    const validation = actionUpdateSchema.safeParse(proposedChanges);
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
      targetCollection: "actions",
      targetId: (action as { _id: string })._id,
      proposedChanges: serializeChanges(validation.data),
      reason: formState.reason.trim(),
      proposedBy: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
    });

    setFormState({
      actionType: "",
      date: "",
      locationProvince: "",
      locationCity: "",
      description: "",
      reason: "",
    });
    setIsSubmitting(false);
  }

  if (action === undefined) {
    return <div className="text-sm text-zinc-500">{t("loading")}</div>;
  }

  if (!action) {
    return <div className="text-sm text-zinc-500">{t("notFound")}</div>;
  }

  const typed = action as {
    _id: string;
    actionType: string;
    location: string;
    locationProvince?: string;
    locationCity?: string;
    date: string;
    description: string;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1 text-start">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-zinc-600">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/actions`}>{t("back")}</Link>
        </Button>
      </div>

      <Card className="border border-zinc-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{typed.actionType}</CardTitle>
            <Badge variant="secondary">{typed.date}</Badge>
          </div>
          <CardDescription>{typed.location}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-zinc-600">
          <div>
            {t("recordId")}: {typed._id}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{actionsT("form.actionType")}</div>
              <div className="text-base text-foreground">
                {actionsT(`types.${typed.actionType}`)}
              </div>
              {pendingByField.actionType ? (
                <PendingFieldUpdate
                  update={pendingByField.actionType.update}
                  proposedValue={pendingByField.actionType.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{actionsT("form.date")}</div>
              <div className="text-base text-foreground">{typed.date}</div>
              {pendingByField.date ? (
                <PendingFieldUpdate
                  update={pendingByField.date.update}
                  proposedValue={pendingByField.date.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{actionsT("form.location")}</div>
              <div className="text-base text-foreground">{typed.location}</div>
              {pendingByField.location ? (
                <PendingFieldUpdate
                  update={pendingByField.location.update}
                  proposedValue={pendingByField.location.proposedValue}
                />
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-xs text-muted-foreground">{actionsT("form.description")}</div>
              <div className="text-base text-foreground">{typed.description}</div>
              {pendingByField.description ? (
                <PendingFieldUpdate
                  update={pendingByField.description.update}
                  proposedValue={pendingByField.description.proposedValue}
                />
              ) : null}
            </div>
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
              <Link href={`/${locale}/actions/${typed._id}/history`}>
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
                <Label htmlFor="update-action-type">{t("propose.actionType")}</Label>
                <Select
                  value={formState.actionType}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, actionType: value }))
                  }
                  disabled={isFieldPending("actionType")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("propose.actionType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="killing">{actionsT("types.killing")}</SelectItem>
                    <SelectItem value="torture">{actionsT("types.torture")}</SelectItem>
                    <SelectItem value="arrest">{actionsT("types.arrest")}</SelectItem>
                    <SelectItem value="assault">{actionsT("types.assault")}</SelectItem>
                    <SelectItem value="other">{actionsT("types.other")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(actionsT(`types.${typed.actionType}`))}
                </p>
                {isFieldPending("actionType") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-action-date">{t("propose.date")}</Label>
                <Input
                  id="update-action-date"
                  value={formState.date}
                  disabled={isFieldPending("date")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(typed.date)}
                </p>
                {isFieldPending("date") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("propose.province")}</Label>
                <SearchableSelect
                  value={formState.locationProvince}
                  options={Object.keys(iranCities)}
                  placeholder={actionsT("form.provincePlaceholder")}
                  searchPlaceholder={actionsT("form.searchProvince")}
                  emptyLabel={actionsT("form.noResults")}
                  direction={locale === "fa" ? "rtl" : "ltr"}
                  disabled={isFieldPending("locationProvince")}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      locationProvince: value,
                      locationCity: "",
                    }))
                  }
                />
                {isFieldPending("locationProvince") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("propose.city")}</Label>
                <SearchableSelect
                  value={formState.locationCity}
                  options={iranCities[formState.locationProvince] ?? []}
                  placeholder={actionsT("form.cityPlaceholder")}
                  searchPlaceholder={actionsT("form.searchCity")}
                  emptyLabel={actionsT("form.noResults")}
                  direction={locale === "fa" ? "rtl" : "ltr"}
                  disabled={
                    !formState.locationProvince ||
                    isFieldPending("locationCity")
                  }
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      locationCity: value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(typed.location)}
                </p>
                {isFieldPending("locationCity") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="update-action-description">{t("propose.description")}</Label>
                <Textarea
                  id="update-action-description"
                  value={formState.description}
                  disabled={isFieldPending("description")}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {currentValueLabel(typed.description)}
                </p>
                {isFieldPending("description") ? (
                  <p className="text-xs text-amber-600">{pendingT("fieldLocked")}</p>
                ) : null}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="update-action-reason">{t("propose.reason")}</Label>
              <Textarea
                id="update-action-reason"
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
