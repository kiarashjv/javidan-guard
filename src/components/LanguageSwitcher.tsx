"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { locales, type Locale } from "@/i18n/config";

function switchLocalePath(pathname: string, locale: Locale) {
  const segments = pathname.split("/");
  const current = segments[1];

  if (locales.includes(current as Locale)) {
    segments[1] = locale;
    return segments.join("/") || "/";
  }

  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">{t("language")}</span>
      {locales.map((target) => {
        const isActive = target === locale;
        const href = switchLocalePath(pathname, target);

        return (
          <Button
            key={target}
            asChild
            variant={isActive ? "default" : "outline"}
            size="xs"
          >
            <Link href={href}>{target.toUpperCase()}</Link>
          </Button>
        );
      })}
    </div>
  );
}
