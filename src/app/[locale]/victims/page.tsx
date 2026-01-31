"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { api } from "@/lib/convex-api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export default function VictimsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("victims");
  const table = useTranslations("table");
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const debouncedQuery = useDebouncedValue(searchQuery, 400);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const trimmedQuery = debouncedQuery.trim();
  const initialStatus = searchParams.get("status") ?? "all";

  // Handle province parameter from map click
  const provinceNameParam = searchParams.get("provinceName");

  const initialFilterValues = {
    hometown: searchParams.get("hometown") ?? "all",
    incidentLocation: provinceNameParam ?? searchParams.get("incidentLocation") ?? "all",
  };
  const result = useQuery(api.victims.listCurrentPaginated, {
    paginationOpts: { numItems: pageSize, cursor },
    searchQuery: trimmedQuery.length > 0 ? trimmedQuery : undefined,
  });
  const totalCount = useQuery(api.victims.countCurrent, {
    searchQuery: trimmedQuery.length > 0 ? trimmedQuery : undefined,
  });
  const isLoading = result === undefined;
  const victims = result?.page ?? [];
  const direction = locale === "fa" ? "rtl" : "ltr";
  const pageIndex = cursorStack.length + 1;
  const pageCount = totalCount
    ? Math.max(1, Math.ceil(totalCount / pageSize))
    : pageIndex;

  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    const nextString = nextParams.toString();
    const currentString = searchParams.toString();
    if (nextString !== currentString) {
      const nextUrl = nextString ? `${pathname}?${nextString}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    updateSearchParams({ q: trimmedQuery.length > 0 ? trimmedQuery : null });
  }, [trimmedQuery, updateSearchParams]);

  const resetPagination = () => {
    setCursorStack([]);
    setCursor(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetPagination();
  };

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

  const handleStatusFilterChange = (value: string) => {
    resetPagination();
    updateSearchParams({ status: value });
  };

  const handleFilterValuesChange = (values: Record<string, string>) => {
    resetPagination();
    updateSearchParams(values);
  };

  const hasActiveFilters =
    trimmedQuery.length > 0 ||
    initialStatus !== "all" ||
    Object.values(initialFilterValues).some((value) => value !== "all");

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

      <div className="space-y-6">
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
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchChange}
            searchMode="server"
            onRowClick={(victim) =>
              router.push(`/${locale}/victims/${victim._id}`)
            }
            direction={direction}
            showStatusFilter
            statusOptions={[
              { value: "murdered", label: t("status.murdered") },
              { value: "captured", label: t("status.captured") },
              { value: "vanished", label: t("status.vanished") },
              { value: "released", label: t("status.released") },
              { value: "confirmed_dead", label: t("status.confirmed_dead") },
            ]}
            initialStatusFilter={initialStatus}
            onStatusFilterChange={handleStatusFilterChange}
            filters={[
              { key: "hometown", label: t("form.hometown") },
              { key: "incidentLocation", label: t("form.incidentLocation") },
            ]}
            initialFilterValues={initialFilterValues}
            onFilterValuesChange={handleFilterValuesChange}
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
              filters: table("filters"),
            }}
          pagination={{
            pageIndex,
            pageCount,
            hasNext: Boolean(result?.continueCursor),
            hasPrevious: cursorStack.length > 0,
            onNext: handleNext,
            onPrevious: handlePrevious,
          }}
          isLoading={isLoading}
          renderEmpty={
            !isLoading && victims.length === 0
              ? () => (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters ? t("emptySearch") : t("empty")}
                    </p>
                    <Button asChild>
                      <Link href={`/${locale}/victims/new`}>
                        {t("form.title")}
                      </Link>
                    </Button>
                  </div>
                )
              : undefined
          }
        />
      </div>
    </section>
  );
}
