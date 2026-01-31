"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const pageSize = 20;
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const result = useQuery(api.regimeMembers.listCurrentPaginated, {
    paginationOpts: { numItems: pageSize, cursor },
  });
  const members = result?.page ?? [];
  const direction = locale === "fa" ? "rtl" : "ltr";
  const pageIndex = cursorStack.length + 1;

  const handleNext = () => {
    if (!result?.continueCursor) return;
    setCursorStack((prev) => [...prev, cursor]);
    setCursor(result.continueCursor);
  };

  const handlePrevious = () => {
    setCursorStack((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      const previousCursor = next.length === 0 ? null : next[next.length - 1];
      setCursor(previousCursor);
      return next;
    });
  };

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

      {result === undefined ? (
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
            resultsPage: (from, to) => table("resultsPage", { from, to }),
            resultsFilteredPage: (from, to, filtered) =>
              table("resultsFilteredPage", { from, to, filtered }),
            page: (current, total) => table("page", { current, total }),
            pageCurrent: (current) => table("pageCurrent", { current }),
            rowsPerPage: table("rowsPerPage"),
            noResults: table("noResults"),
            previous: table("previous"),
            next: table("next"),
            status: table("status"),
          }}
          pagination={{
            pageIndex,
            hasNext: Boolean(result?.continueCursor),
            hasPrevious: cursorStack.length > 0,
            onNext: handleNext,
            onPrevious: handlePrevious,
          }}
        />
      )}
    </section>
  );
}
