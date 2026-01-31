"use client";

import { useLocale, useTranslations } from "next-intl";

export default function GuidePage() {
  const locale = useLocale();
  const t = useTranslations("guide");
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <section className="mx-auto max-w-3xl space-y-8" dir={direction}>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-6 text-sm leading-7 text-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.mission.title")}</h2>
          <p className="text-muted-foreground">{t("sections.mission.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.how.title")}</h2>
          <p className="text-muted-foreground">{t("sections.how.body")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("sections.how.items.0")}</li>
            <li>{t("sections.how.items.1")}</li>
            <li>{t("sections.how.items.2")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">
            {t("sections.verification.title")}
          </h2>
          <p className="text-muted-foreground">{t("sections.verification.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.anonymity.title")}</h2>
          <p className="text-muted-foreground">{t("sections.anonymity.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.what.title")}</h2>
          <p className="text-muted-foreground">{t("sections.what.body")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("sections.what.items.0")}</li>
            <li>{t("sections.what.items.1")}</li>
            <li>{t("sections.what.items.2")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.safety.title")}</h2>
          <p className="text-muted-foreground">{t("sections.safety.body")}</p>
        </section>
      </div>
    </section>
  );
}
