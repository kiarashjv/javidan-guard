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

export default function RegimeMembersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("regimeMembers");
  const table = useTranslations("table");
  const pageSize = 20;
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
    organization: searchParams.get("organization") ?? "all",
    unit: searchParams.get("unit") ?? "all",
    lastKnownLocation: provinceNameParam ?? searchParams.get("lastKnownLocation") ?? "all",
  };
  const result = useQuery(api.regimeMembers.listCurrentPaginated, {
    paginationOpts: { numItems: pageSize, cursor },
    searchQuery: trimmedQuery.length > 0 ? trimmedQuery : undefined,
  });
  const isLoading = result === undefined;
  const members = result?.page ?? [];
  const direction = locale === "fa" ? "rtl" : "ltr";
  const pageIndex = cursorStack.length + 1;

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
          <Link href={`/${locale}/regime-members/new`}>
            <PlusIcon className="size-4" />
            {t("form.title")}
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
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
            searchQuery={searchQuery}
            onSearchQueryChange={handleSearchChange}
            searchMode="server"
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
            initialStatusFilter={initialStatus}
            onStatusFilterChange={handleStatusFilterChange}
            filters={[
              { key: "organization", label: t("form.organization") },
              { key: "unit", label: t("form.unit") },
              { key: "lastKnownLocation", label: t("form.location") },
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
            hasNext: Boolean(result?.continueCursor),
            hasPrevious: cursorStack.length > 0,
            onNext: handleNext,
            onPrevious: handlePrevious,
          }}
          isLoading={isLoading}
          renderEmpty={
            !isLoading && members.length === 0
              ? () => (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters ? t("emptySearch") : t("empty")}
                    </p>
                    <Button asChild>
                      <Link href={`/${locale}/regime-members/new`}>
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
