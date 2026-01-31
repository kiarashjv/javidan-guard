"use client";

import { usePathname } from "next/navigation";
import { UpdatesSidebar } from "@/components/updates/UpdatesSidebar";

type PageShellProps = {
  locale: string;
  children: React.ReactNode;
};

export function PageShell({ locale, children }: PageShellProps) {
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">{children}</div>
      <aside className="hidden lg:block">
        <UpdatesSidebar />
      </aside>
    </div>
  );
}
