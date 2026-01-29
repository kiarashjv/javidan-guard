"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { DataTable } from "@/components/data-table/data-table";
import { api } from "@/lib/convex-api";
import { getClientMeta, getSessionId } from "@/lib/session";

export default function ActionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("actions");
  const actions = useQuery(api.actions.listCurrent, {});
  const createAction = useMutation(api.actions.create);
  const direction = locale === "fa" ? "rtl" : "ltr";
  const actionRows = useMemo(() => (actions ?? []) as ActionRow[], [actions]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState({
    actionType: "killing",
    date: "",
    location: "",
    description: "",
    perpetratorId: "",
    victimIds: "",
    evidenceUrls: "",
    videoLinks: "",
    documentLinks: "",
    witnessStatements: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = useMemo(() => {
    return (
      formState.actionType.length > 0 &&
      formState.date.trim().length > 0 &&
      formState.location.trim().length > 0 &&
      formState.description.trim().length > 5 &&
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

    await createAction({
      actionType: formState.actionType as
        | "killing"
        | "torture"
        | "arrest"
        | "assault"
        | "other",
      date: formState.date.trim(),
      location: formState.location.trim(),
      description: formState.description.trim(),
      perpetratorId: formState.perpetratorId.trim(),
      victimIds: formState.victimIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      evidenceUrls: formState.evidenceUrls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      videoLinks: formState.videoLinks
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      documentLinks: formState.documentLinks
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      witnessStatements: formState.witnessStatements
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      createdBySession: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: formState.reason.trim(),
    });

    setFormState({
      actionType: "killing",
      date: "",
      location: "",
      description: "",
      perpetratorId: "",
      victimIds: "",
      evidenceUrls: "",
      videoLinks: "",
      documentLinks: "",
      witnessStatements: "",
      reason: "",
    });
    setIsSubmitting(false);
    setDialogOpen(false);
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto">
              <PlusIcon className="size-4" />
              {t("form.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={direction}>
            <DialogHeader>
              <DialogTitle>{t("form.title")}</DialogTitle>
              <DialogDescription>{t("form.subtitle")}</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("form.actionType")}</Label>
                <Select
                  value={formState.actionType}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, actionType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.actionTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="killing">{t("types.killing")}</SelectItem>
                    <SelectItem value="torture">{t("types.torture")}</SelectItem>
                    <SelectItem value="arrest">{t("types.arrest")}</SelectItem>
                    <SelectItem value="assault">{t("types.assault")}</SelectItem>
                    <SelectItem value="other">{t("types.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-date">{t("form.date")}</Label>
                <Input
                  id="action-date"
                  value={formState.date}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-location">{t("form.location")}</Label>
                <Input
                  id="action-location"
                  value={formState.location}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, location: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="action-description">{t("form.description")}</Label>
                <Textarea
                  id="action-description"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-perpetrator">{t("form.perpetratorId")}</Label>
                <Input
                  id="action-perpetrator"
                  value={formState.perpetratorId}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      perpetratorId: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-victims">{t("form.victimIds")}</Label>
                <Input
                  id="action-victims"
                  value={formState.victimIds}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      victimIds: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="action-evidence">{t("form.evidenceUrls")}</Label>
                <Input
                  id="action-evidence"
                  value={formState.evidenceUrls}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      evidenceUrls: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="action-videos">{t("form.videoLinks")}</Label>
                <Input
                  id="action-videos"
                  value={formState.videoLinks}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      videoLinks: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="action-docs">{t("form.documentLinks")}</Label>
                <Input
                  id="action-docs"
                  value={formState.documentLinks}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      documentLinks: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="action-witnesses">{t("form.witnessStatements")}</Label>
                <Input
                  id="action-witnesses"
                  value={formState.witnessStatements}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      witnessStatements: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="action-reason">{t("form.reason")}</Label>
              <Textarea
                id="action-reason"
                value={formState.reason}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reason: event.target.value }))
                }
              />
            </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? t("form.submitting") : t("form.submit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {actions === undefined ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <DataTable
          data={actionRows}
          columns={[
            {
              key: "actionType",
              label: t("form.actionType"),
              sortable: true,
              render: (action) => (
                <Badge variant="secondary">
                  {t(`types.${action.actionType}`)}
                </Badge>
              ),
            },
            {
              key: "date",
              label: t("form.date"),
              sortable: true,
            },
            {
              key: "location",
              label: t("form.location"),
              sortable: true,
            },
            {
              key: "description",
              label: t("form.description"),
              render: (action) => (
                <div className="max-w-md truncate">
                  {action.description}
                </div>
              ),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(action) => router.push(`/${locale}/actions/${action._id}`)}
          showStatusFilter
          statusOptions={[
            { value: "killing", label: t("types.killing") },
            { value: "torture", label: t("types.torture") },
            { value: "arrest", label: t("types.arrest") },
            { value: "assault", label: t("types.assault") },
            { value: "other", label: t("types.other") },
          ]}
        />
      )}
    </section>
  );
}

type ActionRow = {
  _id: string;
  actionType: string;
  date: string;
  location: string;
  description: string;
};
