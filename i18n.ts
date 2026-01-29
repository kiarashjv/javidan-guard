import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./src/i18n/config";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`./src/messages/${resolvedLocale}.json`)).default,
  };
});
