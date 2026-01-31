"use client";

import { useTranslations } from "next-intl";

export function MapLegend() {
  const t = useTranslations("map");

  return (
    <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur p-3 rounded-lg shadow-lg z-[1000] text-sm">
      <h4 className="font-semibold mb-2 text-xs">{t("victimsCount")}</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#7f1d1d" }} />
          <span className="text-xs">150+</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#991b1b" }} />
          <span className="text-xs">100-149</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#dc2626" }} />
          <span className="text-xs">50-99</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} />
          <span className="text-xs">20-49</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "#fca5a5" }} />
          <span className="text-xs">1-19</span>
        </div>
      </div>
    </div>
  );
}
