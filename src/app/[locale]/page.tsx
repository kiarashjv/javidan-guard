"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecentActivity } from "@/components/maps/RecentActivity";

const IranMap = dynamic(() => import("@/components/maps/IranMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-200 bg-muted/20 rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("home");
  const mapData = useQuery(api.analytics.getMapData);

  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-6 py-20">
        <div className="flex flex-col items-center gap-6">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
            Documentation & Verification
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <p className="max-w-175 text-lg text-muted-foreground sm:text-xl">
            {t("subtitle")}
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button size="lg">{t("ctaPrimary")}</Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/regime-members`}>{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="w-full">
        <IranMap data={mapData} />
        <RecentActivity />
      </section>

      {/* Features Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regime Members</CardTitle>
            <CardDescription>
              Document and track regime officials and their actions
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Victims</CardTitle>
            <CardDescription>
              Honor and remember those affected by the regime
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verified Records</CardTitle>
            <CardDescription>
              Community-verified documentation with full transparency
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
