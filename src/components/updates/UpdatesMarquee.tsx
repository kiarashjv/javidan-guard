"use client";

import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { Marquee } from "@/components/shadcn-space/animations/marquee";
import { api } from "@/lib/convex-api";

export const UpdatesMarquee = memo(function UpdatesMarquee() {
  const t = useTranslations("updates");
  const feed = useQuery(api.recent.feed, { limit: 12 });

  // Memoize items to prevent re-creating array on every render
  const items = useMemo(
    () => feed?.map((item) => `${item.title} · ${item.subtitle}`) ?? [],
    [feed]
  );

  const content = items.length > 0 ? items : [t("marqueeEmpty")];

  return (
    <div className="border-b bg-black">
      <div className="mx-auto max-w-7xl w-full px-4 py-2 md:px-6">
        <div className="flex items-center gap-3 text-xs text-white/70">
          <span className="uppercase tracking-wide text-white/90">
            {t("marqueeTitle")}
          </span>
          <div className="relative flex-1 overflow-hidden">
            <Marquee pauseOnHover duration="24s" gap="2rem" className="py-1">
              {content.map((text, index) => (
                <span
                  key={`${text}-${index}`}
                  className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-white"
                >
                  {text}
                  <span className="text-white/30">•</span>
                </span>
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black to-transparent" />
          </div>
          <span className="text-[11px] text-white/60">
            {feed === undefined ? t("marqueeLoading") : t("marqueeLive")}
          </span>
        </div>
      </div>
    </div>
  );
});
