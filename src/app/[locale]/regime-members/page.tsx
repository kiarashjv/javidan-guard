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

export default function RegimeMembersPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("regimeMembers");
  const table = useTranslations("table");
  const members = useQuery(api.regimeMembers.listCurrent, {});
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/${locale}/regime-members/new`}>
            <PlusIcon className="size-4" />
            {t("form.title")}
          </Link>
        </Button>
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
                <Badge variant="secondary">{t(`status.${member.status}`)}</Badge>
              ),
            },
            {
              key: "lastKnownLocation",
              label: t("form.location"),
            },
          ]}
          searchPlaceholder={t("searchPlaceholder")}
          onRowClick={(member) =>
            router.push(`/${locale}/regime-members/${member._id}`)
          }
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
