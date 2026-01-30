"use client";

import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  duration?: string;
  gap?: string;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  duration = "40s",
  gap = "1rem",
  children,
  ...props
}: MarqueeProps) {
  return (
    <>
      {/* Inline CSS */}
      <style>{`
        @keyframes marquee-ltr {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - ${gap} / 2)); }
        }
        @keyframes marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(50% + ${gap} / 2)); }
        }
        @keyframes marquee-vertical {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(-50% - ${gap} / 2)); }
        }

        .marquee {
          display: flex;
          gap: ${gap};
          width: fit-content;
          animation-duration: ${duration};
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-direction: ${reverse ? "reverse" : "normal"};
        }

        .marquee-ltr {
          animation-name: marquee-ltr;
        }

        .marquee-rtl {
          animation-name: marquee-rtl;
        }

        .marquee-vertical {
          display: flex;
          flex-direction: column;
          height: fit-content;
          animation: marquee-vertical ${duration} linear infinite;
          animation-direction: ${reverse ? "reverse" : "normal"};
        }

        .marquee-hover:hover,
        .marquee-vertical-hover:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        {...props}
        className={cn(
          "overflow-hidden flex",
          vertical ? "flex-col" : "flex-row",
          className,
        )}
      >
        <div
          className={cn(
            "marquee marquee-rtl",
            vertical
              ? pauseOnHover
                ? "marquee-vertical-hover marquee-vertical"
                : "marquee-vertical"
              : pauseOnHover
                ? "marquee-hover"
                : "",
          )}
        >
          <div className="flex shrink-0" style={{ gap }}>
            {children}
          </div>
          <div className="flex shrink-0" style={{ gap }} aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
