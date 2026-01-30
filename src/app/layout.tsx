import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Vazirmatn, Crimson_Pro } from "next/font/google";
import { defaultLocale, locales } from "@/i18n/config";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});
export const metadata: Metadata = {
  title: "Gard-e Javidan",
  description:
    "Public accountability archive for documenting regime members and victims with verification and audit logs.",
  icons: {
    icon: "/JAVID_SHAH.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-next-intl-locale");
  const localeCandidate = headerLocale ?? defaultLocale;
  const locale =
    locales.find((item) => item === localeCandidate) ?? defaultLocale;
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} ${crimsonPro.variable} antialiased`}
        dir={dir}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
