"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const locale = useLocale();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="border-2 border-destructive/50">
          <CardHeader className="space-y-6 py-12">
            {/* Error Icon */}
            <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <CardTitle className="text-3xl">{t("title")}</CardTitle>
              <CardDescription className="text-lg">
                {t("subtitle")}
              </CardDescription>
            </div>

            {/* Description */}
            <CardDescription className="text-base max-w-md mx-auto">
              {t("description")}
            </CardDescription>

            {/* Error details (in development) */}
            {process.env.NODE_ENV === "development" && (
              <Alert variant="destructive" className="text-left max-w-xl mx-auto">
                <AlertDescription className="font-mono text-xs break-all">
                  {error.message}
                  {error.digest && (
                    <div className="mt-2 opacity-70">
                      Digest: {error.digest}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={reset} size="lg" className="gap-2">
                <RotateCw className="h-4 w-4" />
                {t("retry")}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/${locale}`} className="gap-2">
                  <Home className="h-4 w-4" />
                  {t("home")}
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
