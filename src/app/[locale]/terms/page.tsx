"use client";

import { useLocale, useTranslations } from "next-intl";

export default function TermsPage() {
  const locale = useLocale();
  const t = useTranslations("terms");
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <section className="mx-auto max-w-3xl space-y-8" dir={direction}>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-6 text-sm leading-7 text-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.purpose.title")}</h2>
          <p className="text-muted-foreground">{t("sections.purpose.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.conduct.title")}</h2>
          <p className="text-muted-foreground">{t("sections.conduct.body")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("sections.conduct.items.0")}</li>
            <li>{t("sections.conduct.items.1")}</li>
            <li>{t("sections.conduct.items.2")}</li>
            <li>{t("sections.conduct.items.3")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.verification.title")}</h2>
          <p className="text-muted-foreground">{t("sections.verification.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.removal.title")}</h2>
          <p className="text-muted-foreground">{t("sections.removal.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.liability.title")}</h2>
          <p className="text-muted-foreground">{t("sections.liability.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.changes.title")}</h2>
          <p className="text-muted-foreground">{t("sections.changes.body")}</p>
        </section>
      </div>
    </section>
  );
}
