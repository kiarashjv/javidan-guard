"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <div className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">Language</span>
      {locales.map((target) => {
        const isActive = target === locale;
        const href = switchLocalePath(pathname, target);

        return (
          <Link
            key={target}
            href={href}
            className={
              isActive
                ? "rounded-full bg-zinc-900 px-3 py-1 text-white"
                : "rounded-full border border-zinc-300 px-3 py-1 text-zinc-700"
            }
          >
            {target.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
