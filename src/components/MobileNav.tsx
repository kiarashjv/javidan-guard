"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Archive, BookOpen, Clock, Crosshair, Crown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Crosshair;
};

export function MobileNav() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const direction = locale === "fa" ? "rtl" : "ltr";

  const items: NavItem[] = [
    {
      href: `/${locale}/regime-members`,
      label: t("regimeMembers"),
      Icon: Crosshair,
    },
    {
      href: `/${locale}/victims`,
      label: t("victims"),
      Icon: Crown,
    },
    {
      href: `/${locale}/actions`,
      label: t("actions"),
      Icon: Archive,
    },
    {
      href: `/${locale}/pending`,
      label: t("pending"),
      Icon: Clock,
    },
    {
      href: `/${locale}/guide`,
      label: t("guide"),
      Icon: BookOpen,
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("menu")}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={direction === "rtl" ? "right" : "left"}
        className="w-72"
        dir={direction}
      >
        <SheetHeader
          className={direction === "rtl" ? "text-right" : "text-left"}
        >
          <SheetTitle>{t("menu")}</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1" dir={direction}>
          {items.map(({ href, label, Icon }) => (
            <SheetClose asChild key={href}>
              <Link
                href={href}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  direction === "rtl"
                    ? "flex-row-reverse justify-end text-right"
                    : "justify-start text-left"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
