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

export default function VictimsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("victims");
  const table = useTranslations("table");
  const victims = useQuery(api.victims.listCurrent, {});
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/${locale}/victims/new`}>
            <PlusIcon className="size-4" />
            {t("form.title")}
          </Link>
        </Button>
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
                <Badge variant="secondary">{t(`status.${victim.status}`)}</Badge>
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
