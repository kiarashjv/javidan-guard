"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Users, Crosshair, FileText } from "lucide-react";

const FloatingActivity = dynamic(() => import("@/components/maps/FloatingActivity"), {
  ssr: false,
});

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
  const router = useRouter();
  const t = useTranslations("home");
  const mapTranslations = useTranslations("map");
  const mapData = useQuery(api.analytics.getMapData);
  const stats = useQuery(api.analytics.getTotalStats);

  const handleProvinceClick = (
    provinceCode: string,
    provinceName: string,
    type: 'victims' | 'actions' | 'mercenaries'
  ) => {
    const typeRoutes = {
      victims: 'victims',
      actions: 'actions',
      mercenaries: 'regime-members',
    };

    const route = typeRoutes[type];
    router.push(
      `/${locale}/${route}?province=${provinceCode}&provinceName=${encodeURIComponent(provinceName)}`
    );
  };

  return (
    <div className="flex flex-col gap-12 relative">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-6 py-12">
        <div className="flex flex-col items-center gap-6">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
            {mapTranslations("documentationVerification")}
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <p className="max-w-175 text-lg text-muted-foreground sm:text-xl">
            {t("subtitle")}
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button asChild size="lg">
              <Link href={`/${locale}/regime-members/new`}>{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/regime-members`}>{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid gap-8 sm:grid-cols-3">
        <div className="border-t-4 border-primary pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Users className="h-4 w-4" />
            {mapTranslations("victims")}
          </div>
          <div className="text-4xl font-bold">{stats?.victims ?? 0}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {mapTranslations("documentedVictims")}
          </p>
        </div>
        <div className="border-t-4 border-primary pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <FileText className="h-4 w-4" />
            {mapTranslations("actions")}
          </div>
          <div className="text-4xl font-bold">{stats?.actions ?? 0}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {mapTranslations("recordedActions")}
          </p>
        </div>
        <div className="border-t-4 border-primary pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Crosshair className="h-4 w-4" />
            {mapTranslations("mercenaries")}
          </div>
          <div className="text-4xl font-bold">{stats?.mercenaries ?? 0}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {mapTranslations("identifiedMercenaries")}
          </p>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="w-full">
        <div className="relative">
          <IranMap
            data={mapData}
            onProvinceClick={handleProvinceClick}
            translations={{
              victims: mapTranslations("victims"),
              actions: mapTranslations("actions"),
              mercenaries: mapTranslations("mercenaries"),
              viewDetails: mapTranslations("viewDetails"),
            }}
            locale={locale as "en" | "fa"}
          />

          {/* Floating Activity Notifications - Desktop only */}
          <div className="hidden md:block">
            <FloatingActivity limit={5} locale={locale as "en" | "fa"} />
          </div>
        </div>

        {/* Activity List - Mobile only, below map */}
        <div className="md:hidden mt-4">
          <FloatingActivity limit={5} locale={locale as "en" | "fa"} />
        </div>
      </section>
    </div>
  );
}
