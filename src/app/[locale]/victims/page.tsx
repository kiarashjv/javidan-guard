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
import type { VictimStatus } from "@/types/records";

export default function VictimsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("victims");
  const table = useTranslations("table");
  const victims = useQuery(api.victims.listCurrent, {});
  const createVictim = useMutation(api.victims.create);
  const direction = locale === "fa" ? "rtl" : "ltr";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    age: "",
    hometown: "",
    status: "murdered" as VictimStatus,
    incidentDate: "",
    incidentLocation: "",
    circumstances: "",
    evidenceLinks: "",
    newsReports: "",
    witnessAccounts: "",
    linkedPerpetrators: "",
    photoUrls: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = useMemo(() => {
    return (
      formState.name.trim().length > 1 &&
      formState.hometown.trim().length > 1 &&
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

    await createVictim({
      name: formState.name.trim(),
      age: Number(formState.age || "0"),
      photoUrls: formState.photoUrls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      hometown: formState.hometown.trim(),
      status: formState.status,
      incidentDate: formState.incidentDate.trim(),
      incidentLocation: formState.incidentLocation.trim(),
      circumstances: formState.circumstances.trim(),
      evidenceLinks: formState.evidenceLinks
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      newsReports: formState.newsReports
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      witnessAccounts: formState.witnessAccounts
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      linkedPerpetrators: formState.linkedPerpetrators
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      createdBySession: sessionId,
      ipHash: clientMeta.ipHash,
      userAgent: clientMeta.userAgent,
      reason: formState.reason.trim(),
    });

    setFormState({
      name: "",
      age: "",
      hometown: "",
      status: "murdered",
      incidentDate: "",
      incidentLocation: "",
      circumstances: "",
      evidenceLinks: "",
      newsReports: "",
      witnessAccounts: "",
      linkedPerpetrators: "",
      photoUrls: "",
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
                <Label htmlFor="victim-name">{t("form.name")}</Label>
                <Input
                  id="victim-name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="victim-age">{t("form.age")}</Label>
                <Input
                  id="victim-age"
                  type="number"
                  min="0"
                  value={formState.age}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, age: event.target.value }))
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
                      status: value as VictimStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="murdered">{t("status.murdered")}</SelectItem>
                    <SelectItem value="captured">{t("status.captured")}</SelectItem>
                    <SelectItem value="vanished">{t("status.vanished")}</SelectItem>
                    <SelectItem value="released">{t("status.released")}</SelectItem>
                    <SelectItem value="confirmed_dead">
                      {t("status.confirmed_dead")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="victim-date">{t("form.incidentDate")}</Label>
                <Input
                  id="victim-date"
                  value={formState.incidentDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      incidentDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="victim-circumstances">{t("form.circumstances")}</Label>
                <Textarea
                  id="victim-circumstances"
                  value={formState.circumstances}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      circumstances: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="victim-evidence">{t("form.evidenceLinks")}</Label>
                <Input
                  id="victim-evidence"
                  value={formState.evidenceLinks}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      evidenceLinks: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="victim-news">{t("form.newsReports")}</Label>
                <Input
                  id="victim-news"
                  value={formState.newsReports}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      newsReports: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="victim-witness">{t("form.witnessAccounts")}</Label>
                <Input
                  id="victim-witness"
                  value={formState.witnessAccounts}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      witnessAccounts: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="victim-linked">{t("form.linkedPerpetrators")}</Label>
                <Input
                  id="victim-linked"
                  value={formState.linkedPerpetrators}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      linkedPerpetrators: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="victim-hometown">{t("form.hometown")}</Label>
                <Input
                  id="victim-hometown"
                  value={formState.hometown}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      hometown: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="victim-location">{t("form.incidentLocation")}</Label>
                <Input
                  id="victim-location"
                  value={formState.incidentLocation}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      incidentLocation: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="victim-photos">{t("form.photos")}</Label>
                <Input
                  id="victim-photos"
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
              <Label htmlFor="victim-reason">{t("form.reason")}</Label>
              <Textarea
                id="victim-reason"
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

      {victims === undefined ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <DataTable
          data={victims}
          columns={[
            {
              key: "name",
              label: t("form.name"),
              sortable: true,
            },
            {
              key: "age",
              label: t("form.age"),
              sortable: true,
              render: (victim) => victim.age || "-",
            },
            {
              key: "hometown",
              label: t("form.hometown"),
              sortable: true,
            },
            {
              key: "status",
              label: t("form.status"),
              sortable: true,
              render: (victim) => (
                <Badge variant="secondary">
                  {t(`status.${victim.status}`)}
                </Badge>
              ),
            },
            {
              key: "incidentDate",
              label: t("form.incidentDate"),
              sortable: true,
            },
            {
              key: "incidentLocation",
              label: t("form.incidentLocation"),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(victim) => router.push(`/${locale}/victims/${victim._id}`)}
          direction={direction}
          showStatusFilter
          statusOptions={[
            { value: "murdered", label: t("status.murdered") },
            { value: "captured", label: t("status.captured") },
            { value: "vanished", label: t("status.vanished") },
            { value: "released", label: t("status.released") },
            { value: "confirmed_dead", label: t("status.confirmed_dead") },
          ]}
          filters={[
            { key: "hometown", label: t("form.hometown") },
            { key: "incidentLocation", label: t("form.incidentLocation") },
          ]}
          labels={{
            all: table("all"),
            results: (from, to, filtered, total) =>
              filtered === total
                ? table("results", { from, to, total })
                : table("resultsFiltered", { from, to, filtered, total }),
            page: (current, total) => table("page", { current, total }),
            rowsPerPage: table("rowsPerPage"),
            noResults: table("noResults"),
            previous: table("previous"),
            next: table("next"),
            status: table("status"),
          }}
        />
      )}
    </section>
  );
}
