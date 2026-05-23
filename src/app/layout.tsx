import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { WelcomeSplash } from "@/components/layout/WelcomeSplash";
import { getAuthState } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinLux — Digital Luxury Finance",
  description: "Manage accounts, cards, invoices and shared expenses with style.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

// Synchronously toggles `data-splash="dismissed"` on <html> before paint when
// the splash flag is already present, so returning tab visits never flash the
// overlay. Lives outside React so it runs during HTML parsing.
const SPLASH_PRECHECK_SCRIPT = `(function(){try{if(sessionStorage.getItem('finlux_splash_shown')==='1'){document.documentElement.dataset.splash='dismissed';}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages, authState] = await Promise.all([
    getLocale(),
    getMessages(),
    getAuthState(),
  ]);
  // Splash only plays once the sign-in is fully complete — never during a
  // pending second-factor challenge.
  const showSplashGate = authState.user !== null && !authState.mfaPending;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_PRECHECK_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {showSplashGate ? <WelcomeSplash /> : null}
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
