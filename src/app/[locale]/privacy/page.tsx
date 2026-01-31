"use client";

import { useLocale, useTranslations } from "next-intl";

export default function PrivacyPage() {
  const locale = useLocale();
  const t = useTranslations("privacy");
  const direction = locale === "fa" ? "rtl" : "ltr";

  return (
    <section className="mx-auto max-w-3xl space-y-8" dir={direction}>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-6 text-sm leading-7 text-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.scope.title")}</h2>
          <p className="text-muted-foreground">{t("sections.scope.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.collection.title")}</h2>
          <p className="text-muted-foreground">{t("sections.collection.body")}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>{t("sections.collection.items.0")}</li>
            <li>{t("sections.collection.items.1")}</li>
            <li>{t("sections.collection.items.2")}</li>
            <li>{t("sections.collection.items.3")}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.cookies.title")}</h2>
          <p className="text-muted-foreground">{t("sections.cookies.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.storage.title")}</h2>
          <p className="text-muted-foreground">{t("sections.storage.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.security.title")}</h2>
          <p className="text-muted-foreground">{t("sections.security.body")}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("sections.contact.title")}</h2>
          <p className="text-muted-foreground">{t("sections.contact.body")}</p>
        </section>
      </div>
    </section>
  );
}
