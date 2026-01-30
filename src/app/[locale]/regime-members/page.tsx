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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table/data-table";
import { api } from "@/lib/convex-api";
import { getClientMeta, getSessionId } from "@/lib/session";
import type { RegimeMemberStatus } from "@/types/records";

export default function RegimeMembersPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("regimeMembers");
  const table = useTranslations("table");
  const members = useQuery(api.regimeMembers.listCurrent, {});
  const createMember = useMutation(api.regimeMembers.create);
  const direction = locale === "fa" ? "rtl" : "ltr";

  const [dialogOpen, setDialogOpen] = useState(false);
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

      {members === undefined ? (
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      ) : (
        <DataTable
          data={members}
          columns={[
            {
              key: "name",
              label: t("form.name"),
              sortable: true,
            },
            {
              key: "organization",
              label: t("form.organization"),
              sortable: true,
            },
            {
              key: "position",
              label: t("form.position"),
              sortable: true,
            },
            {
              key: "status",
              label: t("form.status"),
              sortable: true,
              render: (member) => (
                <Badge variant="secondary">
                  {t(`status.${member.status}`)}
                </Badge>
              ),
            },
            {
              key: "lastKnownLocation",
              label: t("form.location"),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(member) => router.push(`/${locale}/regime-members/${member._id}`)}
          direction={direction}
          showStatusFilter
          statusOptions={[
            { value: "active", label: t("status.active") },
            { value: "arrested", label: t("status.arrested") },
            { value: "fled", label: t("status.fled") },
            { value: "deceased", label: t("status.deceased") },
            { value: "unknown", label: t("status.unknown") },
          ]}
          filters={[
            { key: "organization", label: t("form.organization") },
            { key: "unit", label: t("form.unit") },
            { key: "lastKnownLocation", label: t("form.location") },
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
