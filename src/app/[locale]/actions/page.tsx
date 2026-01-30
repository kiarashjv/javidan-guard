"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { api } from "@/lib/convex-api";

export default function ActionsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("actions");
  const table = useTranslations("table");
  const actions = useQuery(api.actions.listCurrent, {});
  const direction = locale === "fa" ? "rtl" : "ltr";
  const actionRows = (actions ?? []) as ActionRow[];

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/${locale}/actions/new`}>
            <PlusIcon className="size-4" />
            {t("form.title")}
          </Link>
        </Button>
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
                <Badge variant="secondary">{t(`types.${action.actionType}`)}</Badge>
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
                <div className="max-w-md truncate">{action.description}</div>
              ),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(action) => router.push(`/${locale}/actions/${action._id}`)}
          direction={direction}
          showStatusFilter
          statusOptions={[
            { value: "killing", label: t("types.killing") },
            { value: "torture", label: t("types.torture") },
            { value: "arrest", label: t("types.arrest") },
            { value: "assault", label: t("types.assault") },
            { value: "other", label: t("types.other") },
          ]}
          filters={[{ key: "location", label: t("form.location") }]}
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

type ActionRow = {
  _id: string;
  actionType: string;
  date: string;
  location: string;
  description: string;
};
