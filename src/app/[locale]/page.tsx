import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-zinc-900">
          {t("title")}
        </h1>
        <p className="text-base leading-7 text-zinc-600">{t("subtitle")}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white">
          {t("ctaPrimary")}
        </button>
        <button className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900">
          {t("ctaSecondary")}
        </button>
      </div>
    </section>
  );
}
