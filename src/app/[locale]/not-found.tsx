"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Home, Search, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";

export default function NotFound() {
  const t = useTranslations("notFoundPage");
  const locale = useLocale();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="border-2">
          <CardHeader className="space-y-6 py-12">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <FileQuestion className="h-10 w-10 text-muted-foreground" />
            </div>

            {/* 404 Number */}
            <div className="relative py-4">
              <h1 className="text-8xl font-bold text-muted/30">
                {t("subtitle")}
              </h1>
              <p className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">
                {t("title")}
              </p>
            </div>

            {/* Description */}
            <CardDescription className="text-base max-w-md mx-auto">
              {t("description")}
            </CardDescription>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild size="lg">
                <Link href={`/${locale}`} className="gap-2">
                  <Home className="h-4 w-4" />
                  {t("home")}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/${locale}/regime-members`} className="gap-2">
                  <Search className="h-4 w-4" />
                  {t("browse")}
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
