import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Cinzel, Inter, Noto_Sans_KR } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["500", "600", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Korean glyphs are split into many unicode-range files; let the browser fetch only what it needs.
const notoKr = Noto_Sans_KR({ variable: "--font-noto-kr", weight: ["400", "500", "700"], preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.meta.title, template: `%s · KAN Tennis` },
    description: t.meta.description,
    icons: { icon: "/logo.png", apple: "/logo.png" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#154D2E" },
    { media: "(prefers-color-scheme: dark)", color: "#0a110d" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang } = await getI18n();
  // No cookie → no data-theme, and CSS follows the device's light/dark setting.
  const theme = (await cookies()).get(THEME_COOKIE)?.value;

  return (
    <html
      lang={lang}
      data-theme={isTheme(theme) ? theme : undefined}
      className={`${cinzel.variable} ${inter.variable} ${notoKr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider lang={lang}>
          <AuthModalProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthModalProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
