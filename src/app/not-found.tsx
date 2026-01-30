import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="border-2 rounded-lg p-12 space-y-6 bg-card">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <svg
              className="h-10 w-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* 404 Number */}
          <div className="relative py-4">
            <h1 className="text-8xl font-bold text-muted/30">404</h1>
            <p className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">
              Page not found
            </p>
          </div>

          {/* Bilingual Description */}
          <div className="space-y-2 text-muted-foreground">
            <p className="text-base">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
            <p className="text-base" dir="rtl" lang="fa">
              صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/en"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to home (English)
            </Link>
            <Link
              href="/fa"
              className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              dir="rtl"
            >
              بازگشت به صفحه اصلی (فارسی)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
