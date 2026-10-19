"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";

export function NavLinks({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/rankings", label: t.nav.rankings },
    { href: "/game-day", label: t.nav.gameDay },
  ];

  return (
    <nav className={`gap-1 ${className}`}>
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors md:py-2 ${
              active ? "border-green text-green" : "border-transparent text-muted hover:text-green"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
