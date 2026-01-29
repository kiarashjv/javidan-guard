"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <div className="flex items-center gap-2">
      {locales.map((target) => {
        const isActive = target === locale;
        const href = switchLocalePath(pathname, target);

        return (
          <Button
            key={target}
            asChild
            variant={isActive ? "default" : "ghost"}
            size="sm"
          >
            <Link href={href}>{target.toUpperCase()}</Link>
          </Button>
        );
      })}
    </div>
  );
}
